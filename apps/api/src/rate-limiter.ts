/**
 * Minimal in-memory fixed-window rate limiter. State lives in a single
 * process, which is fine for a single-instance self-host; running the API
 * as multiple instances would need shared storage (e.g. Redis) instead.
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function createFixedWindowRateLimiter(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const { limit, windowMs, now = () => Date.now() } = options;
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string): RateLimitResult {
      const current = now();
      // Sweep expired buckets on every check so the map can't grow without
      // bound as distinct callers (IPs) come and go.
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= current) buckets.delete(bucketKey);
      }
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { count: 0, resetAt: current + windowMs };
        buckets.set(key, bucket);
      }
      bucket.count += 1;
      if (bucket.count > limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - current) / 1000)),
        };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
    /** Live bucket count, so a test can assert that expired entries are swept. */
    size(): number {
      return buckets.size;
    },
  };
}
