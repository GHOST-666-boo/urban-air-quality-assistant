/**
 * @module lib/__tests__/air-quality.test
 * Comprehensive unit test suite covering AQI classification, mocked Open-Meteo
 * telemetry lookup, deterministic fallback planning, secret redaction,
 * structured prompt construction, runtime schema validation, and Gemini failover.
 */

import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { classifyUsAqi, fetchLiveCityAirAndWeather } from "../air-quality-api.ts";
import { buildFallbackPlan } from "../fallback.ts";
import {
  buildUserPrompt,
  generateAirQualityPlan,
  isValidPlanShape,
  redactSecrets,
} from "../gemini.ts";

test("classifyUsAqi maps all EPA AQI boundary thresholds accurately", () => {
  assert.equal(classifyUsAqi(0), "Good");
  assert.equal(classifyUsAqi(50), "Good");
  assert.equal(classifyUsAqi(51), "Moderate");
  assert.equal(classifyUsAqi(100), "Moderate");
  assert.equal(classifyUsAqi(101), "Unhealthy for Sensitive Groups");
  assert.equal(classifyUsAqi(150), "Unhealthy for Sensitive Groups");
  assert.equal(classifyUsAqi(151), "Unhealthy");
  assert.equal(classifyUsAqi(200), "Unhealthy");
  assert.equal(classifyUsAqi(201), "Very Unhealthy");
  assert.equal(classifyUsAqi(300), "Very Unhealthy");
  assert.equal(classifyUsAqi(301), "Hazardous");
});

test("classifyUsAqi handles extreme and negative values", () => {
  assert.equal(classifyUsAqi(-10), "Good");
  assert.equal(classifyUsAqi(500), "Hazardous");
  assert.equal(classifyUsAqi(999), "Hazardous");
});

test("fetchLiveCityAirAndWeather returns null for empty city without fetching", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    throw new Error("Should not call fetch for blank input");
  });
  try {
    const result = await fetchLiveCityAirAndWeather("   ");
    assert.equal(result, null);
    assert.equal(fetchMock.mock.callCount(), 0);
  } finally {
    fetchMock.mock.restore();
  }
});

test("fetchLiveCityAirAndWeather resolves city coordinates, AQI, and weather concurrently", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (url: string | URL | Request) => {
    const urlStr = String(url);
    if (urlStr.includes("geocoding-api.open-meteo.com")) {
      return new Response(
        JSON.stringify({
          results: [
            {
              name: "New Delhi",
              admin1: "Delhi",
              country: "India",
              latitude: 28.6139,
              longitude: 77.209,
            },
          ],
        }),
        { status: 200 }
      );
    }
    if (urlStr.includes("air-quality-api.open-meteo.com")) {
      return new Response(
        JSON.stringify({
          current: {
            us_aqi: 215,
            pm2_5: 145.67,
            pm10: 210.24,
            nitrogen_dioxide: 48.3,
            ozone: 22.1,
          },
        }),
        { status: 200 }
      );
    }
    return new Response(
      JSON.stringify({
        current: {
          temperature_2m: 14.8,
          relative_humidity_2m: 72,
          wind_speed_10m: 3.6,
        },
      }),
      { status: 200 }
    );
  });

  try {
    const telemetry = await fetchLiveCityAirAndWeather("New Delhi, India");
    assert.ok(telemetry !== null);
    assert.equal(telemetry.resolvedLocation, "New Delhi, Delhi");
    assert.equal(telemetry.usAqi, 215);
    assert.equal(telemetry.pm25, 145.7);
    assert.equal(telemetry.pm10, 210.2);
    assert.equal(telemetry.windSpeedKmh, 3.6);
    assert.ok(telemetry.autoConditionSummary.includes("Very Unhealthy"));
    assert.ok(telemetry.autoConditionSummary.includes("Stagnant air"));
    assert.equal(fetchMock.mock.callCount(), 3);
  } finally {
    fetchMock.mock.restore();
  }
});

test("fetchLiveCityAirAndWeather returns null when geocoding yields no matches or errors", async () => {
  const emptyMock = mock.method(globalThis, "fetch", async () => {
    return new Response(JSON.stringify({ results: [] }), { status: 200 });
  });
  try {
    assert.equal(await fetchLiveCityAirAndWeather("NonexistentPlaceXYZ"), null);
  } finally {
    emptyMock.mock.restore();
  }

  const failMock = mock.method(globalThis, "fetch", async () => {
    throw new Error("Network timeout");
  });
  try {
    assert.equal(await fetchLiveCityAirAndWeather("Mumbai"), null);
  } finally {
    failMock.mock.restore();
  }
});

