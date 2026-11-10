import crypto from "crypto";
import { SITE_URL } from "./site-url";

// Stateless, signed one-click unsubscribe links.
// The link carries the user id + an HMAC so anyone clicking their own footer
// link can opt out without logging in, but nobody can unsubscribe someone else
// by guessing ids.
//
// New links use a single ?token= param. Links already in the wild use ?u=&sig=
// and keep verifying.

function secret(): string {
  return (
    process.env.EMAIL_UNSUBSCRIBE_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "huevsite-unsubscribe-fallback"
  );
}

export function signUnsubscribe(userId: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`digest:${userId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribe(userId: string, sig: string): boolean {
  if (!userId || !sig) return false;
  const expected = signUnsubscribe(userId);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

/** userId.sig. The signature is hex, so the last dot is the separator. */
export function buildUnsubscribeToken(userId: string): string {
  return `${userId}.${signUnsubscribe(userId)}`;
}

export function parseUnsubscribeToken(token: string): { userId: string; sig: string } | null {
  const value = token.trim();
  const dot = value.lastIndexOf(".");
  if (dot <= 0 || dot === value.length - 1) return null;
  return { userId: value.slice(0, dot), sig: value.slice(dot + 1) };
}

export function identityFromParts(parts: {
  token?: string | null;
  userId?: string | null;
  sig?: string | null;
}): { userId: string; sig: string } | null {
  const token = (parts.token || "").trim();
  if (token) {
    const parsed = parseUnsubscribeToken(token);
    if (parsed) return parsed;
  }
  const userId = (parts.userId || "").trim();
  const sig = (parts.sig || "").trim();
  if (userId && sig) return { userId, sig };
  return null;
}

export function buildUnsubscribeUrl(userId: string): string {
  const token = encodeURIComponent(buildUnsubscribeToken(userId));
  return `${SITE_URL}/api/email/unsubscribe?token=${token}`;
}
