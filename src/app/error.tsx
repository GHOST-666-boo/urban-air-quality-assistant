"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Route-level Next.js Error Boundary for graceful recovery from unexpected
 * runtime rendering failures.
 */
export default function RouteError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    const safeMsg =
      error instanceof Error ? error.message : "Unexpected application error";
    console.error("[RouteError]:", safeMsg);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div
        role="alert"
        className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-900 p-6 text-center shadow-lg shadow-black/30"
      >
        <AlertTriangle
          className="w-10 h-10 text-rose-400 mx-auto mb-3"
          aria-hidden="true"
        />
        <h1 className="text-lg font-bold text-slate-50 mb-2">
          Unable to Load Assistant View
        </h1>
        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          An unexpected rendering error occurred. Click below to retry without
          losing your session.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-5 py-2.5 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    </div>
  );
}
