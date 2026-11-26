"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/** Props accepted by the {@link ErrorBoundary} component. */
interface ErrorBoundaryProps {
  /** Child components to render inside the error boundary. */
  children: ReactNode;
  /** Optional custom fallback UI; receives the caught error. */
  fallback?: (error: Error) => ReactNode;
}

/** Internal state tracking whether an error has been caught. */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React class-based Error Boundary that catches render-time errors in its
 * subtree and displays a user-friendly recovery UI instead of a blank page.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <AirQualityDashboard plan={plan} />
 * </ErrorBoundary>
 * ```
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary]:", error, errorInfo.componentStack);
  }

  /** Resets the error state so the user can retry rendering children. */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      return (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-950/50 p-6 text-center"
        >
          <AlertTriangle
            className="w-10 h-10 text-rose-400 mx-auto mb-3"
            aria-hidden="true"
          />
          <h2 className="text-lg font-bold text-rose-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-rose-200 mb-4 max-w-md mx-auto">
            An unexpected error occurred while rendering this section. Your data
            is safe — please try again.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-sm transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
