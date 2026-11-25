import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AirQualityPlanResponse, RoutineInput } from "@/types/air-quality";
import { buildFallbackPlan } from "./fallback";

const SYSTEM_INSTRUCTION = `You are an expert Urban Air Quality & Environmental Health Specialist.
Your mission is to analyze a user's or family's daily routine, home type, commute mode, and city/seasonal context, and produce a practical, hyper-tailored action plan.

Guidelines:
1. Separate your guidance cleanly into:
   - AQI Risk Summary (realistic urban AQI estimate & category for the given city/condition, primary pollutants, peak inversion/rush-hour windows, and a clear advisory).
   - Low-Emission Routines (practical commute, errands, energy, and outdoor timing shifts that reduce carbon footprint AND personal pollution exposure).
   - Indoor Air Quality (AQI) Hacks (actionable, low-cost/free techniques tailored to the user's home type and winter smog/high AQI conditions).
   - Health & Environmental Impact Breakdown (plain-language, transparent cause-and-effect insights explaining how each change protects health and cuts emissions).
   - Quick Wins (3-5 immediate actions for today).
2. Be realistic, empathetic, non-alarmist, and concrete. Avoid vague advice like "save the planet" or "buy an expensive system" unless paired with free/low-cost alternatives.
3. Explicitly account for sensitive family members (children, elderly, asthma, cardiovascular, pregnant) if present.
4. Always return valid JSON strictly matching the provided schema.`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    aqiRiskSummary: {
      type: Type.OBJECT,
      properties: {
        city: { type: Type.STRING },
        estimatedAqi: { type: Type.INTEGER },
        aqiCategory: {
          type: Type.STRING,
          enum: [
            "Good",
            "Moderate",
            "Unhealthy for Sensitive Groups",
            "Unhealthy",
            "Very Unhealthy",
            "Hazardous",
          ],
        },
        primaryPollutants: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        peakRiskWindows: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        advisorySummary: { type: Type.STRING },
      },
      required: [
        "city",
        "estimatedAqi",
        "aqiCategory",
        "primaryPollutants",
        "peakRiskWindows",
        "advisorySummary",
      ],
    },
    lowEmissionRoutines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          timeWindow: { type: Type.STRING },
          currentHabit: { type: Type.STRING },
          recommendedAction: { type: Type.STRING },
          feasibility: {
            type: Type.STRING,
            enum: ["Easy", "Moderate", "Lifestyle Shift"],
          },
          estimatedCo2SavedKgPerWeek: { type: Type.NUMBER },
          exposureReductionPercent: { type: Type.INTEGER },
          category: {
            type: Type.STRING,
            enum: [
              "Commute",
              "Errands & Tasks",
              "Energy & Home",
              "Outdoor Activity",
            ],
          },
        },
        required: [
          "id",
          "title",
          "timeWindow",
          "currentHabit",
          "recommendedAction",
          "feasibility",
          "estimatedCo2SavedKgPerWeek",
          "exposureReductionPercent",
          "category",
        ],
      },
    },
    indoorAirHacks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          costTier: {
            type: Type.STRING,
            enum: ["Free", "Low-Cost", "Moderate"],
          },
          targetPollutant: { type: Type.STRING },
          actionSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          whyItWorks: { type: Type.STRING },
          winterSmogSpecific: { type: Type.BOOLEAN },
        },
        required: [
          "id",
          "title",
          "costTier",
          "targetPollutant",
          "actionSteps",
          "whyItWorks",
          "winterSmogSpecific",
        ],
      },
    },
    impactBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          recommendationRef: { type: Type.STRING },
          healthImpactPlainLanguage: { type: Type.STRING },
          environmentalImpactPlainLanguage: { type: Type.STRING },
          pollutantOrEmissionMetric: { type: Type.STRING },
          beneficiaryGroup: { type: Type.STRING },
        },
        required: [
          "id",
          "recommendationRef",
          "healthImpactPlainLanguage",
          "environmentalImpactPlainLanguage",
          "pollutantOrEmissionMetric",
          "beneficiaryGroup",
        ],
      },
    },
    quickWins: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "aqiRiskSummary",
    "lowEmissionRoutines",
    "indoorAirHacks",
    "impactBreakdown",
    "quickWins",
  ],
};

