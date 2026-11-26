"use client";

import React from "react";
import type { LiveEnvironmentalData } from "@/types/air-quality";
import { Radio, Thermometer, Wind } from "lucide-react";

/** Props accepted by {@link LiveTelemetryBanner}. */
interface LiveTelemetryBannerProps {
  /** Verified Open-Meteo environmental telemetry for the selected city. */
  liveTelemetry: LiveEnvironmentalData | null;
  /** Optional lookup error message when telemetry fetch fails. */
  liveError: string | null;
}

/**
 * Displays a compact live telemetry summary strip (US AQI, temperature, wind, PM2.5)
 * or an accessible warning alert if live weather/AQI lookup fails.
 */
export default function LiveTelemetryBanner({
  liveTelemetry,
  liveError,
}: LiveTelemetryBannerProps) {
  return (
    <>
      {liveTelemetry && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl bg-sky-950/50 border border-sky-500/30 px-3.5 py-2.5 text-xs text-sky-100 flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 font-semibold">
            <Radio className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            <span>Live: {liveTelemetry.resolvedLocation}</span>
            <span className="font-mono bg-slate-900 px-2 py-0.5 rounded-md border border-sky-500/30 text-sky-300">
              US AQI {liveTelemetry.usAqi}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-sky-300">
            <span className="inline-flex items-center gap-1">
              <Thermometer className="w-3 h-3" aria-hidden="true" />
              {liveTelemetry.temperatureC}°C
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind className="w-3 h-3" aria-hidden="true" />
              {liveTelemetry.windSpeedKmh} km/h
            </span>
            <span>PM2.5: {liveTelemetry.pm25} µg/m³</span>
          </div>
        </div>
      )}

      {liveError && (
        <p
          role="alert"
          aria-live="polite"
          className="text-[11px] text-amber-200 bg-amber-950/50 border border-amber-500/30 rounded-lg px-3 py-1.5"
        >
          {liveError}
        </p>
      )}
    </>
  );
}
