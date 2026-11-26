/**
 * @module lib/rate-limit
 * Bounded in-memory fixed-window rate limiter for API route protection.
 * Protects downstream Gemini and Open-Meteo APIs against burst abuse while
 * preventing unbounded memory growth via automatic stale-bucket pruning.
 */

/** Configuration options for checking a rate limit bucket. */
export interface RateLimitConfig {
  /** Unique client or route-scoped bucket key. */
  key: string;
  /** Maximum requests allowed within the time window. */
  maxRequests: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Optional reference timestamp in milliseconds (useful in unit tests). */
  nowMs?: number;
}

/** Result of a rate-limit evaluation. */
export interface RateLimitResult {
  /** Whether the current request is permitted. */
  allowed: boolean;
  /** Configured request limit per window. */
  limit: number;
  /** Remaining permitted requests in the current window. */
  remaining: number;
  /** Unix epoch timestamp (ms) when the current window resets. */
  resetAtMs: number;
  /** Suggested wait time in seconds before retrying if blocked. */
  retryAfterSeconds: number;
}

interface BucketState {
  count: number;
  resetAtMs: number;
}

/** Upper bound on stored buckets to avoid unbounded memory allocation. */
const MAX_BUCKETS = 1000;

/**
 * Standalone bounded fixed-window rate limiter store.
 */
export class RateLimiterStore {
  private readonly buckets = new Map<string, BucketState>();

  /**
   * Prunes expired entries and evicts the oldest entry if the map exceeds
   * {@link MAX_BUCKETS}.
   */
  private prune(nowMs: number): void {
    for (const [bucketKey, state] of this.buckets.entries()) {
      if (state.resetAtMs <= nowMs) {
        this.buckets.delete(bucketKey);
      }
    }

    if (this.buckets.size >= MAX_BUCKETS) {
      const oldestKey = this.buckets.keys().next().value;
      if (oldestKey !== undefined) {
        this.buckets.delete(oldestKey);
      }
    }
  }

  /**
   * Checks and records a single request against the configured window.
   */
  check(config: RateLimitConfig): RateLimitResult {
    const nowMs = config.nowMs ?? Date.now();
    const existing = this.buckets.get(config.key);

    if (!existing || existing.resetAtMs <= nowMs) {
      if (!existing && this.buckets.size >= MAX_BUCKETS) {
        this.prune(nowMs);
      }

      const resetAtMs = nowMs + config.windowMs;
      this.buckets.set(config.key, { count: 1, resetAtMs });

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - 1),
        resetAtMs,
        retryAfterSeconds: 0,
      };
    }

    if (existing.count >= config.maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAtMs - nowMs) / 1000)
      );
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetAtMs: existing.resetAtMs,
        retryAfterSeconds,
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - existing.count),
      resetAtMs: existing.resetAtMs,
      retryAfterSeconds: 0,
    };
  }

  /** Clears all rate limit buckets (primarily for test isolation). */
  reset(): void {
    this.buckets.clear();
  }
}

/** Shared default process-wide rate limiter instance. */
export const defaultRateLimiter = new RateLimiterStore();

/**
 * Evaluates a request against the shared rate limiter store.
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  return defaultRateLimiter.check(config);
}

/**
 * Extracts a sanitized client identifier from standard reverse-proxy headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const raw = forwarded || realIp || "anonymous";
  return raw.slice(0, 64);
}

/**
 * Formats standard `X-RateLimit-*` HTTP headers (and `Retry-After` if blocked).
 */
export function buildRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAtMs / 1000)),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}
