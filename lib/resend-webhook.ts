import crypto from "crypto";

// Resend signs webhooks with Svix. The secret from the dashboard is `whsec_`
// plus the base64 key. We verify the raw body before trusting the event.

const TOLERANCE_SECONDS = 5 * 60;

export type ResendWebhookHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

export type SuppressionReason = "bounced" | "complained";

export type ResendSuppressionEvent = {
  email: string;
  reason: SuppressionReason;
};

export function decodeWebhookSecret(secret: string): Buffer | null {
  const raw = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  if (!raw.trim()) return null;
  const buf = Buffer.from(raw, "base64");
  if (buf.length === 0) return null;
  return buf;
}

export function verifyResendWebhook(
  payload: string,
  headers: ResendWebhookHeaders,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  const id = headers.id || "";
  const timestamp = headers.timestamp || "";
  const signature = headers.signature || "";
  if (!id || !timestamp || !signature || !secret) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) return false;

  const key = decodeWebhookSecret(secret);
  if (!key) return false;

  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);

  for (const part of signature.split(" ")) {
    const comma = part.indexOf(",");
    if (comma <= 0) continue;
    const version = part.slice(0, comma);
    const value = part.slice(comma + 1);
    if (version !== "v1" || !value) continue;
    const got = Buffer.from(value);
    if (got.length !== expectedBuf.length) continue;
    if (crypto.timingSafeEqual(got, expectedBuf)) return true;
  }
  return false;
}

/** Bounce and complaint events only. Everything else is ignored by the route. */
export function suppressionFromResendEvent(payload: unknown): ResendSuppressionEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { type?: unknown; data?: { to?: unknown } };
  const reason: SuppressionReason | null =
    record.type === "email.bounced"
      ? "bounced"
      : record.type === "email.complained"
        ? "complained"
        : null;
  if (!reason) return null;

  const to = record.data?.to;
  const raw = Array.isArray(to) ? to[0] : typeof to === "string" ? to : "";
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return { email, reason };
}
