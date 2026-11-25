"use client";

import React, { useState } from "react";
import {
  CommuteMode,
  FamilyMember,
  HomeType,
  LiveEnvironmentalData,
  RoutineInput,
  SensitivityGroup,
} from "@/types/air-quality";
import {
  MapPin,
  Home,
  Car,
  Users,
  Plus,
  Trash2,
  Sparkles,
  MessageSquare,
  ClipboardList,
  Loader2,
  Radio,
  Thermometer,
  Wind,
} from "lucide-react";

interface RoutineInputFormProps {
  onSubmit: (input: RoutineInput) => Promise<void>;
  isLoading: boolean;
}

const HOME_TYPES: HomeType[] = [
  "Apartment (High-Rise)",
  "Apartment (Low-Rise / Ground)",
  "Independent House",
  "Townhouse / Duplex",
  "Studio / Shared Flat",
];

const COMMUTE_MODES: CommuteMode[] = [
  "Private Car (Petrol/Diesel)",
  "Electric Vehicle (EV)",
  "Two-Wheeler / Scooter",
  "Public Bus / Metro",
  "Walking / Cycling",
  "Work From Home / Hybrid",
];

const SENSITIVITIES: SensitivityGroup[] = [
  "Healthy Adult",
  "Child / Infant",
  "Elderly (65+)",
  "Asthma / Respiratory",
  "Cardiovascular",
  "Pregnant",
];

