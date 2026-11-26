/**
 * @module lib/validation
 * Runtime input validation and sanitization for the `/api/analyze` endpoint.
 * Enforces required fields, enum allowlists, control-character & prompt
 * delimiter stripping, string length caps, and telemetry sanity checks.
 */

import type {
  CommuteMode,
  FamilyMember,
  HomeType,
  LiveEnvironmentalData,
  RoutineInput,
  SensitivityGroup,
} from "../types/air-quality.ts";
import { COMMUTE_MODES, HOME_TYPES, SENSITIVITIES } from "./presets.ts";

/** Result returned by {@link validateRoutinePayload}. */
export interface ValidationResult {
  /** Whether the payload passed validation. */
  valid: boolean;
  /** Descriptive validation failure message when `valid` is false. */
  error?: string;
  /** Sanitized, bounded routine payload when `valid` is true. */
  sanitized?: RoutineInput;
}

const MAX_CITY_LENGTH = 120;
const MAX_CONDITION_LENGTH = 200;
const MAX_SCHEDULE_LENGTH = 2000;
const MAX_NOTES_LENGTH = 500;
const MAX_FAMILY_MEMBERS = 15;
const MIN_SCHEDULE_LENGTH = 10;

const HOME_TYPE_SET = new Set<string>(HOME_TYPES);
const COMMUTE_MODE_SET = new Set<string>(COMMUTE_MODES);
const SENSITIVITY_SET = new Set<string>(SENSITIVITIES);

/**
 * Strips ASCII control characters and neutralizes markdown/XML prompt-injection
 * delimiters from untrusted user text.
 */
export function sanitizeText(
  value: unknown,
  maxLength: number,
  allowNewlines = false
): string {
  if (typeof value !== "string") return "";

  const controlPattern = allowNewlines
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;

  return value
    .replace(controlPattern, " ")
    .replace(/```+/g, "'")
    .replace(/<\/?user_[^>]+>/gi, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and sanitizes household member entries against supported sensitivity groups.
 */
function sanitizeFamilyMembers(raw: unknown): FamilyMember[] {
  if (!Array.isArray(raw)) return [];

  const sanitized: FamilyMember[] = [];
  for (let i = 0; i < raw.length && sanitized.length < MAX_FAMILY_MEMBERS; i += 1) {
    const entry = raw[i];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const item = entry as Record<string, unknown>;

    const label = sanitizeText(item.label, 50) || `Member ${sanitized.length + 1}`;
    const ageGroup = sanitizeText(item.ageGroup, 30) || "Adult";
    const sensitivity: SensitivityGroup = SENSITIVITY_SET.has(
      String(item.sensitivity ?? "")
    )
      ? (item.sensitivity as SensitivityGroup)
      : "Healthy Adult";
    const id = sanitizeText(item.id, 40) || `m-${sanitized.length + 1}`;

    sanitized.push({ id, label, ageGroup, sensitivity });
  }

  return sanitized;
}

/**
 * Validates optional client-supplied telemetry object to ensure numeric bounds
 * and clean string fields; drops malformed payloads so server fetches fresh data.
 */
function sanitizeTelemetry(raw: unknown): LiveEnvironmentalData | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  const numericFields = [
    obj.latitude,
    obj.longitude,
    obj.usAqi,
    obj.pm25,
    obj.pm10,
    obj.no2,
    obj.o3,
    obj.temperatureC,
    obj.humidityPercent,
    obj.windSpeedKmh,
  ];

  if (numericFields.some((val) => typeof val !== "number" || !Number.isFinite(val))) {
    return null;
  }

  const resolvedLocation = sanitizeText(obj.resolvedLocation, 120);
  const autoConditionSummary = sanitizeText(obj.autoConditionSummary, 240);
  const fetchedAt = sanitizeText(obj.fetchedAt, 64);

  if (!resolvedLocation || !autoConditionSummary) return null;

  return {
    resolvedLocation,
    latitude: Number(obj.latitude),
    longitude: Number(obj.longitude),
    usAqi: Math.max(0, Math.min(1000, Math.round(Number(obj.usAqi)))),
    pm25: Math.max(0, Number(obj.pm25)),
    pm10: Math.max(0, Number(obj.pm10)),
    no2: Math.max(0, Number(obj.no2)),
    o3: Math.max(0, Number(obj.o3)),
    temperatureC: Number(obj.temperatureC),
    humidityPercent: Math.max(0, Math.min(100, Math.round(Number(obj.humidityPercent)))),
    windSpeedKmh: Math.max(0, Number(obj.windSpeedKmh)),
    autoConditionSummary,
    fetchedAt: fetchedAt || new Date().toISOString(),
  };
}

/**
 * Validates and sanitizes incoming `/api/analyze` request payloads.
 *
 * Enforces plain-object payloads, required fields (`city`, `dailySchedule`),
 * runtime enum allowlists, control-character sanitization, and safe bounds.
 *
 * @param body - Untrusted request body payload.
 * @returns Validation result containing either `error` or `sanitized` input.
 */
export function validateRoutinePayload(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      error: "Request body must be a JSON object.",
    };
  }

  const raw = body as Partial<RoutineInput>;
  const city = sanitizeText(raw.city, MAX_CITY_LENGTH);
  const dailySchedule = sanitizeText(raw.dailySchedule, MAX_SCHEDULE_LENGTH, true);

  if (!city) {
    return {
      valid: false,
      error: "Please enter your city or metro area.",
    };
  }

  if (!dailySchedule || dailySchedule.length < MIN_SCHEDULE_LENGTH) {
    return {
      valid: false,
      error:
        "Please describe your daily schedule or routine (at least 10 characters) so we can tailor recommendations.",
    };
  }

  const homeType: HomeType = HOME_TYPE_SET.has(String(raw.homeType ?? ""))
    ? (raw.homeType as HomeType)
    : "Apartment (High-Rise)";

  const commuteMode: CommuteMode = COMMUTE_MODE_SET.has(
    String(raw.commuteMode ?? "")
  )
    ? (raw.commuteMode as CommuteMode)
    : "Private Car (Petrol/Diesel)";

  const additionalNotes = sanitizeText(raw.additionalNotes, MAX_NOTES_LENGTH, true);

  return {
    valid: true,
    sanitized: {
      city,
      conditionContext: sanitizeText(raw.conditionContext, MAX_CONDITION_LENGTH),
      homeType,
      commuteMode,
      familyMembers: sanitizeFamilyMembers(raw.familyMembers),
      dailySchedule,
      additionalNotes: additionalNotes || undefined,
      liveTelemetry: sanitizeTelemetry(raw.liveTelemetry),
    },
  };
}
