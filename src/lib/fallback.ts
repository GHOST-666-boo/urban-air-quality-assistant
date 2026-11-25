import type {
  AirQualityPlanResponse,
  AqiCategory,
  RoutineInput,
} from "../types/air-quality.ts";
import { classifyUsAqi } from "./air-quality-api.ts";

function estimateCityBaselineAqi(city: string, conditionContext: string): {
  aqi: number;
  category: AqiCategory;
  pollutants: string[];
} {
  const normalized = `${city} ${conditionContext}`.toLowerCase();

  if (
    normalized.includes("delhi") ||
    normalized.includes("lahore") ||
    normalized.includes("dhaka") ||
    normalized.includes("winter smog") ||
    normalized.includes("severe")
  ) {
    return {
      aqi: 285,
      category: "Very Unhealthy",
      pollutants: ["PM2.5", "PM10", "NO2", "CO"],
    };
  }

  if (
    normalized.includes("mumbai") ||
    normalized.includes("beijing") ||
    normalized.includes("jakarta") ||
    normalized.includes("smog") ||
    normalized.includes("haze")
  ) {
    return {
      aqi: 168,
      category: "Unhealthy",
      pollutants: ["PM2.5", "NO2", "O3"],
    };
  }

  if (
    normalized.includes("los angeles") ||
    normalized.includes("london") ||
    normalized.includes("paris") ||
    normalized.includes("traffic")
  ) {
    return {
      aqi: 112,
      category: "Unhealthy for Sensitive Groups",
      pollutants: ["NO2", "PM2.5", "O3"],
    };
  }

  return {
    aqi: 135,
    category: "Unhealthy for Sensitive Groups",
    pollutants: ["PM2.5", "NO2", "PM10"],
  };
}

