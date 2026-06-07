import crypto from "crypto";
import { SITE_URL } from "@/lib/site-url";

// Stateless, signed one-click unsubscribe links for the weekly community digest.
// The link carries the user id + an HMAC so anyone clicking their own footer link
// can opt out without logging in, but nobody can unsubscribe someone else by
// guessing ids.

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

export function buildUnsubscribeUrl(userId: string): string {
  return `${SITE_URL}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&sig=${signUnsubscribe(userId)}`;
}
