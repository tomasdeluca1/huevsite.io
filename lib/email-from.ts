// One From for every outbound mail: transactional, internal, digest, and blasts.
// EMAIL_FROM overrides it and may be either a bare address or "Name <addr>".
// Reply-To stays Tomás's mailbox even when From is overridden.

export const DEFAULT_EMAIL_FROM = "Tomás de huevsite <tomidelu@huevsite.com>";
export const EMAIL_REPLY_TO = "tomidelu@huevsite.com";

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function bareEmailAddress(raw: string): string {
  const cleaned = oneLine(raw);
  const bracketed = cleaned.match(/<([^<>]+)>/);
  return (bracketed ? bracketed[1] : cleaned).trim();
}

/** Header value for the From field. */
export function emailFrom(): string {
  const raw = oneLine(process.env.EMAIL_FROM || "");
  return raw || DEFAULT_EMAIL_FROM;
}

/** Address only, for mailto and footers. */
export function emailFromAddress(): string {
  return bareEmailAddress(emailFrom());
}

/** Reply-To on every send. */
export function emailReplyTo(): string {
  return EMAIL_REPLY_TO;
}

/** mailto target for List-Unsubscribe. Same mailbox as the default From. */
export function listUnsubscribeMailto(): string {
  return `mailto:${emailFromAddress()}?subject=unsubscribe`;
}

/**
 * CAN-SPAM postal line. Empty when EMAIL_POSTAL_ADDRESS is unset: callers
 * omit the line instead of inventing an address.
 */
export function emailPostalAddress(): string | null {
  const value = oneLine(process.env.EMAIL_POSTAL_ADDRESS || "");
  return value || null;
}

/** Visible sender identity in commercial footers. */
export function senderIdentityLine(address = emailFromAddress()): string {
  return `huevsite.io · ${oneLine(address)}`;
}