export function buildFallbackPlan(
  input: RoutineInput,
  fallbackReason: string
): AirQualityPlanResponse {
  const live = input.liveTelemetry;
  const baseline = live
    ? {
        aqi: live.usAqi,
        category: classifyUsAqi(live.usAqi),
        pollutants: [
          `PM2.5 (${live.pm25} µg/m³)`,
          `PM10 (${live.pm10} µg/m³)`,
          `NO2 (${live.no2} µg/m³)`,
          `O3 (${live.o3} µg/m³)`,
        ],
      }
    : estimateCityBaselineAqi(input.city, input.conditionContext);
  const hasSensitive = input.familyMembers.some(
    (m) => m.sensitivity !== "Healthy Adult"
  );
  const sensitiveNames = input.familyMembers
    .filter((m) => m.sensitivity !== "Healthy Adult")
    .map((m) => `${m.label} (${m.sensitivity})`)
    .join(", ");

  const isPrivateVehicle =
    input.commuteMode.includes("Private Car") ||
    input.commuteMode.includes("Two-Wheeler");

  return {
    aqiRiskSummary: {
      city: input.city || "Urban Metro Area",
      estimatedAqi: baseline.aqi,
      aqiCategory: baseline.category,
      primaryPollutants: baseline.pollutants,
      peakRiskWindows: [
        "06:30 AM – 09:30 AM (Morning temperature inversion & rush hour)",
        "06:00 PM – 10:30 PM (Evening traffic + stagnant winter air)",
      ],
      advisorySummary: hasSensitive
        ? `Elevated urban particulate levels in ${input.city || "your area"} pose heightened risk for ${sensitiveNames}. Shift outdoor errands to mid-afternoon (1:00 PM – 4:00 PM) when atmospheric mixing peaks, and seal indoor spaces during morning/evening inversions.`
        : `Moderate-to-high urban particulate levels in ${input.city || "your area"} require limiting prolonged outdoor exertion during rush-hour inversion windows and prioritizing clean indoor air filtration.`,
    },
    lowEmissionRoutines: [
      {
        id: "routine-1",
        title: isPrivateVehicle
          ? "Shift Rush-Hour Commute to Metro / Carpool + Off-Peak Buffer"
          : "Optimize Transit Timing Around Inversion Windows",
        timeWindow: "07:30 AM – 09:30 AM",
        currentHabit: `Using ${input.commuteMode} during peak morning traffic.`,
        recommendedAction: isPrivateVehicle
          ? "Replace 2–3 solo trips/week with Metro/Bus or carpooling, and use cabin air recirculation mode when stuck in traffic."
          : "Wear a fitted N95/KN95 mask on platforms/walkways and shift flexible departures after 10:00 AM when possible.",
        feasibility: "Easy",
        estimatedCo2SavedKgPerWeek: isPrivateVehicle ? 14.5 : 4.2,
        exposureReductionPercent: 38,
        category: "Commute",
      },
      {
        id: "routine-2",
        title: "Batch Errands into a Single Mid-Afternoon Loop",
        timeWindow: "01:30 PM – 03:30 PM",
        currentHabit: "Scattered short trips for groceries, pickups, and chores.",
        recommendedAction:
          "Consolidate errands into one mid-afternoon trip when solar warming disperses ground-level PM2.5, avoiding cold-start engine emissions.",
        feasibility: "Easy",
        estimatedCo2SavedKgPerWeek: 5.8,
        exposureReductionPercent: 25,
        category: "Errands & Tasks",
      },
      {
        id: "routine-3",
        title: "Move Outdoor Exercise Indoors on High-AQI Days",
        timeWindow: "06:00 AM – 08:00 AM",
        currentHabit: "Morning outdoor walks or runs during peak winter smog.",
        recommendedAction:
          "Swap early-morning outdoor workouts for indoor bodyweight/yoga routines, or move walks to 2:00 PM – 4:00 PM.",
        feasibility: "Moderate",
        estimatedCo2SavedKgPerWeek: 1.5,
        exposureReductionPercent: 52,
        category: "Outdoor Activity",
      },
    ],
    indoorAirHacks: [
      {
        id: "hack-1",
        title: "DIY Corsi-Rosenthal Box or HEPA-Grade Fan Filter",
        costTier: "Low-Cost",
        targetPollutant: "PM2.5 & Fine Soot",
        actionSteps: [
          "Tape a MERV-13 furnace filter (or 4-filter cube) to the back of a standard 20-inch box fan.",
          "Run on medium speed in the main living room or bedroom for 2 hours before sleep.",
        ],
        whyItWorks:
          "Delivers clean air delivery rates (CADR) comparable to commercial HEPA purifiers at a fraction of the cost.",
        winterSmogSpecific: true,
      },
      {
        id: "hack-2",
        title: "Door-Sweep & Window-Gap Wet-Towel / Foam Sealing",
        costTier: "Free",
        targetPollutant: "Infiltrating Outdoor Smog (PM2.5 / NO2)",
        actionSteps: [
          "Check main door and window frames in your " +
            input.homeType +
            " for drafts.",
          "Apply inexpensive foam weatherstripping or place rolled damp towels at bottom door gaps during overnight smog peaks.",
        ],
        whyItWorks:
          "Reduces passive infiltration of cold, pollutant-dense outside air by up to 40% during nighttime inversions.",
        winterSmogSpecific: true,
      },
      {
        id: "hack-3",
        title: "Wet-Mopping & Cooking Exhaust Discipline",
        costTier: "Free",
        targetPollutant: "Resuspended Dust, NO2 & Cooking Aerosols",
        actionSteps: [
          "Replace dry sweeping with damp microfiber mopping to trap settled fine particulates.",
          "Always run the kitchen exhaust hood (or crack a single kitchen window briefly) while frying or using gas stoves.",
        ],
        whyItWorks:
          "Dry sweeping re-aerosolizes settled PM10/PM2.5; gas cooking spikes indoor NO2 above outdoor levels.",
        winterSmogSpecific: false,
      },
    ],
    impactBreakdown: [
      {
        id: "impact-1",
        recommendationRef: "Commute & Recirculation Shift",
        healthImpactPlainLanguage:
          "Cuts deep-lung PM2.5 inhalation during congested traffic by nearly 40%, reducing airway inflammation and morning coughing.",
        environmentalImpactPlainLanguage:
          "Eliminates cold-engine idling and tailpipe NOx/CO2 emissions in dense urban corridors.",
        pollutantOrEmissionMetric: "~14.5 kg CO2/week saved; ~38% lower PM2.5 dose",
        beneficiaryGroup: hasSensitive
          ? sensitiveNames
          : "All commuting household members",
      },
      {
        id: "impact-2",
        recommendationRef: "Mid-Afternoon Errand Batching",
        healthImpactPlainLanguage:
          "Avoids breathing trapped morning/evening inversion smog when pollutant concentrations are 2–3x higher than mid-afternoon.",
        environmentalImpactPlainLanguage:
          "Fewer cold-start vehicle trips reduce fuel burn and catalytic converter warm-up emissions.",
        pollutantOrEmissionMetric: "~5.8 kg CO2/week saved; 25% lower peak exposure",
        beneficiaryGroup: "Entire household",
      },
      {
        id: "impact-3",
        recommendationRef: "Indoor Sealing + Low-Cost Filtration",
        healthImpactPlainLanguage:
          "Keeps sleeping-room PM2.5 low overnight, protecting lung recovery for children, seniors, and sensitive sleepers.",
        environmentalImpactPlainLanguage:
          "Low-wattage box-fan filtration and weatherstripping also reduce winter heating energy loss.",
        pollutantOrEmissionMetric: "40–65% indoor PM2.5 reduction",
        beneficiaryGroup: hasSensitive ? sensitiveNames : "All household members",
      },
    ],
    quickWins: [
      "Switch car AC to 'Recirculate' on congested roads.",
      "Wet-mop floors instead of dry-sweeping today.",
      "Schedule outdoor walks between 1:30 PM and 4:00 PM.",
      "Run kitchen exhaust during every cooking session.",
    ],
    liveTelemetry: live ?? null,
    metadata: {
      source: "fallback",
      model: "deterministic-urban-aqi-v1",
      generatedAt: new Date().toISOString(),
      fallbackReason,
    },
  };
}
