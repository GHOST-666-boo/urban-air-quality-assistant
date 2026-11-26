"use client";

import React from "react";
import type {
  ImpactBreakdownItem,
  IndoorAirHackItem,
  LowEmissionRoutineItem,
} from "@/types/air-quality";
import { ShieldCheck, Snowflake, TrendingDown } from "lucide-react";

/** Renders cards for the Low-Emission Routines tab panel. */
export function LowEmissionRoutinesList({
  items,
}: {
  items: LowEmissionRoutineItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((item) => (
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

          <h4 className="text-base font-bold text-slate-50">{item.title}</h4>

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
              <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              {item.estimatedCo2SavedKgPerWeek} kg CO₂ / week saved
            </span>
            <span className="inline-flex items-center gap-1.5 text-sky-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              ~{item.exposureReductionPercent}% lower pollution exposure
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

/** Renders cards for the Indoor Air Hacks tab panel. */
export function IndoorAirHacksList({ items }: { items: IndoorAirHackItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((hack) => (
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-500/35">
                  <Snowflake className="w-3 h-3" aria-hidden="true" />
                  Winter Smog Priority
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-slate-400">
              Targets:{" "}
              <strong className="text-slate-200">{hack.targetPollutant}</strong>
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-50">{hack.title}</h4>

          <ul className="mt-3 space-y-1.5">
            {hack.actionSteps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
              >
                <ShieldCheck
                  className="w-4 h-4 text-sky-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{step}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300">
            <span className="font-semibold text-slate-100">Why it works: </span>
            {hack.whyItWorks}
          </div>
        </article>
      ))}
    </div>
  );
}

/** Renders cards for the Health & Emission Impact tab panel. */
export function ImpactBreakdownList({
  items,
}: {
  items: ImpactBreakdownItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((impact) => (
        <article
          key={impact.id}
          className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md shadow-black/20 hover:border-indigo-500/40 transition"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-base font-bold text-slate-50">
              {impact.recommendationRef}
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-500/35 font-mono">
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
            <strong className="text-slate-200">{impact.beneficiaryGroup}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}
