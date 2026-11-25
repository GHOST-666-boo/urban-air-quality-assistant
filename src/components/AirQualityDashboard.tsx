"use client";

import React, { useState } from "react";
import { AirQualityPlanResponse, AqiCategory } from "@/types/air-quality";
import {
  Wind,
  Leaf,
  ShieldCheck,
  HeartPulse,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  Sparkles,
  Info,
  TrendingDown,
  Radio,
  Thermometer,
  Droplets,
} from "lucide-react";

interface AirQualityDashboardProps {
  plan: AirQualityPlanResponse;
}

function getAqiBadgeStyle(category: AqiCategory): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  switch (category) {
    case "Good":
      return {
        bg: "bg-emerald-950/50",
        text: "text-emerald-100",
        border: "border-emerald-500/30",
        ring: "bg-emerald-500 text-slate-950",
      };
    case "Moderate":
      return {
        bg: "bg-amber-950/40",
        text: "text-amber-100",
        border: "border-amber-500/30",
        ring: "bg-amber-400 text-slate-950",
      };
    case "Unhealthy for Sensitive Groups":
      return {
        bg: "bg-orange-950/40",
        text: "text-orange-100",
        border: "border-orange-500/30",
        ring: "bg-orange-500 text-slate-950",
      };
    case "Unhealthy":
      return {
        bg: "bg-rose-950/50",
        text: "text-rose-100",
        border: "border-rose-500/35",
        ring: "bg-rose-500 text-white",
      };
    case "Very Unhealthy":
      return {
        bg: "bg-purple-950/50",
        text: "text-purple-100",
        border: "border-purple-500/35",
        ring: "bg-purple-500 text-white",
      };
    case "Hazardous":
      return {
        bg: "bg-red-950/70",
        text: "text-red-100",
        border: "border-red-500/50",
        ring: "bg-red-600 text-white",
      };
  }
}

