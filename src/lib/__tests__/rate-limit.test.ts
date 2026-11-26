/**
 * @module lib/__tests__/rate-limit.test
 * Unit tests for the bounded sliding/fixed-window API rate limiter,
 * client IP header extraction, and standard rate-limit response headers.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRateLimitHeaders,
  getClientIp,
  RateLimiterStore,
} from "../rate-limit.ts";

test("RateLimiterStore allows requests within limit and blocks once exceeded", () => {
  const store = new RateLimiterStore();
  const baseTime = 1_700_000_000_000;

  const first = store.check({
    key: "analyze:1.2.3.4",
    maxRequests: 2,
    windowMs: 60_000,
    nowMs: baseTime,
  });
  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);

  const second = store.check({
    key: "analyze:1.2.3.4",
    maxRequests: 2,
    windowMs: 60_000,
    nowMs: baseTime + 5_000,
  });
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);

  const third = store.check({
    key: "analyze:1.2.3.4",
    maxRequests: 2,
    windowMs: 60_000,
    nowMs: baseTime + 10_000,
  });
  assert.equal(third.allowed, false);
  assert.equal(third.remaining, 0);
  assert.equal(third.retryAfterSeconds, 50);
});

test("RateLimiterStore resets quota after window expires and isolates distinct keys", () => {
  const store = new RateLimiterStore();
  const baseTime = 1_700_000_000_000;

  store.check({
    key: "ip-a",
    maxRequests: 1,
    windowMs: 10_000,
    nowMs: baseTime,
  });
  const blocked = store.check({
    key: "ip-a",
    maxRequests: 1,
    windowMs: 10_000,
    nowMs: baseTime + 5_000,
  });
  assert.equal(blocked.allowed, false);

  const otherIp = store.check({
    key: "ip-b",
    maxRequests: 1,
    windowMs: 10_000,
    nowMs: baseTime + 5_000,
  });
  assert.equal(otherIp.allowed, true);

  const resetWindow = store.check({
    key: "ip-a",
    maxRequests: 1,
    windowMs: 10_000,
    nowMs: baseTime + 10_000,
  });
  assert.equal(resetWindow.allowed, true);
  assert.equal(resetWindow.remaining, 0);
});

test("getClientIp extracts first x-forwarded-for address and defaults safely", () => {
  const forwardedHeaders = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    "x-real-ip": "198.51.100.2",
  });
  assert.equal(getClientIp(forwardedHeaders), "203.0.113.10");

  const realIpHeaders = new Headers({ "x-real-ip": "198.51.100.2" });
  assert.equal(getClientIp(realIpHeaders), "198.51.100.2");

  assert.equal(getClientIp(new Headers()), "anonymous");
});

test("buildRateLimitHeaders includes X-RateLimit headers and conditional Retry-After", () => {
  const allowedHeaders = buildRateLimitHeaders({
    allowed: true,
    limit: 20,
    remaining: 19,
    resetAtMs: 1_700_000_060_000,
    retryAfterSeconds: 0,
  });
  assert.equal(allowedHeaders["X-RateLimit-Limit"], "20");
  assert.equal(allowedHeaders["X-RateLimit-Remaining"], "19");
  assert.equal(allowedHeaders["Retry-After"], undefined);

  const blockedHeaders = buildRateLimitHeaders({
    allowed: false,
    limit: 20,
    remaining: 0,
    resetAtMs: 1_700_000_060_000,
    retryAfterSeconds: 45,
  });
  assert.equal(blockedHeaders["X-RateLimit-Remaining"], "0");
  assert.equal(blockedHeaders["Retry-After"], "45");
});
