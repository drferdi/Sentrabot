import { describe, expect, it } from "vitest";
import {
  DEV_AUTH_SECRET_PLACEHOLDER,
  DEV_ENCRYPTION_KEY_PLACEHOLDER,
  resolveAuthSecret,
  resolveEncryptionKey,
  resolveSupervisorToken,
} from "./secrets-guard.js";

describe("secrets-guard", () => {
  it("allows placeholders in test mode", () => {
    expect(resolveAuthSecret({ NODE_ENV: "test" })).toBe(DEV_AUTH_SECRET_PLACEHOLDER);
    expect(resolveEncryptionKey({ NODE_ENV: "test" })).toBe(DEV_ENCRYPTION_KEY_PLACEHOLDER);
  });

  it("rejects missing secrets outside local/test", () => {
    expect(() => resolveAuthSecret({ NODE_ENV: "production" })).toThrow(/BETTER_AUTH_SECRET/);
    expect(() => resolveEncryptionKey({ NODE_ENV: "production" })).toThrow(/ENCRYPTION_KEY/);
  });

  it("rejects placeholder values outside local/test", () => {
    expect(() =>
      resolveAuthSecret({
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: DEV_AUTH_SECRET_PLACEHOLDER,
      }),
    ).toThrow(/BETTER_AUTH_SECRET/);
    expect(() =>
      resolveEncryptionKey({
        NODE_ENV: "production",
        ENCRYPTION_KEY: DEV_ENCRYPTION_KEY_PLACEHOLDER,
      }),
    ).toThrow(/ENCRYPTION_KEY/);
  });

  it("accepts real secrets in production", () => {
    expect(
      resolveAuthSecret({
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: "prod-secret-with-enough-entropy-here",
      }),
    ).toBe("prod-secret-with-enough-entropy-here");
  });

  it("falls back supervisor token to auth secret", () => {
    expect(
      resolveSupervisorToken({
        NODE_ENV: "test",
        BETTER_AUTH_SECRET: "custom-auth",
      }),
    ).toBe("custom-auth");
    expect(
      resolveSupervisorToken({
        NODE_ENV: "test",
        SANDBOX_SUPERVISOR_TOKEN: "supervisor-only",
        BETTER_AUTH_SECRET: "custom-auth",
      }),
    ).toBe("supervisor-only");
  });
});
