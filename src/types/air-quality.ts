export type AqiCategory =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous";

export type SensitivityGroup =
  | "Healthy Adult"
  | "Child / Infant"
  | "Elderly (65+)"
  | "Asthma / Respiratory"
  | "Cardiovascular"
  | "Pregnant";

export type HomeType =
  | "Apartment (High-Rise)"
  | "Apartment (Low-Rise / Ground)"
  | "Independent House"
  | "Townhouse / Duplex"
  | "Studio / Shared Flat";

export type CommuteMode =
  | "Private Car (Petrol/Diesel)"
  | "Electric Vehicle (EV)"
  | "Two-Wheeler / Scooter"
  | "Public Bus / Metro"
  | "Walking / Cycling"
  | "Work From Home / Hybrid";

export interface FamilyMember {
  id: string;
  label: string;
  ageGroup: string;
  sensitivity: SensitivityGroup;
}

export interface LiveEnvironmentalData {
  resolvedLocation: string;
  latitude: number;
  longitude: number;
  usAqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  autoConditionSummary: string;
  fetchedAt: string;
}

export interface RoutineInput {
  city: string;
  conditionContext: string;
  homeType: HomeType;
  commuteMode: CommuteMode;
  familyMembers: FamilyMember[];
  dailySchedule: string;
  additionalNotes?: string;
  liveTelemetry?: LiveEnvironmentalData | null;
}

export interface AqiRiskSummary {
  city: string;
  estimatedAqi: number;
  aqiCategory: AqiCategory;
  primaryPollutants: string[];
  peakRiskWindows: string[];
  advisorySummary: string;
}

export interface LowEmissionRoutineItem {
  id: string;
  title: string;
  timeWindow: string;
  currentHabit: string;
  recommendedAction: string;
  feasibility: "Easy" | "Moderate" | "Lifestyle Shift";
  estimatedCo2SavedKgPerWeek: number;
  exposureReductionPercent: number;
  category: "Commute" | "Errands & Tasks" | "Energy & Home" | "Outdoor Activity";
}

export interface IndoorAirHackItem {
  id: string;
  title: string;
  costTier: "Free" | "Low-Cost" | "Moderate";
  targetPollutant: string;
  actionSteps: string[];
  whyItWorks: string;
  winterSmogSpecific: boolean;
}

export interface ImpactBreakdownItem {
  id: string;
  recommendationRef: string;
  healthImpactPlainLanguage: string;
  environmentalImpactPlainLanguage: string;
  pollutantOrEmissionMetric: string;
  beneficiaryGroup: string;
}

export interface AirQualityPlanResponse {
  aqiRiskSummary: AqiRiskSummary;
  lowEmissionRoutines: LowEmissionRoutineItem[];
  indoorAirHacks: IndoorAirHackItem[];
  impactBreakdown: ImpactBreakdownItem[];
  quickWins: string[];
  liveTelemetry?: LiveEnvironmentalData | null;
  metadata: {
    source: "gemini" | "fallback";
    model: string;
    generatedAt: string;
    fallbackReason?: string;
  };
}
