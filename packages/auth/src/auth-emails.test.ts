import { describe, expect, it, vi } from "vitest";
import { deliverAuthEmail, passwordResetEmail, verificationEmail } from "./auth-emails.js";

const RESET_URL = "https://api.sentrabot.test/api/auth/reset-password/tok_123?callbackURL=%2F";
const VERIFY_URL = "https://api.sentrabot.test/api/auth/verify-email?token=tok_123&callbackURL=%2F";

describe("auth email copy", () => {
  it("carries the reset link in both the text and html parts", () => {
    const message = passwordResetEmail(RESET_URL);
    expect(message.subject).toContain("kata sandi");
    expect(message.text).toContain(RESET_URL);
    expect(message.html).toContain(`href="${RESET_URL}"`);
  });

  it("tells the reader a reset link is single use and time limited", () => {
    const message = passwordResetEmail(RESET_URL);
    expect(message.text).toContain("sekali");
    expect(message.text).toContain("1 jam");
  });

  it("carries the verification link in both parts", () => {
    const message = verificationEmail(VERIFY_URL);
    expect(message.text).toContain(VERIFY_URL);
    expect(message.html).toContain(`href="${VERIFY_URL}"`);
  });
});

describe("auth email delivery", () => {
  it("sends through the configured sender", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const onUnavailable = vi.fn();

    await deliverAuthEmail(
      { send },
      "person@example.test",
      passwordResetEmail(RESET_URL),
      onUnavailable,
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "person@example.test", subject: expect.any(String) }),
    );
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it("reports rather than throws when no sender is configured", async () => {
    const onUnavailable = vi.fn();

    await expect(
      deliverAuthEmail(
        undefined,
        "person@example.test",
        verificationEmail(VERIFY_URL),
        onUnavailable,
      ),
    ).resolves.toBeUndefined();

    expect(onUnavailable).toHaveBeenCalledWith(expect.stringContaining("SMTP_URL"));
  });

  it("swallows a delivery failure so the auth response stays uniform", async () => {
    const send = vi.fn().mockRejectedValue(new Error("relay refused"));
    const onUnavailable = vi.fn();

    await expect(
      deliverAuthEmail(
        { send },
        "person@example.test",
        verificationEmail(VERIFY_URL),
        onUnavailable,
      ),
    ).resolves.toBeUndefined();

    expect(onUnavailable).toHaveBeenCalledWith(expect.stringContaining("relay refused"));
  });
});
