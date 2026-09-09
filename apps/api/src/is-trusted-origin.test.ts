import { describe, expect, it } from "vitest";
import { isTrustedOrigin } from "./app.js";
import { loadEnv } from "./env.js";

const base = {
  DATABASE_URL: "postgres://sentrabot:sentrabot@127.0.0.1:5433/sentrabot",
  WEB_ORIGIN: "https://app.sentrabot.test",
};

const devEnv = loadEnv({ ...base, NODE_ENV: "test" });
const prodEnv = loadEnv({
  ...base,
  NODE_ENV: "production",
  BETTER_AUTH_SECRET: "prod-auth-secret-with-enough-length",
  ENCRYPTION_KEY: "prod-encryption-key-with-enough-length",
  SCREEN_PROXY_SECRET: "prod-screen-proxy-secret-with-enough-length",
  SANDBOX_PROVIDER: "e2b",
});

describe("isTrustedOrigin", () => {
  it("trusts an empty origin in every environment", () => {
    expect(isTrustedOrigin("", devEnv)).toBe(true);
    expect(isTrustedOrigin("", prodEnv)).toBe(true);
  });

  it("trusts env.webOrigin in every environment", () => {
    expect(isTrustedOrigin(devEnv.webOrigin, devEnv)).toBe(true);
    expect(isTrustedOrigin(prodEnv.webOrigin, prodEnv)).toBe(true);
  });

  it("trusts the exact sentrabot:// mobile origin in production", () => {
    expect(isTrustedOrigin("sentrabot://", prodEnv)).toBe(true);
  });

  it("rejects a spoofed sentrabot:// origin with a suffix", () => {
    expect(isTrustedOrigin("sentrabot://evil.example", prodEnv)).toBe(false);
    expect(isTrustedOrigin("sentrabot://evil.example", devEnv)).toBe(false);
  });

  it("trusts exp:// only outside production", () => {
    expect(isTrustedOrigin("exp://127.0.0.1:19000", devEnv)).toBe(true);
    expect(isTrustedOrigin("exp://127.0.0.1:19000", prodEnv)).toBe(false);
  });

  it("trusts localhost only outside production", () => {
    expect(isTrustedOrigin("http://localhost:5173", devEnv)).toBe(true);
    expect(isTrustedOrigin("http://localhost:5173", prodEnv)).toBe(false);
  });
});

describe("isTrustedOrigin loopback aliases", () => {
  const loopbackProd = loadEnv({
    DATABASE_URL: "postgres://sentrabot:sentrabot@127.0.0.1:5433/sentrabot",
    WEB_ORIGIN: "http://127.0.0.1:5173",
    NODE_ENV: "production",
    BETTER_AUTH_SECRET: "prod-auth-secret-with-enough-length",
    ENCRYPTION_KEY: "prod-encryption-key-with-enough-length",
    SCREEN_PROXY_SECRET: "prod-screen-proxy-secret-with-enough-length",
    SANDBOX_PROVIDER: "e2b",
  });

  it("accepts the loopback alias of a configured loopback origin in production", () => {
    expect(isTrustedOrigin("http://localhost:5173", loopbackProd)).toBe(true);
  });

  it("rejects a different port on the same loopback host", () => {
    expect(isTrustedOrigin("http://localhost:9999", loopbackProd)).toBe(false);
  });

  it("rejects a scheme the deployment did not configure", () => {
    expect(isTrustedOrigin("https://localhost:5173", loopbackProd)).toBe(false);
  });

  it("does not widen a deployment whose origins are not loopback", () => {
    expect(isTrustedOrigin("http://localhost:5173", prodEnv)).toBe(false);
    expect(isTrustedOrigin("http://127.0.0.1:5173", prodEnv)).toBe(false);
  });

  it("still rejects hostnames that merely look like loopback", () => {
    expect(isTrustedOrigin("http://localhost.evil.example:5173", loopbackProd)).toBe(false);
    expect(isTrustedOrigin("http://127.0.0.1.evil.example:5173", loopbackProd)).toBe(false);
  });
});

describe("isTrustedOrigin rejects values that are not real Origin serializations", () => {
  const loopbackProd = loadEnv({
    DATABASE_URL: "postgres://sentrabot:sentrabot@127.0.0.1:5433/sentrabot",
    WEB_ORIGIN: "http://127.0.0.1:5173",
    NODE_ENV: "production",
    BETTER_AUTH_SECRET: "prod-auth-secret-with-enough-length",
    ENCRYPTION_KEY: "prod-encryption-key-with-enough-length",
    SCREEN_PROXY_SECRET: "prod-screen-proxy-secret-with-enough-length",
    SANDBOX_PROVIDER: "e2b",
  });

  it("rejects userinfo smuggled in front of a loopback host", () => {
    expect(isTrustedOrigin("http://evil.example@localhost:5173", loopbackProd)).toBe(false);
  });

  it("rejects an origin carrying a path", () => {
    expect(isTrustedOrigin("http://localhost:5173/evil", loopbackProd)).toBe(false);
  });

  it("still trusts the mobile custom scheme, whose origin serializes to null", () => {
    expect(isTrustedOrigin("sentrabot://", loopbackProd)).toBe(true);
    expect(isTrustedOrigin("sentrabot://", devEnv)).toBe(true);
  });

  it("still trusts the Expo dev scheme outside production", () => {
    expect(isTrustedOrigin("exp://192.168.1.5:8081", devEnv)).toBe(true);
    expect(isTrustedOrigin("exp://192.168.1.5:8081", loopbackProd)).toBe(false);
  });
});
