import type { NextApiRequest } from "next";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
  /** Namespace so different endpoints don't share a bucket. */
  prefix?: string;
}

/** First hop of X-Forwarded-For (what Vercel sets), else the socket address. */
export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return first?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

// --- Upstash-backed limiter (production) ---

const upstashConfigured = () =>
  Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );

const limiters = new Map<string, Ratelimit>();

const getUpstashLimiter = (
  prefix: string,
  maxAttempts: number,
  windowMs: number,
): Ratelimit => {
  const key = `${prefix}:${maxAttempts}:${windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(maxAttempts, `${windowMs} ms`),
      prefix: `ratelimit:${prefix}`,
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
};

// --- In-memory fallback (local dev, tests) ---
//
// Per-process only. On a serverless platform each isolate has its own store
// and cold starts reset it, so this is not a production control.

interface Entry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, Entry>();
const SWEEP_THRESHOLD = 1000;

const sweep = (now: number) => {
  if (memoryStore.size < SWEEP_THRESHOLD) return;
  memoryStore.forEach((entry, key) => {
    if (now > entry.resetAt) memoryStore.delete(key);
  });
};

const memoryLimit = (
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean => {
  const now = Date.now();
  sweep(now);
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > maxAttempts;
};

let warnedFallback = false;

/**
 * Per-IP rate limit. Resolves true when the request should be blocked.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * are set (survives isolates and cold starts); otherwise falls back to the
 * in-memory store. If Upstash errors, the request is allowed so an outage
 * degrades to no limiting rather than a locked-out admin.
 */
export async function rateLimit(
  req: NextApiRequest,
  { maxAttempts = 5, windowMs = 15 * 60 * 1000, prefix = "default" }: RateLimitOptions = {},
): Promise<boolean> {
  const ip = getClientIp(req);

  if (upstashConfigured()) {
    try {
      const { success } = await getUpstashLimiter(prefix, maxAttempts, windowMs).limit(ip);
      return !success;
    } catch (error) {
      console.error("rateLimit: Upstash unavailable, allowing request", error);
      return false;
    }
  }

  if (process.env.NODE_ENV === "production" && !warnedFallback) {
    warnedFallback = true;
    console.warn(
      "rateLimit: UPSTASH_REDIS_REST_URL/TOKEN not set; using per-instance memory store",
    );
  }
  return memoryLimit(`${prefix}:${ip}`, maxAttempts, windowMs);
}
