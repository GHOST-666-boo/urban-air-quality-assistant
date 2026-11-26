"use client";

import React, { useState } from "react";
import RoutineInputForm from "@/components/RoutineInputForm";
import AirQualityDashboard from "@/components/AirQualityDashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AirQualityPlanResponse, RoutineInput } from "@/types/air-quality";
import { Wind, ShieldAlert, Sparkles } from "lucide-react";

/**
 * Root page component for the Urban Air Quality Assistant.
 *
 * Renders the household routine input form and, once analyzed, the full
 * air quality action plan dashboard with error boundary protection and
 * WCAG AA keyboard/screen-reader landmarks.
 */
export default function HomePage() {
  const [plan, setPlan] = useState<AirQualityPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submits the household routine to `/api/analyze` and updates
   * the rendered plan or accessible error state.
   */
  const handleAnalyze = async (input: RoutineInput): Promise<void> => {
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative overflow-x-hidden">
      {/* Skip-to-content link for keyboard & screen reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-emerald-500 focus:text-slate-950 focus:font-semibold focus:text-sm focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Subtle atmospheric dark glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.08),transparent_50%)]"
      />

      {/* Top Header */}
      <header className="bg-slate-900/85 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-sm shadow-emerald-500/20"
              aria-hidden="true"
            >
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
            <Sparkles
              className="w-3.5 h-3.5 text-emerald-400"
              aria-hidden="true"
            />
            Gemini Structured JSON
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5">
            <RoutineInputForm onSubmit={handleAnalyze} isLoading={isLoading} />
          </div>

          {/* Right Column: Dashboard Output */}
          <div className="lg:col-span-7">
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/50 px-4 py-3 text-sm text-rose-200"
              >
                <ShieldAlert
                  className="w-5 h-5 text-rose-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </div>
            )}

            <ErrorBoundary>
              {plan ? (
                <AirQualityDashboard plan={plan} />
              ) : (
                <section
                  aria-label="Getting Started Overview"
                  className="bg-slate-900/70 rounded-2xl border border-dashed border-slate-700 p-8 sm:p-12 text-center"
                >
                  <div
                    className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4"
                    aria-hidden="true"
                  >
                    <Wind className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-50">
                    Ready to Optimize Your Household&apos;s Air &amp; Emissions
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Fill out your city, home type, and daily schedule—or click a
                    one-tap scenario on the left—to get tailored low-emission
                    routines, low-cost indoor air hacks, and transparent health
                    impact insights.
                  </p>
                </section>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            © 2026 Urban Air Quality Assistant — PromptWars Challenge 06
          </p>
          <p>Powered by Google Gemini &amp; Open-Meteo • MIT License</p>
        </div>
      </footer>
    </div>
  );
}
