import { describe, expect, it, vi } from "vitest";

describe("managed AI gateway", () => {
  it("persists usage metadata without private prompt or response", async () => {
    const { createManagedAiRoutes } = await import("./managed-ai.js");
    const reserveUsage = vi.fn().mockResolvedValue({ reservationId: "reservation-1" });
    const finalizeUsage = vi.fn().mockResolvedValue(undefined);
    const releaseUsage = vi.fn().mockResolvedValue(undefined);
    const app = createManagedAiRoutes({
      authenticate: async () => ({ userId: "user-1", workspaceId: "workspace-1" }),
      isTrustedRuntime: async () => true,
      getBudgetRatio: async () => 0.8,
      reserveUsage,
      finalizeUsage,
      releaseUsage,
      estimateCostMicros: () => 100n,
      calculateActualCostMicros: () => 42n,
      providerId: "openai",
      priceVersion: "test",
      now: () => new Date("2026-09-02T00:00:00.000Z"),
      provider: {
        generate: async () => ({
          outputText: "private response",
          usage: { inputTokens: 3, outputTokens: 5 },
        }),
        stream: async function* () {},
      },
    });

    const response = await app.request("/v1/managed-ai/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceId: "device-1",
        runtimeId: "runtime-1",
        idempotencyKey: "request-1",
        complexity: "complex",
        input: "private prompt",
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ outputText: "private response" });
    expect(reserveUsage).toHaveBeenCalledWith(
      expect.objectContaining({ capability: "managed_ai", estimatedCostMicros: 100n }),
    );
    expect(finalizeUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai",
        model: "terra",
        inputTokens: 3,
        outputTokens: 5,
      }),
    );
    expect(finalizeUsage.mock.calls[0]?.[0]).not.toHaveProperty("input");
    expect(finalizeUsage.mock.calls[0]?.[0]).not.toHaveProperty("outputText");
  });

  it("releases an unused reservation when the provider fails", async () => {
    const { createManagedAiRoutes } = await import("./managed-ai.js");
    const releaseUsage = vi.fn().mockResolvedValue(undefined);
    const app = createManagedAiRoutes({
      authenticate: async () => ({ userId: "user-1", workspaceId: "workspace-1" }),
      isTrustedRuntime: async () => true,
      getBudgetRatio: async () => 0,
      reserveUsage: async () => ({ reservationId: "reservation-1" }),
      finalizeUsage: async () => undefined,
      releaseUsage,
      estimateCostMicros: () => 100n,
      calculateActualCostMicros: () => 0n,
      providerId: "openai",
      priceVersion: "test",
      now: () => new Date("2026-09-02T00:00:00.000Z"),
      provider: {
        generate: async () => {
          throw new Error("provider unavailable");
        },
        stream: async function* () {},
      },
    });

    const response = await app.request("/v1/managed-ai/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceId: "device-1",
        runtimeId: "runtime-1",
        idempotencyKey: "request-1",
        complexity: "simple",
        input: "private prompt",
      }),
    });

    expect(response.status).toBe(502);
    expect(releaseUsage).toHaveBeenCalledWith(
      expect.objectContaining({ reservationId: "reservation-1" }),
    );
  });

  it("throttles a caller that floods the route, before spending on the provider", async () => {
    const { createManagedAiRoutes } = await import("./managed-ai.js");
    const authenticate = vi.fn().mockResolvedValue(null);
    const app = createManagedAiRoutes({
      authenticate,
      isTrustedRuntime: async () => true,
      getBudgetRatio: async () => 0.1,
      reserveUsage: async () => ({ reservationId: "reservation-1" }),
      finalizeUsage: async () => undefined,
      releaseUsage: async () => undefined,
      estimateCostMicros: () => 100n,
      calculateActualCostMicros: () => 42n,
      providerId: "openai",
      priceVersion: "test",
      now: () => new Date("2026-09-02T00:00:00.000Z"),
      provider: {
        generate: async () => ({
          outputText: "private response",
          usage: { inputTokens: 3, outputTokens: 5 },
        }),
        stream: async function* () {},
      },
    });

    const flood = () =>
      app.request("/v1/managed-ai/responses", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
        body: JSON.stringify({
          deviceId: "device-1",
          runtimeId: "runtime-1",
          idempotencyKey: "request-1",
          complexity: "simple",
          input: "private prompt",
        }),
      });

    // Unauthenticated, so every allowed call stops at 401 rather than 429.
    for (let attempt = 0; attempt < 60; attempt += 1) {
      expect((await flood()).status).toBe(401);
    }

    const throttled = await flood();
    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("Retry-After")).toBe("60");
    // The limiter runs before authentication, so the flood never reached it again.
    expect(authenticate).toHaveBeenCalledTimes(60);

    // A different caller keeps its own budget.
    const other = await app.request("/v1/managed-ai/responses", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.8" },
      body: JSON.stringify({
        deviceId: "device-1",
        runtimeId: "runtime-1",
        idempotencyKey: "request-1",
        complexity: "simple",
        input: "private prompt",
      }),
    });
    expect(other.status).toBe(401);
  });
});
