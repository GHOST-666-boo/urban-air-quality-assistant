/**
 * @module lib/analyze-service
 * Transport-agnostic controller logic for `/api/analyze` and `/api/live-aqi`.
 * Decouples HTTP status, rate limiting, payload size enforcement, validation,
 * and telemetry grounding from Next.js Route Handler wrappers for direct unit testing.
 */

import type {
  AirQualityPlanResponse,
  LiveEnvironmentalData,
} from "../types/air-quality.ts";
import { fetchLiveCityAirAndWeather } from "./air-quality-api.ts";
import { generateAirQualityPlan, redactSecrets } from "./gemini.ts";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  getClientIp,
} from "./rate-limit.ts";
import { sanitizeText, validateRoutinePayload } from "./validation.ts";

/** Maximum allowed request body size in bytes (50 KB). */
export const MAX_BODY_SIZE_BYTES = 50 * 1024;

/** Maximum allowed city query parameter length. */
export const MAX_CITY_QUERY_LENGTH = 120;

const ANALYZE_MAX_REQUESTS = 20;
const ANALYZE_WINDOW_MS = 60_000;
const LIVE_AQI_MAX_REQUESTS = 30;
const LIVE_AQI_WINDOW_MS = 60_000;

/** Standardized service response structure consumed by Next.js Route Handlers. */
export interface ServiceResponse<T> {
  status: number;
  body: T | { error: string };
  headers: Record<string, string>;
}

/**
 * Executes the `/api/analyze` workflow: rate limit check, size check, validation,
 * live Open-Meteo telemetry enrichment, and Gemini/fallback plan generation.
 *
 * @param rawBody - Parsed JSON body payload from the client.
 * @param headers - Request HTTP headers used for client IP & Content-Length checks.
 * @returns Structured HTTP status, body, and security/rate-limit headers.
 */
export async function processAnalyzeRequest(
  rawBody: unknown,
  headers: Headers
): Promise<ServiceResponse<AirQualityPlanResponse>> {
  const clientIp = getClientIp(headers);
  const rateLimit = checkRateLimit({
    key: `analyze:${clientIp}`,
    maxRequests: ANALYZE_MAX_REQUESTS,
    windowMs: ANALYZE_WINDOW_MS,
  });
  const rateHeaders = buildRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return {
      status: 429,
      body: {
        error:
          "Too many analysis requests. Please wait a few seconds and try again.",
      },
      headers: rateHeaders,
    };
  }

  const contentLength = Number(headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_SIZE_BYTES) {
    return {
      status: 413,
      body: {
        error: "Request body too large. Maximum allowed size is 50 KB.",
      },
      headers: rateHeaders,
    };
  }

  const validation = validateRoutinePayload(rawBody);
  if (!validation.valid || !validation.sanitized) {
    return {
      status: 400,
      body: { error: validation.error || "Invalid request payload." },
      headers: rateHeaders,
    };
  }

  try {
    const sanitized = validation.sanitized;
    const liveTelemetry =
      sanitized.liveTelemetry ||
      (await fetchLiveCityAirAndWeather(sanitized.city));

    const plan = await generateAirQualityPlan({
      ...sanitized,
      conditionContext:
        sanitized.conditionContext ||
        liveTelemetry?.autoConditionSummary ||
        "Winter Smog / High AQI",
      liveTelemetry,
    });

    return {
      status: 200,
      body: plan,
      headers: {
        ...rateHeaders,
        "Cache-Control": "private, no-store, max-age=0",
      },
    };
  } catch (error) {
    const safeMessage = redactSecrets(
      error instanceof Error ? error.message : "Unknown server error"
    );
    console.error("[/api/analyze Error]:", safeMessage);

    return {
      status: 500,
      body: {
        error:
          "Unable to process your request right now. Please check your input and try again.",
      },
      headers: rateHeaders,
    };
  }
}

/**
 * Executes the `/api/live-aqi` workflow: rate limit check, city sanitization,
 * and live Open-Meteo lookup with 5-minute CDN caching headers.
 *
 * @param cityParam - Raw `city` query parameter string.
 * @param headers - Request HTTP headers used for client IP extraction.
 * @returns Structured HTTP status, body, and caching/rate-limit headers.
 */
export async function processLiveAqiRequest(
  cityParam: string | null,
  headers: Headers
): Promise<ServiceResponse<LiveEnvironmentalData>> {
  const clientIp = getClientIp(headers);
  const rateLimit = checkRateLimit({
    key: `live-aqi:${clientIp}`,
    maxRequests: LIVE_AQI_MAX_REQUESTS,
    windowMs: LIVE_AQI_WINDOW_MS,
  });
  const rateHeaders = buildRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return {
      status: 429,
      body: { error: "Too many live AQI lookups. Please wait a moment." },
      headers: rateHeaders,
    };
  }

  const city = sanitizeText(cityParam, MAX_CITY_QUERY_LENGTH);
  if (!city) {
    return {
      status: 400,
      body: { error: "City query parameter is required." },
      headers: rateHeaders,
    };
  }

  const telemetry = await fetchLiveCityAirAndWeather(city);
  if (!telemetry) {
    return {
      status: 404,
      body: {
        error:
          "Could not fetch live weather/AQI for that city. You can still enter conditions manually.",
      },
      headers: rateHeaders,
    };
  }

  return {
    status: 200,
    body: telemetry,
    headers: {
      ...rateHeaders,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  };
}
