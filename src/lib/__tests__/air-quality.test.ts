import test from "node:test";
import assert from "node:assert/strict";
import { classifyUsAqi } from "../air-quality-api.ts";
import { buildFallbackPlan } from "../fallback.ts";

test("classifyUsAqi maps EPA AQI thresholds accurately", () => {
  assert.equal(classifyUsAqi(25), "Good");
  assert.equal(classifyUsAqi(75), "Moderate");
  assert.equal(classifyUsAqi(125), "Unhealthy for Sensitive Groups");
  assert.equal(classifyUsAqi(175), "Unhealthy");
  assert.equal(classifyUsAqi(250), "Very Unhealthy");
  assert.equal(classifyUsAqi(350), "Hazardous");
});

test("buildFallbackPlan produces complete structured plan grounded in live telemetry", () => {
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
