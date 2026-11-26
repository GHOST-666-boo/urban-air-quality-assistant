/**
 * @module lib/presets
 * Pre-defined option lists and one-tap scenario presets for the household
 * routine input form. Also shared by runtime input validation as the canonical
 * allowlist source of truth.
 */

import type {
  CommuteMode,
  HomeType,
  RoutineInput,
  SensitivityGroup,
} from "../types/air-quality.ts";

/** All supported residential dwelling types. */
export const HOME_TYPES: readonly HomeType[] = [
  "Apartment (High-Rise)",
  "Apartment (Low-Rise / Ground)",
  "Independent House",
  "Townhouse / Duplex",
  "Studio / Shared Flat",
] as const;

/** All supported daily commute transportation modes. */
export const COMMUTE_MODES: readonly CommuteMode[] = [
  "Private Car (Petrol/Diesel)",
  "Electric Vehicle (EV)",
  "Two-Wheeler / Scooter",
  "Public Bus / Metro",
  "Walking / Cycling",
  "Work From Home / Hybrid",
] as const;

/** All supported household member health sensitivity groups. */
export const SENSITIVITIES: readonly SensitivityGroup[] = [
  "Healthy Adult",
  "Child / Infant",
  "Elderly (65+)",
  "Asthma / Respiratory",
  "Cardiovascular",
  "Pregnant",
] as const;

/**
 * Pre-built sample scenarios for one-tap form population.
 * Each preset provides a complete {@link RoutineInput} profile
 * representing a realistic urban household.
 */
export const SCENARIO_PRESETS: readonly { label: string; data: RoutineInput }[] =
  [
    {
      label: "Delhi Winter Smog Family",
      data: {
        city: "New Delhi, India",
        conditionContext: "Severe Winter Smog & Temperature Inversion",
        homeType: "Apartment (Low-Rise / Ground)",
        commuteMode: "Private Car (Petrol/Diesel)",
        familyMembers: [
          {
            id: "m1",
            label: "Parent 1",
            ageGroup: "36 yrs",
            sensitivity: "Healthy Adult",
          },
          {
            id: "m2",
            label: "Child",
            ageGroup: "7 yrs",
            sensitivity: "Asthma / Respiratory",
          },
          {
            id: "m3",
            label: "Grandmother",
            ageGroup: "69 yrs",
            sensitivity: "Elderly (65+)",
          },
        ],
        dailySchedule:
          "7:15 AM school drop-off by car (30 mins in heavy traffic), 9:00 AM office commute, 5:30 PM evening grocery run, 6:30 AM grandmother's morning walk, gas stove cooking 3x/day.",
        additionalNotes: "Budget-friendly indoor air solutions preferred.",
      },
    },
    {
      label: "Mumbai Coastal Traffic Commuter",
      data: {
        city: "Mumbai, India",
        conditionContext: "Post-Monsoon Urban Haze & High Traffic",
        homeType: "Apartment (High-Rise)",
        commuteMode: "Two-Wheeler / Scooter",
        familyMembers: [
          {
            id: "m1",
            label: "Self",
            ageGroup: "29 yrs",
            sensitivity: "Healthy Adult",
          },
          {
            id: "m2",
            label: "Partner",
            ageGroup: "28 yrs",
            sensitivity: "Healthy Adult",
          },
        ],
        dailySchedule:
          "8:30 AM 45-min scooter commute along Western Express Highway, 7:00 PM gym & errands, windows kept open all day for breeze.",
        additionalNotes: "Open to metro/public transit 3 days a week.",
      },
    },
  ];
