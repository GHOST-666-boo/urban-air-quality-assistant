"use client";

import React, { useState } from "react";
import type {
  CommuteMode,
  FamilyMember,
  HomeType,
  LiveEnvironmentalData,
  RoutineInput,
} from "@/types/air-quality";
import {
  COMMUTE_MODES,
  HOME_TYPES,
  SCENARIO_PRESETS,
} from "@/lib/presets";
import FamilyMembersEditor from "@/components/FamilyMembersEditor";
import LiveTelemetryBanner from "@/components/LiveTelemetryBanner";
import {
  MapPin,
  Home,
  Car,
  Sparkles,
  MessageSquare,
  ClipboardList,
  Loader2,
  Radio,
} from "lucide-react";

/** Props accepted by {@link RoutineInputForm}. */
interface RoutineInputFormProps {
  /** Async handler invoked when a valid household profile is submitted. */
  onSubmit: (input: RoutineInput) => Promise<void>;
  /** True while `/api/analyze` is processing the current request. */
  isLoading: boolean;
}

const DEFAULT_MEMBERS: FamilyMember[] = [
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
];

const DEFAULT_SCHEDULE =
  "7:30 AM school drop-off and office commute (40 min drive), 6:00 PM return commute and grocery errands, evening cooking on gas stove.";

const DEFAULT_CHAT_NARRATIVE =
  "We are a family of 3 in New Delhi (two adults, one 7-year-old with mild asthma) living in a ground-floor apartment. I drive 40 mins at 8 AM and 6 PM, and my parents take a morning walk at 6:30 AM. We want low-cost winter smog protection and lower emissions.";

/**
 * Dual-mode household routine input form supporting Guided Form and
 * Quick Describe modes, one-tap presets, and live Open-Meteo AQI lookup.
 */
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
  const [familyMembers, setFamilyMembers] =
    useState<FamilyMember[]>(DEFAULT_MEMBERS);
  const [dailySchedule, setDailySchedule] = useState(DEFAULT_SCHEDULE);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [liveTelemetry, setLiveTelemetry] =
    useState<LiveEnvironmentalData | null>(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [chatNarrative, setChatNarrative] = useState(DEFAULT_CHAT_NARRATIVE);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFetchLiveAqi = async (targetCity?: string): Promise<void> => {
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

  const applyPreset = (preset: RoutineInput): void => {
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

  const addFamilyMember = (): void => {
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

  const removeFamilyMember = (id: string): void => {
    if (familyMembers.length <= 1) return;
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateFamilyMember = (
    id: string,
    field: keyof FamilyMember,
    value: string
  ): void => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setValidationError(null);

    if (!city.trim()) {
      setValidationError("Please enter your city or metro area.");
      return;
    }

    const scheduleText =
      inputMode === "chat" ? chatNarrative.trim() : dailySchedule.trim();
    if (scheduleText.length < 10) {
      setValidationError(
        "Please describe your daily schedule (at least 10 characters)."
      );
      return;
    }

    await onSubmit({
      city: city.trim(),
      conditionContext:
        conditionContext.trim() || "Urban Air Quality / Winter Smog",
      homeType,
      commuteMode,
      familyMembers,
      dailySchedule: scheduleText,
      additionalNotes:
        inputMode === "chat"
          ? "Submitted via Natural Language Routine Mode"
          : additionalNotes.trim(),
      liveTelemetry,
    });
  };

  return (
    <section
      aria-labelledby="profile-heading"
      className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg shadow-black/30 p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h2 id="profile-heading" className="text-lg font-semibold text-slate-50">
            Household &amp; Routine Profile
          </h2>
          <p className="text-sm text-slate-400">
            Enter your daily schedule to receive tailored low-emission &amp;
            indoor air guidance.
          </p>
        </div>

        <div
          role="group"
          aria-label="Input mode selection"
          className="inline-flex rounded-xl bg-slate-950 border border-slate-800 p-1 self-start"
        >
          <button
            type="button"
            aria-pressed={inputMode === "form"}
            onClick={() => setInputMode("form")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              inputMode === "form"
                ? "bg-slate-800 text-slate-50 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
            Guided Form
          </button>
          <button
            type="button"
            aria-pressed={inputMode === "chat"}
            onClick={() => setInputMode("chat")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              inputMode === "chat"
                ? "bg-slate-800 text-slate-50 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            Quick Describe
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label="Sample household scenarios"
        className="mt-4 flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-medium text-slate-400">
          Try a scenario:
        </span>
        {SCENARIO_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset.data)}
            aria-label={`Load scenario: ${preset.label}`}
            className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition font-medium cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="city-input"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-300"
              >
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  City / Metro Area
                </span>
              </label>
              <button
                type="button"
                onClick={() => handleFetchLiveAqi()}
                disabled={isFetchingLive}
                aria-busy={isFetchingLive}
                aria-label="Fetch live AQI and weather for entered city"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 disabled:opacity-50 cursor-pointer"
              >
                {isFetchingLive ? (
                  <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                ) : (
                  <Radio className="w-3 h-3" aria-hidden="true" />
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
              aria-invalid={Boolean(validationError && !city.trim())}
              aria-describedby={validationError ? "form-validation-error" : undefined}
              placeholder="e.g., New Delhi, Mumbai, London"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
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
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
            />
          </div>
        </div>

        <LiveTelemetryBanner
          liveTelemetry={liveTelemetry}
          liveError={liveError}
        />

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
              aria-invalid={Boolean(
                validationError && chatNarrative.trim().length < 10
              )}
              aria-describedby={
                validationError ? "form-validation-error" : undefined
              }
              placeholder="Tell us who lives in your home, how you commute, when you go outside, and any respiratory sensitivities..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="home-type"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1.5"
                >
                  <span className="inline-flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
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
                    <Car className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
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

            <FamilyMembersEditor
              members={familyMembers}
              onAdd={addFamilyMember}
              onRemove={removeFamilyMember}
              onUpdate={updateFamilyMember}
            />

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
                aria-invalid={Boolean(
                  validationError && dailySchedule.trim().length < 10
                )}
                aria-describedby={
                  validationError ? "form-validation-error" : undefined
                }
                placeholder="e.g., 7:30 AM school drop-off, 9 AM commute, evening walk, gas cooking..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
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
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
              />
            </div>
          </>
        )}

        {validationError && (
          <p
            id="form-validation-error"
            role="alert"
            aria-live="assertive"
            className="text-xs font-medium text-rose-200 bg-rose-950/60 border border-rose-500/30 rounded-lg px-3 py-2"
          >
            {validationError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 text-slate-950 font-bold text-sm px-5 py-3 shadow-sm shadow-emerald-500/20 transition cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Analyzing Routine &amp; Generating Plan...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Generate Air Quality Action Plan
            </>
          )}
        </button>
      </form>
    </section>
  );
}