export default function AirQualityDashboard({
  plan,
}: AirQualityDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "routines" | "indoor" | "impact"
  >("routines");

  const {
    aqiRiskSummary,
    lowEmissionRoutines,
    indoorAirHacks,
    impactBreakdown,
    quickWins,
    liveTelemetry,
    metadata,
  } = plan;
  const aqiStyle = getAqiBadgeStyle(aqiRiskSummary.aqiCategory);

  const totalWeeklyCo2Saved = lowEmissionRoutines.reduce(
    (sum, r) => sum + (Number(r.estimatedCo2SavedKgPerWeek) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Metadata / Source Banner */}
      {metadata.source === "fallback" && metadata.fallbackReason && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Offline Smart Baseline Active:</span>{" "}
            {metadata.fallbackReason}
          </div>
        </div>
      )}

      {/* AQI Risk Summary Card */}
      <section
        className={`rounded-2xl border ${aqiStyle.border} ${aqiStyle.bg} p-5 sm:p-6 shadow-lg shadow-black/25`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {aqiRiskSummary.city}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${aqiStyle.ring}`}
              >
                {aqiRiskSummary.aqiCategory}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-900/90 text-slate-300 border border-slate-700">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                {metadata.source === "gemini"
                  ? `Powered by ${metadata.model}`
                  : "Smart Fallback Engine"}
              </span>
            </div>

            <p className={`text-sm leading-relaxed ${aqiStyle.text}`}>
              {aqiRiskSummary.advisorySummary}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-slate-900/90 rounded-2xl px-4 py-3 border border-slate-700/80 shadow-xs">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-slate-50 leading-none font-mono">
                {aqiRiskSummary.estimatedAqi}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mt-1">
                Est. AQI
              </div>
            </div>
            <div className="h-10 w-px bg-slate-700" />
            <div className="text-center">
              <div className="text-2xl font-extrabold text-emerald-400 leading-none font-mono">
                {totalWeeklyCo2Saved.toFixed(1)}
                <span className="text-xs font-semibold ml-0.5">kg</span>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mt-1">
                CO₂ Saved/Wk
              </div>
            </div>
          </div>
        </div>

        {/* AQI Spectrum Scale Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-mono font-medium text-slate-400 mb-1">
            <span>0 Good</span>
            <span>100 Moderate</span>
            <span>200 Unhealthy</span>
            <span>300+ Hazardous</span>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-purple-600 overflow-visible">
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-50 border-2 border-slate-950 shadow-md shadow-black/50"
              style={{
                left: `${Math.min(Math.max((aqiRiskSummary.estimatedAqi / 350) * 100, 3), 97)}%`,
              }}
              title={`Estimated AQI: ${aqiRiskSummary.estimatedAqi}`}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">
                Primary Pollutants:{" "}
              </span>
              <span className="text-slate-300">
                {aqiRiskSummary.primaryPollutants.join(", ")}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">
                Peak Risk Windows:{" "}
              </span>
              <span className="text-slate-300">
                {aqiRiskSummary.peakRiskWindows.join(" • ")}
              </span>
            </div>
          </div>
        </div>

        {/* Verified Live Weather & AQI Telemetry Strip */}
        {liveTelemetry && (
          <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-sans font-semibold text-sky-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-sky-500/30">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              Live Open-Meteo Telemetry ({liveTelemetry.resolvedLocation})
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                {liveTelemetry.temperatureC}°C
              </span>
              <span className="inline-flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-slate-400" />
                {liveTelemetry.humidityPercent}% RH
              </span>
              <span className="inline-flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-slate-400" />
                {liveTelemetry.windSpeedKmh} km/h
              </span>
              <span>PM2.5: {liveTelemetry.pm25} µg/m³</span>
              <span>PM10: {liveTelemetry.pm10} µg/m³</span>
            </div>
          </div>
        )}
      </section>

      {/* Quick Wins Strip */}
      {quickWins.length > 0 && (
        <section className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-md shadow-black/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Immediate Quick Wins for Today
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickWins.map((win, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-slate-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2"
              >
                <span className="font-bold text-emerald-400 font-mono">
                  {idx + 1}.
                </span>
                <span>{win}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("routines")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
            activeTab === "routines"
              ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
              : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
          }`}
        >
          <Leaf className="w-4 h-4" />
          Low-Emission Routines ({lowEmissionRoutines.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("indoor")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
            activeTab === "indoor"
              ? "bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/20"
              : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
          }`}
        >
          <Wind className="w-4 h-4" />
          Indoor Air Hacks ({indoorAirHacks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("impact")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
            activeTab === "impact"
              ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
              : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          Health &amp; Emission Impact ({impactBreakdown.length})
        </button>
      </div>

      {/* Tab 1: Low-Emission Routines */}
      {activeTab === "routines" && (
        <div className="grid grid-cols-1 gap-4">
          {lowEmissionRoutines.map((item) => (
            <article
              key={item.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md shadow-black/20 hover:border-emerald-500/40 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {item.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 font-mono">
                    {item.timeWindow}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {item.feasibility}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-50">
                {item.title}
              </h4>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                    Current Habit
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {item.currentHabit}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-950/35 border border-emerald-500/25 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-400 mb-1">
                    Recommended Shift
                  </div>
                  <p className="text-slate-100 text-xs leading-relaxed font-medium">
                    {item.recommendedAction}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {item.estimatedCo2SavedKgPerWeek} kg CO₂ / week saved
                </span>
                <span className="inline-flex items-center gap-1.5 text-sky-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ~{item.exposureReductionPercent}% lower pollution exposure
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Tab 2: Indoor Air Hacks */}
      {activeTab === "indoor" && (
        <div className="grid grid-cols-1 gap-4">
          {indoorAirHacks.map((hack) => (
            <article
              key={hack.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md shadow-black/20 hover:border-sky-500/40 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      hack.costTier === "Free"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : hack.costTier === "Low-Cost"
                        ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {hack.costTier}
                  </span>
                  {hack.winterSmogSpecific && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      <Snowflake className="w-3 h-3" />
                      Winter Smog Priority
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-400">
                  Targets:{" "}
                  <strong className="text-slate-200">
                    {hack.targetPollutant}
                  </strong>
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-50">
                {hack.title}
              </h4>

              <ul className="mt-3 space-y-1.5">
                {hack.actionSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300">
                <span className="font-semibold text-slate-100">
                  Why it works:{" "}
                </span>
                {hack.whyItWorks}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Tab 3: Health & Environmental Impact Breakdown */}
      {activeTab === "impact" && (
        <div className="grid grid-cols-1 gap-4">
          {impactBreakdown.map((impact) => (
            <article
              key={impact.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md shadow-black/20 hover:border-indigo-500/40 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-base font-bold text-slate-50">
                  {impact.recommendationRef}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                  {impact.pollutantOrEmissionMetric}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-rose-950/35 border border-rose-500/25 p-3">
                  <div className="font-bold uppercase tracking-wide text-rose-300 mb-1">
                    Health Impact (Plain Language)
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {impact.healthImpactPlainLanguage}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-950/35 border border-emerald-500/25 p-3">
                  <div className="font-bold uppercase tracking-wide text-emerald-300 mb-1">
                    Environmental Impact
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {impact.environmentalImpactPlainLanguage}
                  </p>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400">
                Primary Beneficiary:{" "}
                <strong className="text-slate-200">
                  {impact.beneficiaryGroup}
                </strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
