import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const script = path.resolve("scripts/publish-playwright-report.sh");

function runPublish(env: NodeJS.ProcessEnv): {
  status: number | null;
  output: string;
} {
  const result = spawnSync("bash", [script], {
    encoding: "utf8",
    env,
  });
  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

const isolatedEnv = {
  PATH: process.env.PATH ?? "/usr/bin:/bin",
  HOME: process.env.HOME ?? "/tmp",
} as const satisfies NodeJS.ProcessEnv;

describe("publish-playwright-report.sh", () => {
  it("skips when S3 credentials are unset", () => {
    const result = runPublish(isolatedEnv);
    expect(result.status).toBe(0);
    expect(result.output).toMatch(/Skipping Playwright visual report publish/);
  });

  it("fails when credentials exist but the S3 destination is incomplete", () => {
    const result = runPublish({
      ...isolatedEnv,
      AWS_ACCESS_KEY_ID: "test-access-key",
      AWS_SECRET_ACCESS_KEY: "test-secret-key",
    });
    expect(result.status).not.toBe(0);
    expect(result.output).toMatch(/S3_BUCKET is required/);
  });
});
