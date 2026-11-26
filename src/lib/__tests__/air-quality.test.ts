import test from "node:test";
import assert from "node:assert/strict";
import { classifyUsAqi } from "../air-quality-api.ts";
import { buildFallbackPlan } from "../fallback.ts";
import {
  buildUserPrompt,
  generateAirQualityPlan,
  isValidPlanShape,
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
  assert.equal(isValidPlanShape("invalid"), false);
  assert.equal(isValidPlanShape({ aqiRiskSummary: {} }), false);
  assert.equal(
    isValidPlanShape({
      ...validPlan,
      lowEmissionRoutines: [],
    }),
    false
  );
});

test("buildUserPrompt injects household sensitivities and live telemetry", () => {
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
  } finally {
    if (previousKey !== undefined) {
      process.env.GEMINI_API_KEY = previousKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  }
});
