"use client";

import React from "react";
import type {
  AqiCategory,
  AqiRiskSummary,
  LiveEnvironmentalData,
} from "@/types/air-quality";
import {
  AlertTriangle,
  Clock,
  Droplets,
  Radio,
  Sparkles,
  Thermometer,
  Wind,
} from "lucide-react";

/** Props accepted by {@link AqiSummaryCard}. */
interface AqiSummaryCardProps {
  /** City AQI risk summary and peak risk windows. */
  aqiRiskSummary: AqiRiskSummary;
  /** Aggregated weekly CO2 savings across recommended routines. */
  totalWeeklyCo2Saved: number;
  /** Optional verified Open-Meteo telemetry snapshot. */
  liveTelemetry?: LiveEnvironmentalData | null;
  /** Plan generation source and model metadata. */
  metadata: {
    source: "gemini" | "fallback";
    model: string;
  };
}

const AQI_STYLES: Record<
  AqiCategory,
  { bg: string; text: string; border: string; ring: string }
> = {
  Good: {
    bg: "bg-emerald-950/50",
    text: "text-emerald-100",
    border: "border-emerald-500/30",
    ring: "bg-emerald-500 text-slate-950",
  },
  Moderate: {
    bg: "bg-amber-950/40",
    text: "text-amber-100",
    border: "border-amber-500/30",
    ring: "bg-amber-400 text-slate-950",
  },
  "Unhealthy for Sensitive Groups": {
    bg: "bg-orange-950/40",
    text: "text-orange-100",
    border: "border-orange-500/30",
    ring: "bg-orange-500 text-slate-950",
  },
  Unhealthy: {
    bg: "bg-rose-950/50",
    text: "text-rose-100",
    border: "border-rose-500/35",
    ring: "bg-rose-600 text-white",
  },
  "Very Unhealthy": {
    bg: "bg-purple-950/50",
    text: "text-purple-100",
    border: "border-purple-500/35",
    ring: "bg-purple-600 text-white",
  },
  Hazardous: {
    bg: "bg-red-950/70",
    text: "text-red-100",
    border: "border-red-500/50",
    ring: "bg-red-600 text-white",
  },
};

/**
 * Displays city AQI risk badge, accessible ARIA `meter` spectrum bar,
 * weekly CO₂ savings, primary pollutants, peak risk windows, and live telemetry.
 */
export default function AqiSummaryCard({
  aqiRiskSummary,
  totalWeeklyCo2Saved,
  liveTelemetry,
  metadata,
}: AqiSummaryCardProps) {
  const aqiStyle = AQI_STYLES[aqiRiskSummary.aqiCategory];
  const indicatorLeftPercent = Math.min(
    Math.max((aqiRiskSummary.estimatedAqi / 350) * 100, 3),
    97
  );

  return (
    <section
      aria-labelledby="aqi-summary-heading"
      className={`rounded-2xl border ${aqiStyle.border} ${aqiStyle.bg} p-5 sm:p-6 shadow-lg shadow-black/25`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="aqi-summary-heading"
              className="text-xs font-bold uppercase tracking-wider text-slate-200"
            >
              {aqiRiskSummary.city}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${aqiStyle.ring}`}
            >
              {aqiRiskSummary.aqiCategory}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-900/90 text-slate-200 border border-slate-700">
              <Sparkles className="w-3 h-3 text-emerald-400" aria-hidden="true" />
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
          <div className="h-10 w-px bg-slate-700" aria-hidden="true" />
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

      {/* Accessible AQI Spectrum Scale Bar */}
      <div className="mt-4">
        <div
          aria-hidden="true"
          className="flex justify-between text-[10px] font-mono font-medium text-slate-400 mb-1"
        >
          <span>0 Good</span>
          <span>100 Moderate</span>
          <span>200 Unhealthy</span>
          <span>300+ Hazardous</span>
        </div>
        <div
          role="meter"
          aria-label="Estimated US AQI severity scale"
          aria-valuemin={0}
          aria-valuemax={500}
          aria-valuenow={aqiRiskSummary.estimatedAqi}
          aria-valuetext={`${aqiRiskSummary.estimatedAqi} (${aqiRiskSummary.aqiCategory})`}
          className="relative h-2.5 w-full rounded-full bg-[linear-gradient(to_right,#10b981_0%,#fbbf24_28%,#f97316_50%,#e11d48_72%,#9333ea_100%)] overflow-visible"
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-50 border-2 border-slate-950 shadow-md shadow-black/50"
            style={{ left: `${indicatorLeftPercent}%` }}
            title={`Estimated AQI: ${aqiRiskSummary.estimatedAqi}`}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-start gap-2">
          <AlertTriangle
            className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
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
          <Clock
            className="w-4 h-4 text-sky-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
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

      {liveTelemetry && (
        <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
          <span className="inline-flex items-center gap-1.5 font-sans font-semibold text-sky-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-sky-500/30">
            <Radio className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            Live Open-Meteo Telemetry ({liveTelemetry.resolvedLocation})
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Thermometer
                className="w-3.5 h-3.5 text-slate-400"
                aria-hidden="true"
              />
              {liveTelemetry.temperatureC}°C
            </span>
            <span className="inline-flex items-center gap-1">
              <Droplets
                className="w-3.5 h-3.5 text-slate-400"
                aria-hidden="true"
              />
              {liveTelemetry.humidityPercent}% RH
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind
                className="w-3.5 h-3.5 text-slate-400"
                aria-hidden="true"
              />
              {liveTelemetry.windSpeedKmh} km/h
            </span>
            <span>PM2.5: {liveTelemetry.pm25} µg/m³</span>
            <span>PM10: {liveTelemetry.pm10} µg/m³</span>
          </div>
        </div>
      )}
    </section>
  );
}