function buildUserPrompt(input: RoutineInput): string {
  const membersText =
    input.familyMembers.length > 0
      ? input.familyMembers
          .map((m) => `- ${m.label} (${m.ageGroup}, Sensitivity: ${m.sensitivity})`)
          .join("\n")
      : "- 1 Healthy Adult";

  const telemetryBlock = input.liveTelemetry
    ? `\n### Verified Live Weather & Air Quality Telemetry (Open-Meteo)
- Resolved Location: ${input.liveTelemetry.resolvedLocation}
- Live US AQI: ${input.liveTelemetry.usAqi}
- PM2.5: ${input.liveTelemetry.pm25} µg/m³ | PM10: ${input.liveTelemetry.pm10} µg/m³
- NO2: ${input.liveTelemetry.no2} µg/m³ | Ozone (O3): ${input.liveTelemetry.o3} µg/m³
- Weather: ${input.liveTelemetry.temperatureC}°C, ${input.liveTelemetry.humidityPercent}% Humidity, Wind ${input.liveTelemetry.windSpeedKmh} km/h
IMPORTANT: Ground your \`aqiRiskSummary.estimatedAqi\`, \`aqiCategory\`, \`primaryPollutants\`, and ventilation/indoor advice directly in this live telemetry.\n`
    : "";

  return `Analyze this household's urban air quality profile and daily routine, then generate a structured action plan.

### Location & Conditions
- City / Metro Area: ${input.city}
- Seasonal / Air Quality Context: ${input.conditionContext}
- Home Type: ${input.homeType}
- Primary Commute Mode: ${input.commuteMode}
${telemetryBlock}
### Household Members
${membersText}

### Daily Schedule & Routine
${input.dailySchedule}

### Additional Notes / Constraints
${input.additionalNotes?.trim() || "None provided"}

Provide 3 concise Low-Emission Routines, 3 practical Indoor Air Quality Hacks (prioritizing winter smog & low-cost options), 3 transparent Health & Environmental Impact Breakdown items, and 3 Quick Wins. Keep every description crisp (1-2 sentences) for fast reading.`;
}

function isValidPlanShape(data: unknown): data is Omit<AirQualityPlanResponse, "metadata"> {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.aqiRiskSummary === "object" &&
    candidate.aqiRiskSummary !== null &&
    Array.isArray(candidate.lowEmissionRoutines) &&
    candidate.lowEmissionRoutines.length > 0 &&
    Array.isArray(candidate.indoorAirHacks) &&
    candidate.indoorAirHacks.length > 0 &&
    Array.isArray(candidate.impactBreakdown) &&
    candidate.impactBreakdown.length > 0 &&
    Array.isArray(candidate.quickWins)
  );
}

function isTransientOverloadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.toLowerCase().includes("high demand")
  );
}

export async function generateAirQualityPlan(
  input: RoutineInput
): Promise<AirQualityPlanResponse> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const primaryModel =
    process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
  const modelCandidates = Array.from(
    new Set([primaryModel, "gemini-3.5-flash-lite", "gemini-3.8-flash"])
  );

  if (!apiKey) {
    return buildFallbackPlan(
      input,
      "GEMINI_API_KEY is not configured in .env.local — showing smart offline baseline plan."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = buildUserPrompt(input);
  let lastErrorMessage = "Unknown Gemini API error";

  for (const modelName of modelCandidates) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.3,
            maxOutputTokens: 1400,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${modelName} timed out (8s)`)), 8000)
        ),
      ]);

      const rawText = response.text;
      if (!rawText) {
        lastErrorMessage = `${modelName} returned an empty response.`;
        continue;
      }

      const parsed = JSON.parse(rawText);
      if (!isValidPlanShape(parsed)) {
        lastErrorMessage = `${modelName} response did not match expected schema.`;
        continue;
      }

      return {
        ...parsed,
        liveTelemetry: input.liveTelemetry ?? null,
        metadata: {
          source: "gemini",
          model: modelName,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      lastErrorMessage =
        error instanceof Error ? error.message : "Unknown Gemini API error";
      if (isTransientOverloadError(error)) {
        console.warn(`[Gemini Fast-Failover]: ${modelName} busy, trying next...`);
        continue;
      }
      console.error("[Gemini Service Error]:", lastErrorMessage);
    }
  }

  return buildFallbackPlan(
    input,
    `Gemini API temporarily busy (${lastErrorMessage.slice(0, 100)}) — showing smart offline baseline plan.`
  );
}
