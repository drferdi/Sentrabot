import { describe, expect, it } from "vitest";
import { createFixedWindowRateLimiter } from "./rate-limiter.js";

function clock(start: number) {
  let current = start;
  return {
    now: () => current,
    advance(ms: number) {
      current += ms;
    },
  };
}

describe("fixed window rate limiter", () => {
  it("allows up to the limit and then reports a retry delay", () => {
    const time = clock(0);
    const limiter = createFixedWindowRateLimiter({ limit: 3, windowMs: 60_000, now: time.now });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(limiter.check("1.1.1.1")).toEqual({ allowed: true, retryAfterSeconds: 0 });
    }

    const blocked = limiter.check("1.1.1.1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it("keeps a separate bucket per key", () => {
    const time = clock(0);
    const limiter = createFixedWindowRateLimiter({ limit: 1, windowMs: 60_000, now: time.now });

    expect(limiter.check("1.1.1.1").allowed).toBe(true);
    expect(limiter.check("1.1.1.1").allowed).toBe(false);
    // A different caller must not inherit the exhausted bucket.
    expect(limiter.check("2.2.2.2").allowed).toBe(true);
  });

  it("lets a caller through again once the window elapses", () => {
    const time = clock(0);
    const limiter = createFixedWindowRateLimiter({ limit: 1, windowMs: 60_000, now: time.now });

    expect(limiter.check("1.1.1.1").allowed).toBe(true);
    expect(limiter.check("1.1.1.1").allowed).toBe(false);

    time.advance(60_000);
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
  });

  it("shortens the retry delay as the window drains", () => {
    const time = clock(0);
    const limiter = createFixedWindowRateLimiter({ limit: 1, windowMs: 60_000, now: time.now });

    limiter.check("1.1.1.1");
    time.advance(45_000);
    expect(limiter.check("1.1.1.1").retryAfterSeconds).toBe(15);
  });

  it("evicts expired buckets instead of growing without bound", () => {
    const time = clock(0);
    const limiter = createFixedWindowRateLimiter({ limit: 1, windowMs: 1_000, now: time.now });

    for (let caller = 0; caller < 50; caller += 1) {
      limiter.check(`10.0.0.${caller}`);
    }
    expect(limiter.size()).toBe(50);

    time.advance(1_000);
    // The sweep runs on the next check, so one fresh bucket survives.
    limiter.check("10.0.1.1");
    expect(limiter.size()).toBe(1);
  });
});