test("buildFallbackPlan grounds AQI summary in live telemetry when available", () => {
  const plan = buildFallbackPlan(
    {
      city: "New Delhi, India",
      conditionContext: "Winter Smog",
      homeType: "Apartment (Low-Rise / Ground)",
      commuteMode: "Private Car (Petrol/Diesel)",
      familyMembers: [
        {
          id: "m1",
          label: "Child",
          ageGroup: "7 yrs",
          sensitivity: "Asthma / Respiratory",
        },
      ],
      dailySchedule: "7:30 AM school drop-off, 9 AM commute",
      liveTelemetry: {
        resolvedLocation: "New Delhi, Delhi",
        latitude: 28.61,
        longitude: 77.21,
        usAqi: 242,
        pm25: 192.4,
        pm10: 260.1,
        no2: 45.2,
        o3: 18.0,
        temperatureC: 14.5,
        humidityPercent: 68,
        windSpeedKmh: 4.1,
        autoConditionSummary: "Live US AQI 242 (Very Unhealthy)",
        fetchedAt: "2026-11-25T09:00:00.000Z",
      },
    },
    "Test fallback"
  );

  assert.equal(plan.aqiRiskSummary.estimatedAqi, 242);
  assert.equal(plan.aqiRiskSummary.aqiCategory, "Very Unhealthy");
  assert.ok(plan.lowEmissionRoutines.length >= 3);
  assert.ok(plan.indoorAirHacks.length >= 3);
  assert.ok(plan.impactBreakdown.length >= 3);
  assert.ok(plan.quickWins.length >= 3);
  assert.equal(plan.metadata.source, "fallback");
  assert.equal(plan.liveTelemetry?.usAqi, 242);
});

test("buildFallbackPlan adapts commute advice for public transit vs private car", () => {
  const transitPlan = buildFallbackPlan(
    {
      city: "London, UK",
      conditionContext: "Morning Traffic",
      homeType: "Apartment (High-Rise)",
      commuteMode: "Public Bus / Metro",
      familyMembers: [
        {
          id: "m1",
          label: "Adult",
          ageGroup: "32 yrs",
          sensitivity: "Healthy Adult",
        },
      ],
      dailySchedule: "8:30 AM tube commute, 6:00 PM walk home",
    },
    "Transit test"
  );

  assert.equal(
    transitPlan.aqiRiskSummary.aqiCategory,
    "Unhealthy for Sensitive Groups"
  );
  assert.ok(
    transitPlan.lowEmissionRoutines[0].title.includes("Transit"),
    "Expected transit-tailored routine title"
  );
});

test("buildFallbackPlan uses city heuristics when liveTelemetry is absent", () => {
  const delhiPlan = buildFallbackPlan(
    {
      city: "New Delhi",
      conditionContext: "Winter Smog",
      homeType: "Independent House",
      commuteMode: "Private Car (Petrol/Diesel)",
      familyMembers: [],
      dailySchedule: "Morning commute and evening return",
    },
    "No telemetry"
  );

  assert.equal(delhiPlan.aqiRiskSummary.estimatedAqi, 285);
  assert.equal(delhiPlan.aqiRiskSummary.aqiCategory, "Very Unhealthy");
  assert.ok(delhiPlan.aqiRiskSummary.primaryPollutants.includes("PM2.5"));

  const genericPlan = buildFallbackPlan(
    {
      city: "Unknown City",
      conditionContext: "Normal",
      homeType: "Studio / Shared Flat",
      commuteMode: "Walking / Cycling",
      familyMembers: [],
      dailySchedule: "Walk to work and back",
    },
    "Generic fallback"
  );

  assert.equal(genericPlan.aqiRiskSummary.estimatedAqi, 135);
});

test("buildFallbackPlan includes sensitive member names in advisory", () => {
  const plan = buildFallbackPlan(
    {
      city: "Mumbai",
      conditionContext: "Haze",
      homeType: "Apartment (High-Rise)",
      commuteMode: "Public Bus / Metro",
      familyMembers: [
        {
          id: "m1",
          label: "Grandpa",
          ageGroup: "72 yrs",
          sensitivity: "Cardiovascular",
        },
        {
          id: "m2",
          label: "Toddler",
          ageGroup: "3 yrs",
          sensitivity: "Child / Infant",
        },
      ],
      dailySchedule: "Morning metro commute and afternoon errands",
    },
    "Sensitive member test"
  );

  assert.ok(plan.aqiRiskSummary.advisorySummary.includes("Grandpa"));
  assert.ok(plan.aqiRiskSummary.advisorySummary.includes("Toddler"));
  assert.ok(plan.impactBreakdown[0].beneficiaryGroup.includes("Grandpa"));
});

test("isValidPlanShape validates structured LLM payloads and rejects malformed input", () => {
  const validPlan = buildFallbackPlan(
    {
      city: "Mumbai, India",
      conditionContext: "Urban Haze",
      homeType: "Apartment (High-Rise)",
      commuteMode: "Electric Vehicle (EV)",
      familyMembers: [],
      dailySchedule: "9 AM commute and evening errands",
    },
    "Schema check"
  );

  assert.equal(isValidPlanShape(validPlan), true);
  assert.equal(isValidPlanShape(null), false);
  assert.equal(isValidPlanShape(undefined), false);
  assert.equal(isValidPlanShape("invalid"), false);
  assert.equal(isValidPlanShape(42), false);
  assert.equal(isValidPlanShape([]), false);
  assert.equal(isValidPlanShape({}), false);
  assert.equal(isValidPlanShape({ aqiRiskSummary: {} }), false);
  assert.equal(
    isValidPlanShape({
      ...validPlan,
      aqiRiskSummary: [],
    }),
    false
  );
  assert.equal(
    isValidPlanShape({
      ...validPlan,
      lowEmissionRoutines: [],
    }),
    false
  );
  assert.equal(
    isValidPlanShape({
      ...validPlan,
      indoorAirHacks: [],
    }),
    false
  );
  assert.equal(
    isValidPlanShape({
      ...validPlan,
      impactBreakdown: [],
    }),
    false
  );
});

