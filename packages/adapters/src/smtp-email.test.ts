import { describe, expect, it, vi } from "vitest";
import { createSmtpEmailSender, parseSmtpUrl, SmtpEmailSender } from "./smtp-email.js";

describe("parseSmtpUrl", () => {
  it("parses host, port, and secure from an smtps:// URL", () => {
    expect(parseSmtpUrl("smtps://mail.example.com")).toEqual({
      host: "mail.example.com",
      port: 465,
      secure: true,
      auth: undefined,
    });
  });

  it("parses a plain smtp:// URL with an explicit port and credentials", () => {
    expect(parseSmtpUrl("smtp://user%40x:p%40ss@mail.example.com:2525")).toEqual({
      host: "mail.example.com",
      port: 2525,
      secure: false,
      auth: { user: "user@x", pass: "p@ss" },
    });
  });

  it("defaults smtp:// without a port to 587", () => {
    expect(parseSmtpUrl("smtp://mail.example.com").port).toBe(587);
  });
});

describe("createSmtpEmailSender", () => {
  it("returns undefined when SMTP_URL is not configured", () => {
    expect(createSmtpEmailSender({})).toBeUndefined();
  });

  it("returns undefined when there is no usable from address", () => {
    expect(createSmtpEmailSender({ SMTP_URL: "smtp://mail.example.com" })).toBeUndefined();
  });

  it("builds a transport from SMTP_URL and uses the auth user as sender when SMTP_FROM is unset", () => {
    const createTransportFn = vi.fn(() => ({ sendMail: vi.fn() }) as never);

    const sender = createSmtpEmailSender(
      { SMTP_URL: "smtp://bot:secret@mail.example.com:587" },
      createTransportFn,
    );

    expect(sender).toBeInstanceOf(SmtpEmailSender);
    expect(createTransportFn).toHaveBeenCalledWith({
      host: "mail.example.com",
      port: 587,
      secure: false,
      auth: { user: "bot", pass: "secret" },
    });
  });

  it("prefers SMTP_FROM over the auth user for the sender address", async () => {
    const sendMail = vi.fn(async () => undefined);
    const createTransportFn = vi.fn(() => ({ sendMail }) as never);

    const sender = createSmtpEmailSender(
      { SMTP_URL: "smtp://bot:secret@mail.example.com", SMTP_FROM: "no-reply@sentrabot.app" },
      createTransportFn,
    );

    await sender?.send({ to: "user@example.com", subject: "Verify", text: "click here" });

    expect(sendMail).toHaveBeenCalledWith({
      from: "no-reply@sentrabot.app",
      to: "user@example.com",
      subject: "Verify",
      text: "click here",
      html: undefined,
    });
  });
});
