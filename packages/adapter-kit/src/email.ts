/**
 * Transactional auth email only (verification link, password reset link) —
 * not marketing or templating. `text` is required and `html` is optional so
 * a link email works over the seam even for a client that renders no HTML;
 * adapters that support HTML send both parts.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
