"use client";

import React, { useState } from "react";
import type { AirQualityPlanResponse } from "@/types/air-quality";
import AqiSummaryCard from "@/components/AqiSummaryCard";
import {
  ImpactBreakdownList,
  IndoorAirHacksList,
  LowEmissionRoutinesList,
} from "@/components/dashboard/DashboardTabsContent";
import {
  Wind,
  Leaf,
  HeartPulse,
  CheckCircle2,
  Info,
} from "lucide-react";

/** Props accepted by {@link AirQualityDashboard}. */
interface AirQualityDashboardProps {
  /** Complete structured air quality action plan response to render. */
  plan: AirQualityPlanResponse;
}

type DashboardTab = "routines" | "indoor" | "impact";

const TAB_ORDER: readonly DashboardTab[] = ["routines", "indoor", "impact"];

const TAB_LABELS: Record<DashboardTab, string> = {
  routines: "Low-Emission Routines",
  indoor: "Indoor Air Hacks",
  impact: "Health & Emission Impact",
};

/**
 * Renders the full air quality action plan: AQI summary, Quick Wins,
 * and WAI-ARIA keyboard-navigable tabs for Low-Emission Routines,
 * Indoor Air Hacks, and Impact Breakdown.
 */
export default function AirQualityDashboard({
  plan,
}: AirQualityDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("routines");

  const {
    aqiRiskSummary,
    lowEmissionRoutines,
    indoorAirHacks,
    impactBreakdown,
    quickWins,
    liveTelemetry,
    metadata,
  } = plan;

  const totalWeeklyCo2Saved = lowEmissionRoutines.reduce(
    (sum, r) => sum + (Number(r.estimatedCo2SavedKgPerWeek) || 0),
    0
  );

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ): void => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TAB_ORDER.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = TAB_ORDER.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = TAB_ORDER[nextIndex];
      setActiveTab(nextTab);
      document.getElementById(`tab-${nextTab}`)?.focus();
    }
  };

  return (
    <div className="space-y-6">
      {metadata.source === "fallback" && metadata.fallbackReason && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-xs text-amber-200"
        >
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-semibold">Offline Smart Baseline Active:</span>{" "}
            {metadata.fallbackReason}
          </div>
        </div>
      )}

      <AqiSummaryCard
        aqiRiskSummary={aqiRiskSummary}
        totalWeeklyCo2Saved={totalWeeklyCo2Saved}
        liveTelemetry={liveTelemetry}
        metadata={metadata}
      />

      {quickWins.length > 0 && (
        <section
          aria-labelledby="quick-wins-heading"
          className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-md shadow-black/20"
        >
          <h3
            id="quick-wins-heading"
            className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Immediate Quick Wins for Today
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickWins.map((win, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-slate-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2"
              >
                <span className="font-bold text-emerald-400 font-mono" aria-hidden="true">
                  {idx + 1}.
                </span>
                <span>{win}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="plan-tabs-heading">
        <h3 id="plan-tabs-heading" className="sr-only">
          Detailed Action Plan Breakdown
        </h3>

        <div
          role="tablist"
          aria-label="Action plan sections"
          className="flex flex-wrap gap-2 border-b border-slate-800 pb-2 mb-4"
        >
          {TAB_ORDER.map((tab, index) => {
            const count =
              tab === "routines"
                ? lowEmissionRoutines.length
                : tab === "indoor"
                ? indoorAirHacks.length
                : impactBreakdown.length;

            const activeClass =
              tab === "routines"
                ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
                : tab === "indoor"
                ? "bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/20"
                : "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20";

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`tab-${tab}`}
                tabIndex={activeTab === tab ? 0 : -1}
                aria-selected={activeTab === tab}
                aria-controls={`tabpanel-${tab}`}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  activeTab === tab
                    ? activeClass
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                {tab === "routines" && <Leaf className="w-4 h-4" aria-hidden="true" />}
                {tab === "indoor" && <Wind className="w-4 h-4" aria-hidden="true" />}
                {tab === "impact" && <HeartPulse className="w-4 h-4" aria-hidden="true" />}
                {TAB_LABELS[tab]} ({count})
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
        >
          {activeTab === "routines" && (
            <LowEmissionRoutinesList items={lowEmissionRoutines} />
          )}
          {activeTab === "indoor" && (
            <IndoorAirHacksList items={indoorAirHacks} />
          )}
          {activeTab === "impact" && (
            <ImpactBreakdownList items={impactBreakdown} />
          )}
        </div>
      </section>
    </div>
  );
}