test("buildUserPrompt injects household sensitivities, XML delimiters, and live telemetry", () => {
  const prompt = buildUserPrompt({
    city: "New Delhi",
    conditionContext: "Winter Smog",
    homeType: "Independent House",
    commuteMode: "Two-Wheeler / Scooter",
    familyMembers: [
      {
        id: "1",
        label: "Grandfather",
        ageGroup: "70 yrs",
        sensitivity: "Elderly (65+)",
      },
    ],
    dailySchedule: "Morning walk at 6 AM",
    liveTelemetry: {
      resolvedLocation: "New Delhi, Delhi",
      latitude: 28.61,
      longitude: 77.21,
      usAqi: 185,
      pm25: 112.5,
      pm10: 150.2,
      no2: 34.1,
      o3: 41.0,
      temperatureC: 19.2,
      humidityPercent: 52,
      windSpeedKmh: 3.4,
      autoConditionSummary: "Live US AQI 185",
      fetchedAt: "2026-11-26T04:00:00.000Z",
    },
  });

  assert.ok(prompt.includes("Grandfather (70 yrs, Sensitivity: Elderly (65+))"));
  assert.ok(prompt.includes("Live US AQI: 185"));
  assert.ok(prompt.includes("PM2.5: 112.5"));
  assert.ok(prompt.includes("<user_schedule>"));
  assert.ok(prompt.includes("</user_schedule>"));
  assert.ok(prompt.includes("<user_notes>"));
});

test("buildUserPrompt handles empty family members and missing additionalNotes", () => {
  const prompt = buildUserPrompt({
    city: "Berlin",
    conditionContext: "Summer",
    homeType: "Townhouse / Duplex",
    commuteMode: "Walking / Cycling",
    familyMembers: [],
    dailySchedule: "Walk to office at 8:30 AM",
    additionalNotes: undefined,
  });

  assert.ok(prompt.includes("1 Healthy Adult"));
  assert.ok(prompt.includes("None provided"));
  assert.ok(!prompt.includes("Live US AQI"));
});

test("redactSecrets masks API key tokens and query parameters", () => {
  const leaked =
    "Request failed at https://generativelanguage.googleapis.com?key=AIzaSyDummyKeyValue1234567890 with status 400";
  const safe = redactSecrets(leaked);
  assert.equal(safe.includes("AIzaSy"), false);
  assert.ok(safe.includes("[REDACTED]"));
});

test("generateAirQualityPlan falls back gracefully when GEMINI_API_KEY is unset", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "";
  try {
    const plan = await generateAirQualityPlan({
      city: "New Delhi",
      conditionContext: "Winter Smog",
      homeType: "Apartment (High-Rise)",
      commuteMode: "Private Car (Petrol/Diesel)",
      familyMembers: [],
      dailySchedule: "8 AM office commute and 6 PM return",
    });

    assert.equal(plan.metadata.source, "fallback");
    assert.ok(plan.metadata.fallbackReason?.includes("GEMINI_API_KEY"));
    assert.ok(plan.lowEmissionRoutines.length > 0);
    assert.ok(plan.indoorAirHacks.length > 0);
    assert.ok(plan.impactBreakdown.length > 0);
    assert.ok(plan.quickWins.length > 0);
  } finally {
    if (previousKey !== undefined) {
      process.env.GEMINI_API_KEY = previousKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  }
});

test("generateAirQualityPlan returns valid schema shape from fallback", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "";
  try {
    const plan = await generateAirQualityPlan({
      city: "Jakarta",
      conditionContext: "Urban Haze",
      homeType: "Independent House",
      commuteMode: "Two-Wheeler / Scooter",
      familyMembers: [
        {
          id: "m1",
          label: "Baby",
          ageGroup: "1 yr",
          sensitivity: "Child / Infant",
        },
      ],
      dailySchedule: "Morning scooter commute, afternoon cooking",
    });

    assert.equal(isValidPlanShape(plan), true);
    assert.equal(typeof plan.aqiRiskSummary.city, "string");
    assert.equal(typeof plan.aqiRiskSummary.estimatedAqi, "number");
    assert.ok(plan.aqiRiskSummary.primaryPollutants.length > 0);
    assert.ok(plan.aqiRiskSummary.peakRiskWindows.length > 0);
  } finally {
    if (previousKey !== undefined) {
      process.env.GEMINI_API_KEY = previousKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  }
});
