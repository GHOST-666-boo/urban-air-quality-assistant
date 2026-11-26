/**
 * @module types/air-quality
 * Core TypeScript type definitions for the Urban Air Quality Assistant,
 * defining all data structures for household inputs, live environmental
 * telemetry, AQI risk summaries, low-emission routines, indoor air hacks,
 * health/environmental impact breakdowns, and the complete plan response.
 */

/** US EPA AQI health risk category, ranging from "Good" (0–50) to "Hazardous" (301+). */
export type AqiCategory =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous";

/** Health sensitivity group for household members. */
export type SensitivityGroup =
  | "Healthy Adult"
  | "Child / Infant"
  | "Elderly (65+)"
  | "Asthma / Respiratory"
  | "Cardiovascular"
  | "Pregnant";

/** Type of residential dwelling. */
export type HomeType =
  | "Apartment (High-Rise)"
  | "Apartment (Low-Rise / Ground)"
  | "Independent House"
  | "Townhouse / Duplex"
  | "Studio / Shared Flat";

/** Primary daily commute transportation mode. */
export type CommuteMode =
  | "Private Car (Petrol/Diesel)"
  | "Electric Vehicle (EV)"
  | "Two-Wheeler / Scooter"
  | "Public Bus / Metro"
  | "Walking / Cycling"
  | "Work From Home / Hybrid";

/** A single household member with age and health sensitivity metadata. */
export interface FamilyMember {
  /** Unique identifier for the member. */
  id: string;
  /** Display label (e.g., "Child", "Grandmother"). */
  label: string;
  /** Human-readable age (e.g., "7 yrs", "65 yrs"). */
  ageGroup: string;
  /** Health sensitivity classification for AQI-tailored advice. */
  sensitivity: SensitivityGroup;
}

/** Real-time air quality and weather data fetched from Open-Meteo APIs. */
export interface LiveEnvironmentalData {
  /** Resolved location name from geocoding (e.g., "New Delhi, Delhi"). */
  resolvedLocation: string;
  /** Geographic latitude of the resolved location. */
  latitude: number;
  /** Geographic longitude of the resolved location. */
  longitude: number;
  /** Current US EPA Air Quality Index value. */
  usAqi: number;
  /** PM2.5 fine particulate concentration in µg/m³. */
  pm25: number;
  /** PM10 coarse particulate concentration in µg/m³. */
  pm10: number;
  /** Nitrogen dioxide (NO₂) concentration in µg/m³. */
  no2: number;
  /** Ground-level ozone (O₃) concentration in µg/m³. */
  o3: number;
  /** Current temperature in degrees Celsius. */
  temperatureC: number;
  /** Relative humidity as a percentage. */
  humidityPercent: number;
  /** Wind speed in kilometers per hour. */
  windSpeedKmh: number;
  /** Auto-generated human-readable condition summary string. */
  autoConditionSummary: string;
  /** ISO 8601 timestamp when this data was fetched. */
  fetchedAt: string;
}

/** User-submitted household routine profile for air quality analysis. */
export interface RoutineInput {
  /** City or metro area name. */
  city: string;
  /** Seasonal or air quality condition context (e.g., "Winter Smog"). */
  conditionContext: string;
  /** Type of residential dwelling. */
  homeType: HomeType;
  /** Primary daily commute mode. */
  commuteMode: CommuteMode;
  /** Array of household members with sensitivity metadata. */
  familyMembers: FamilyMember[];
  /** Free-text daily schedule and habits description. */
  dailySchedule: string;
  /** Optional additional notes or budget constraints. */
  additionalNotes?: string;
  /** Optional live environmental telemetry attached from Open-Meteo. */
  liveTelemetry?: LiveEnvironmentalData | null;
}

/** City-level AQI risk summary with pollutant and timing data. */
export interface AqiRiskSummary {
  /** City or metro area name. */
  city: string;
  /** Estimated current US AQI numeric value. */
  estimatedAqi: number;
  /** US EPA AQI health risk category. */
  aqiCategory: AqiCategory;
  /** List of primary pollutants of concern. */
  primaryPollutants: string[];
  /** Time windows with highest pollution exposure risk. */
  peakRiskWindows: string[];
  /** Plain-language health advisory summary. */
  advisorySummary: string;
}

/** A single low-emission routine recommendation with impact metrics. */
export interface LowEmissionRoutineItem {
  /** Unique item identifier. */
  id: string;
  /** Descriptive title of the routine shift. */
  title: string;
  /** Time window this recommendation applies to. */
  timeWindow: string;
  /** Description of the user's current habit being addressed. */
  currentHabit: string;
  /** Specific recommended action or behavioral shift. */
  recommendedAction: string;
  /** Feasibility rating for adopting this change. */
  feasibility: "Easy" | "Moderate" | "Lifestyle Shift";
  /** Estimated weekly CO₂ emissions saved in kilograms. */
  estimatedCo2SavedKgPerWeek: number;
  /** Estimated percentage reduction in pollution exposure. */
  exposureReductionPercent: number;
  /** Category of the routine (Commute, Errands, Energy, Outdoor). */
  category: "Commute" | "Errands & Tasks" | "Energy & Home" | "Outdoor Activity";
}

/** A single indoor air quality improvement recommendation. */
export interface IndoorAirHackItem {
  /** Unique item identifier. */
  id: string;
  /** Descriptive title of the indoor air hack. */
  title: string;
  /** Cost tier classification. */
  costTier: "Free" | "Low-Cost" | "Moderate";
  /** Target pollutant or pollutant class. */
  targetPollutant: string;
  /** Step-by-step implementation instructions. */
  actionSteps: string[];
  /** Science-grounded explanation of why this technique works. */
  whyItWorks: string;
  /** Whether this hack is specifically optimized for winter smog conditions. */
  winterSmogSpecific: boolean;
}

/** Health and environmental impact explanation for a recommendation. */
export interface ImpactBreakdownItem {
  /** Unique item identifier. */
  id: string;
  /** Reference to the recommendation this impact explains. */
  recommendationRef: string;
  /** Plain-language health impact explanation. */
  healthImpactPlainLanguage: string;
  /** Plain-language environmental impact explanation. */
  environmentalImpactPlainLanguage: string;
  /** Key pollutant or emission metric affected. */
  pollutantOrEmissionMetric: string;
  /** Primary beneficiary group for this recommendation. */
  beneficiaryGroup: string;
}

/** Complete structured response from the air quality analysis engine. */
export interface AirQualityPlanResponse {
  /** City-level AQI risk assessment and advisory. */
  aqiRiskSummary: AqiRiskSummary;
  /** Array of tailored low-emission routine recommendations. */
  lowEmissionRoutines: LowEmissionRoutineItem[];
  /** Array of indoor air quality improvement hacks. */
  indoorAirHacks: IndoorAirHackItem[];
  /** Array of health and environmental impact explanations. */
  impactBreakdown: ImpactBreakdownItem[];
  /** Immediate same-day actionable quick wins. */
  quickWins: string[];
  /** Optional live environmental telemetry attached to this response. */
  liveTelemetry?: LiveEnvironmentalData | null;
  /** Metadata about the generation source, model, and timing. */
  metadata: {
    /** Whether this plan was generated by Gemini AI or the fallback engine. */
    source: "gemini" | "fallback";
    /** Model name or engine identifier used. */
    model: string;
    /** ISO 8601 timestamp when this plan was generated. */
    generatedAt: string;
    /** Reason for falling back to the deterministic engine, if applicable. */
    fallbackReason?: string;
  };
}
