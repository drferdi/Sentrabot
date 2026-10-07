import type { EmailMessage, EmailSender } from "@sentrabot/adapter-kit";
import nodemailer, { type Transporter } from "nodemailer";

export interface SmtpConnectionOptions {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
}

/** Parses `smtp(s)://[user:pass@]host[:port]` into nodemailer transport options. */
export function parseSmtpUrl(smtpUrl: string): SmtpConnectionOptions {
  const url = new URL(smtpUrl);
  const secure = url.protocol === "smtps:";
  const port = url.port ? Number(url.port) : secure ? 465 : 587;
  const auth = url.username
    ? { user: decodeURIComponent(url.username), pass: decodeURIComponent(url.password) }
    : undefined;
  return { host: url.hostname, port, secure, auth };
}

type SendMailTransport = Pick<Transporter, "sendMail">;

export class SmtpEmailSender implements EmailSender {
  constructor(
    private readonly transport: SendMailTransport,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}

/**
 * Reads SMTP_URL (and the optional SMTP_FROM sender address, falling back to
 * the URL's credentialed user) from `env`. Returns `undefined` when SMTP_URL
 * is not configured so the API can start and callers can degrade honestly
 * ("email belum tersedia") instead of throwing at boot.
 */
export function createSmtpEmailSender(
  env: NodeJS.ProcessEnv = process.env,
  createTransportFn: typeof nodemailer.createTransport = nodemailer.createTransport,
): SmtpEmailSender | undefined {
  const smtpUrl = env.SMTP_URL;
  if (!smtpUrl) return undefined;
  const options = parseSmtpUrl(smtpUrl);
  const from = env.SMTP_FROM ?? options.auth?.user;
  if (!from) return undefined;
  const transport = createTransportFn(options);
  return new SmtpEmailSender(transport, from);
}
