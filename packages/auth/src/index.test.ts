import { describe, expect, it } from "vitest";
import { blockedAuthPaths } from "./index.js";

describe("auth policy", () => {
  it("blocks invitation and org-creation paths in version 1", () => {
    expect(blockedAuthPaths.some((p) => p.includes("invite"))).toBe(true);
    expect(blockedAuthPaths.some((p) => p.includes("create"))).toBe(true);
  });
});
