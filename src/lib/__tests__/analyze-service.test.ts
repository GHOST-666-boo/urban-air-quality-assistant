/**
 * @module lib/__tests__/analyze-service.test
 * End-to-end controller tests for `/api/analyze` and `/api/live-aqi` service
 * logic, covering status codes (`200`, `400`, `404`, `413`, `429`), security headers,
 * telemetry grounding, and fallback response guarantees.
 */

import test, { mock } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_BODY_SIZE_BYTES,
  processAnalyzeRequest,
  processLiveAqiRequest,
} from "../analyze-service.ts";
import { defaultRateLimiter } from "../rate-limit.ts";

test("processAnalyzeRequest rejects invalid payloads with HTTP 400 and rate headers", async () => {
  defaultRateLimiter.reset();
  const res = await processAnalyzeRequest(
    { city: "", dailySchedule: "too short" },
    new Headers({ "x-forwarded-for": "10.0.0.10" })
  );

  assert.equal(res.status, 400);
  assert.ok("error" in res.body);
  assert.equal(res.headers["X-RateLimit-Limit"], "20");
});

test("processAnalyzeRequest rejects oversized content-length with HTTP 413", async () => {
  defaultRateLimiter.reset();
  const res = await processAnalyzeRequest(
    { city: "Delhi", dailySchedule: "Morning commute and evening walk" },
    new Headers({
      "x-forwarded-for": "10.0.0.11",
      "content-length": String(MAX_BODY_SIZE_BYTES + 1024),
    })
  );

  assert.equal(res.status, 413);
  assert.ok("error" in res.body);
});

test("processAnalyzeRequest returns HTTP 200 with grounded plan and no-store cache headers", async () => {
  defaultRateLimiter.reset();
  const prevKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "";

  const fetchMock = mock.method(globalThis, "fetch", async () => {
    return new Response(JSON.stringify({ results: [] }), { status: 200 });
  });

  try {
    const res = await processAnalyzeRequest(
      {
        city: "New Delhi, India",
        dailySchedule: "7:30 AM drive to office, 6:30 PM grocery run and gas cooking",
      },
      new Headers({ "x-forwarded-for": "10.0.0.12" })
    );

    assert.equal(res.status, 200);
    assert.equal(res.headers["Cache-Control"], "private, no-store, max-age=0");
    assert.ok(!("error" in res.body));
    if (!("error" in res.body)) {
      assert.equal(res.body.metadata.source, "fallback");
      assert.ok(res.body.lowEmissionRoutines.length >= 3);
    }
  } finally {
    fetchMock.mock.restore();
    if (prevKey !== undefined) {
      process.env.GEMINI_API_KEY = prevKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  }
});

test("processAnalyzeRequest enforces 429 rate limiting after quota exhaustion", async () => {
  defaultRateLimiter.reset();
  const headers = new Headers({ "x-forwarded-for": "10.0.0.99" });

  for (let i = 0; i < 20; i += 1) {
    const res = await processAnalyzeRequest({ city: "" }, headers);
    assert.equal(res.status, 400);
  }

  const limited = await processAnalyzeRequest({ city: "" }, headers);
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers["Retry-After"]) >= 1);
});

test("processLiveAqiRequest handles 400 missing city, 404 unknown city, and 200 success", async () => {
  defaultRateLimiter.reset();
  const headers = new Headers({ "x-forwarded-for": "10.0.0.50" });

  const missing = await processLiveAqiRequest(null, headers);
  assert.equal(missing.status, 400);

  const notFoundMock = mock.method(globalThis, "fetch", async () => {
    return new Response(JSON.stringify({ results: [] }), { status: 200 });
  });
  try {
    const notFound = await processLiveAqiRequest("UnknownCity999", headers);
    assert.equal(notFound.status, 404);
  } finally {
    notFoundMock.mock.restore();
  }

  const successMock = mock.method(globalThis, "fetch", async (url: string | URL | Request) => {
    const urlStr = String(url);
    if (urlStr.includes("geocoding-api")) {
      return new Response(
        JSON.stringify({
          results: [{ name: "Mumbai", admin1: "Maharashtra", latitude: 19.07, longitude: 72.87 }],
        }),
        { status: 200 }
      );
    }
    if (urlStr.includes("air-quality-api")) {
      return new Response(JSON.stringify({ current: { us_aqi: 140, pm2_5: 55.2 } }), { status: 200 });
    }
    return new Response(
      JSON.stringify({ current: { temperature_2m: 28.5, relative_humidity_2m: 65, wind_speed_10m: 12.0 } }),
      { status: 200 }
    );
  });

  try {
    const okRes = await processLiveAqiRequest("Mumbai", headers);
    assert.equal(okRes.status, 200);
    assert.ok(okRes.headers["Cache-Control"]?.includes("s-maxage=300"));
    if (!("error" in okRes.body)) {
      assert.equal(okRes.body.usAqi, 140);
      assert.equal(okRes.body.resolvedLocation, "Mumbai, Maharashtra");
    }
  } finally {
    successMock.mock.restore();
  }
});
