// One From address for every outbound mail. The default is the address the
// digest already sends from: hi@huevsite.studio, the domain verified in Resend.
// EMAIL_FROM overrides it and may be either a bare address or "Name <addr>".

export const DEFAULT_EMAIL_FROM = "hi@huevsite.studio";

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

/** Address only, for mailto, footers, and display-name wrapping. */
export function emailFromAddress(): string {
  return bareEmailAddress(emailFrom());
}

/**
 * Mail 1 keeps its own display name. The address is FOUNDER_MAIL_FROM_ADDRESS,
 * then EMAIL_FROM, then the digest default. A value that already includes
 * "Name <addr>" contributes only the address.
 */
export function founderMailFromAddress(): string {
  const override = oneLine(process.env.FOUNDER_MAIL_FROM_ADDRESS || "");
  if (override) return bareEmailAddress(override);
  return emailFromAddress();
}

/** mailto target for List-Unsubscribe. Same mailbox as From. */
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
