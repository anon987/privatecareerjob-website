/**
 * Lightweight per-uid sliding-window rate limiter. In-memory per serverless
 * instance — best-effort (instances scale out and recycle), but it stops the
 * realistic abuse case: one signed-in user hammering the Gemini-billed routes
 * in a tight loop. Swap for a shared store (Upstash/KV) when scale demands.
 */

const buckets = new Map<string, number[]>();

/** True when the call is allowed; false when the window is exhausted. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // opportunistic cleanup so the map can't grow unbounded
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return true;
}

export const RATE_LIMITED_MESSAGE = "You're going a bit fast — please wait a minute and try again.";
