"use client";

import React, { useState } from "react";
import RoutineInputForm from "@/components/RoutineInputForm";
import AirQualityDashboard from "@/components/AirQualityDashboard";
import { AirQualityPlanResponse, RoutineInput } from "@/types/air-quality";
import { Wind, ShieldAlert, Sparkles } from "lucide-react";

export default function HomePage() {
  const [plan, setPlan] = useState<AirQualityPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (input: RoutineInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate air quality plan.");
      }

      setPlan(data as AirQualityPlanResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error while analyzing routine."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      {/* Subtle atmospheric dark glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.08),transparent_50%)]"
      />

      {/* Top Header */}
      <header className="bg-slate-900/85 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-50 leading-none">
                Urban Air Quality Assistant
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PromptWars Challenge 06 • Low-Emission Routines &amp; Clean
                Indoor Air
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Gemini Structured JSON
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5">
            <RoutineInputForm onSubmit={handleAnalyze} isLoading={isLoading} />
          </div>

          {/* Right Column: Dashboard Output */}
          <div className="lg:col-span-7">
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {plan ? (
              <AirQualityDashboard plan={plan} />
            ) : (
              <div className="bg-slate-900/70 rounded-2xl border border-dashed border-slate-700 p-8 sm:p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Wind className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-50">
                  Ready to Optimize Your Household&apos;s Air &amp; Emissions
                </h2>
                <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Fill out your city, home type, and daily schedule—or click a
                  one-tap scenario on the left—to get tailored low-emission
                  routines, low-cost indoor air hacks, and transparent health
                  impact insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