const PRESETS: { label: string; data: RoutineInput }[] = [
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

export default function RoutineInputForm({
  onSubmit,
  isLoading,
}: RoutineInputFormProps) {
  const [inputMode, setInputMode] = useState<"form" | "chat">("form");
  const [city, setCity] = useState("New Delhi, India");
  const [conditionContext, setConditionContext] = useState(
    "Winter Smog / High PM2.5"
  );
  const [homeType, setHomeType] = useState<HomeType>(
    "Apartment (Low-Rise / Ground)"
  );
  const [commuteMode, setCommuteMode] = useState<CommuteMode>(
    "Private Car (Petrol/Diesel)"
  );
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: "1",
      label: "Primary Adult",
      ageGroup: "35 yrs",
      sensitivity: "Healthy Adult",
    },
    {
      id: "2",
      label: "Child",
      ageGroup: "8 yrs",
      sensitivity: "Asthma / Respiratory",
    },
  ]);
  const [dailySchedule, setDailySchedule] = useState(
    "7:30 AM school drop-off and office commute (40 min drive), 6:00 PM return commute and grocery errands, evening cooking on gas stove."
  );
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [liveTelemetry, setLiveTelemetry] =
    useState<LiveEnvironmentalData | null>(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [chatNarrative, setChatNarrative] = useState(
    "We are a family of 3 in New Delhi (two adults, one 7-year-old with mild asthma) living in a ground-floor apartment. I drive 40 mins at 8 AM and 6 PM, and my parents take a morning walk at 6:30 AM. We want low-cost winter smog protection and lower emissions."
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFetchLiveAqi = async (targetCity?: string) => {
    const queryCity = (targetCity ?? city).trim();
    if (!queryCity) {
      setLiveError("Enter a city first to fetch live AQI & weather.");
      return;
    }
    setIsFetchingLive(true);
    setLiveError(null);
    try {
      const res = await fetch(
        `/api/live-aqi?city=${encodeURIComponent(queryCity)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not fetch live AQI.");
      }
      const telemetry = data as LiveEnvironmentalData;
      setLiveTelemetry(telemetry);
      setConditionContext(telemetry.autoConditionSummary);
    } catch (err) {
      setLiveTelemetry(null);
      setLiveError(
        err instanceof Error ? err.message : "Live AQI lookup failed."
      );
    } finally {
      setIsFetchingLive(false);
    }
  };

  const applyPreset = (preset: RoutineInput) => {
    setCity(preset.city);
    setConditionContext(preset.conditionContext);
    setHomeType(preset.homeType);
    setCommuteMode(preset.commuteMode);
    setFamilyMembers(preset.familyMembers);
    setDailySchedule(preset.dailySchedule);
    setAdditionalNotes(preset.additionalNotes || "");
    setLiveTelemetry(null);
    setLiveError(null);
    setInputMode("form");
    setValidationError(null);
    void handleFetchLiveAqi(preset.city);
  };

  const addFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        label: `Member ${prev.length + 1}`,
        ageGroup: "30 yrs",
        sensitivity: "Healthy Adult",
      },
    ]);
  };

  const removeFamilyMember = (id: string) => {
    if (familyMembers.length <= 1) return;
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateFamilyMember = (
    id: string,
    field: keyof FamilyMember,
    value: string
  ) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (inputMode === "chat") {
      if (!city.trim()) {
        setValidationError("Please enter your city or metro area.");
        return;
      }
      if (chatNarrative.trim().length < 15) {
        setValidationError(
          "Please describe your household and routine in at least a sentence."
        );
        return;
      }
      await onSubmit({
        city: city.trim(),
        conditionContext: conditionContext.trim() || "Urban Air Quality",
        homeType,
        commuteMode,
        familyMembers,
        dailySchedule: chatNarrative.trim(),
        additionalNotes: "Submitted via Natural Language Routine Mode",
        liveTelemetry,
      });
      return;
    }

    if (!city.trim()) {
      setValidationError("Please enter your city or metro area.");
      return;
    }
    if (dailySchedule.trim().length < 10) {
      setValidationError(
        "Please describe your daily schedule (at least 10 characters)."
      );
      return;
    }

    await onSubmit({
      city: city.trim(),
      conditionContext: conditionContext.trim(),
      homeType,
      commuteMode,
      familyMembers,
      dailySchedule: dailySchedule.trim(),
      additionalNotes: additionalNotes.trim(),
      liveTelemetry,
    });
  };

  return (
    <section className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg shadow-black/30 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">
            Household &amp; Routine Profile
          </h2>
          <p className="text-sm text-slate-400">
            Enter your daily schedule to receive tailored low-emission &amp;
            indoor air guidance.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-950 border border-slate-800 p-1 self-start">
          <button
            type="button"
            onClick={() => setInputMode("form")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              inputMode === "form"
                ? "bg-slate-800 text-slate-50 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Guided Form
          </button>
          <button
            type="button"
            onClick={() => setInputMode("chat")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              inputMode === "chat"
                ? "bg-slate-800 text-slate-50 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Quick Describe
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">
          Try a scenario:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset.data)}
            className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition font-medium cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Location & Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="city-input"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-300"
              >
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  City / Metro Area
                </span>
              </label>
              <button
                type="button"
                onClick={() => handleFetchLiveAqi()}
                disabled={isFetchingLive}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 disabled:opacity-50 cursor-pointer"
              >
                {isFetchingLive ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Radio className="w-3 h-3" />
                )}
                {isFetchingLive ? "Fetching..." : "Fetch Live AQI"}
              </button>
            </div>
            <input
              id="city-input"
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setLiveTelemetry(null);
              }}
              placeholder="e.g., New Delhi, Mumbai, London"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
              required
            />
          </div>

          <div>
            <label
              htmlFor="condition-input"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1.5"
            >
              Season / Air Condition
            </label>
            <input
              id="condition-input"
              type="text"
              value={conditionContext}
              onChange={(e) => setConditionContext(e.target.value)}
              placeholder="e.g., Winter Smog, Rush-Hour Haze, Wildfire Smoke"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
            />
          </div>
        </div>

        {/* Live Telemetry Preview Strip */}
        {liveTelemetry && (
          <div className="rounded-xl bg-sky-950/50 border border-sky-500/30 px-3.5 py-2.5 text-xs text-sky-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Live: {liveTelemetry.resolvedLocation}</span>
              <span className="font-mono bg-slate-900 px-2 py-0.5 rounded-md border border-sky-500/30 text-sky-300">
                US AQI {liveTelemetry.usAqi}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-sky-300">
              <span className="inline-flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                {liveTelemetry.temperatureC}°C
              </span>
              <span className="inline-flex items-center gap-1">
                <Wind className="w-3 h-3" />
                {liveTelemetry.windSpeedKmh} km/h
              </span>
              <span>PM2.5: {liveTelemetry.pm25}</span>
            </div>
          </div>
        )}
        {liveError && (
          <p className="text-[11px] text-amber-200 bg-amber-950/50 border border-amber-500/30 rounded-lg px-3 py-1.5">
            {liveError}
          </p>
        )}

        {inputMode === "chat" ? (
          <div>
            <label
              htmlFor="chat-narrative"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1.5"
            >
              Describe Your Family &amp; Daily Routine
            </label>
            <textarea
              id="chat-narrative"
              rows={5}
              value={chatNarrative}
              onChange={(e) => setChatNarrative(e.target.value)}
              placeholder="Tell us who lives in your home, how you commute, when you go outside, and any respiratory sensitivities..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
            />
          </div>
        ) : (
          <>
            {/* Home & Commute */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="home-type"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1.5"
                >
                  <span className="inline-flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    Home Type
                  </span>
                </label>
                <select
                  id="home-type"
                  value={homeType}
                  onChange={(e) => setHomeType(e.target.value as HomeType)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                >
                  {HOME_TYPES.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="commute-mode"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1.5"
                >
                  <span className="inline-flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-emerald-400" />
                    Primary Commute
                  </span>
                </label>
                <select
                  id="commute-mode"
                  value={commuteMode}
                  onChange={(e) =>
                    setCommuteMode(e.target.value as CommuteMode)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                >
                  {COMMUTE_MODES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Family Members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  Household Members ({familyMembers.length})
                </span>
                <button
                  type="button"
                  onClick={addFamilyMember}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Member
                </button>
              </div>

              <div className="space-y-2.5">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-950/70 p-2.5 rounded-xl border border-slate-800"
                  >
                    <input
                      type="text"
                      value={member.label}
                      onChange={(e) =>
                        updateFamilyMember(member.id, "label", e.target.value)
                      }
                      aria-label="Member label"
                      placeholder="Label"
                      className="col-span-4 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={member.ageGroup}
                      onChange={(e) =>
                        updateFamilyMember(
                          member.id,
                          "ageGroup",
                          e.target.value
                        )
                      }
                      aria-label="Age group"
                      placeholder="Age"
                      className="col-span-3 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                    <select
                      value={member.sensitivity}
                      onChange={(e) =>
                        updateFamilyMember(
                          member.id,
                          "sensitivity",
                          e.target.value
                        )
                      }
                      aria-label="Health sensitivity"
                      className="col-span-4 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {SENSITIVITIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeFamilyMember(member.id)}
                      disabled={familyMembers.length <= 1}
                      aria-label="Remove member"
                      className="col-span-1 flex justify-center text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Schedule */}
            <div>
              <label
                htmlFor="daily-schedule"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1.5"
              >
                Daily Schedule &amp; Habits
              </label>
              <textarea
                id="daily-schedule"
                rows={3}
                value={dailySchedule}
                onChange={(e) => setDailySchedule(e.target.value)}
                placeholder="e.g., 7:30 AM school drop-off, 9 AM commute, evening walk, gas cooking..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                required
              />
            </div>

            <div>
              <label
                htmlFor="additional-notes"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1.5"
              >
                Constraints / Budget Notes (Optional)
              </label>
              <input
                id="additional-notes"
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g., No commercial air purifier, rented flat, flexible work hours"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
              />
            </div>
          </>
        )}

        {validationError && (
          <p className="text-xs font-medium text-rose-200 bg-rose-950/60 border border-rose-500/30 rounded-lg px-3 py-2">
            {validationError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 text-slate-950 font-bold text-sm px-5 py-3 shadow-sm shadow-emerald-500/20 transition cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Routine &amp; Generating Plan...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Air Quality Action Plan
            </>
          )}
        </button>
      </form>
    </section>
  );
}
