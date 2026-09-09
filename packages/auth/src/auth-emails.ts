import type { EmailSender } from "@sentrabot/adapter-kit";

/**
 * Transactional auth email copy. Indonesian, because the product defaults to it on every
 * surface. Plain text carries the link on its own line so a client that renders no HTML still
 * gives the reader something they can copy.
 */
function linkEmail(intro: string, action: string, url: string, expiry: string) {
  return {
    text: `${intro}\n\n${url}\n\n${expiry}\n\nJika Anda tidak meminta ini, abaikan email ini.`,
    html:
      `<p>${intro}</p>` +
      `<p><a href="${url}">${action}</a></p>` +
      `<p>${expiry}</p>` +
      `<p>Jika Anda tidak meminta ini, abaikan email ini.</p>`,
  };
}

export function verificationEmail(url: string) {
  const body = linkEmail(
    "Konfirmasi alamat email Anda untuk mengaktifkan akun Sentra Bot.",
    "Konfirmasi email",
    url,
    "Tautan ini berlaku 1 jam.",
  );
  return { subject: "Konfirmasi email Sentra Bot Anda", ...body };
}

export function passwordResetEmail(url: string) {
  const body = linkEmail(
    "Kami menerima permintaan untuk menyetel ulang kata sandi Sentra Bot Anda.",
    "Setel ulang kata sandi",
    url,
    "Tautan ini berlaku 1 jam dan hanya bisa dipakai sekali.",
  );
  return { subject: "Setel ulang kata sandi Sentra Bot", ...body };
}

/**
 * Sending must never break the calling auth flow. A deployment with no SMTP_URL has no sender
 * at all, and a configured relay can still fail; either way better-auth's own response is
 * already deliberately identical whether or not the address exists, so swallowing the failure
 * here keeps that property instead of leaking delivery state back to the caller.
 */
export async function deliverAuthEmail(
  sender: EmailSender | undefined,
  to: string,
  message: { subject: string; text: string; html: string },
  onUnavailable: (reason: string) => void,
): Promise<void> {
  if (!sender) {
    onUnavailable("SMTP_URL is not configured; auth email was not sent");
    return;
  }
  try {
    await sender.send({ to, ...message });
  } catch (error) {
    onUnavailable(`auth email delivery failed: ${String(error)}`);
  }
}
