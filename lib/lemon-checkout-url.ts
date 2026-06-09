const FALLBACK_LEMON_CHECKOUT_URL = "https://huevsite.lemonsqueezy.com/checkout/buy/d1f67827-c296-4708-a267-c6666ea0f3ae";

export const lemonCheckoutUrl =
  process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ||
  process.env.LEMON_SQUEEZY_CHECKOUT_URL ||
  FALLBACK_LEMON_CHECKOUT_URL;

// One-time "Founder / Lifetime" checkout. Intentionally has NO fallback: until a
// Lemon Squeezy lifetime product is created and NEXT_PUBLIC_LEMON_LIFETIME_CHECKOUT_URL
// is set, this is null and the UI shows the tier without an active buy button
// (no broken purchase path).
export const lemonLifetimeCheckoutUrl =
  process.env.NEXT_PUBLIC_LEMON_LIFETIME_CHECKOUT_URL || null;

// Build a checkout URL that carries the buyer's identity so the Lemon Squeezy
// webhook can map the purchase deterministically:
//  - checkout[custom][user_id] → echoed back as meta.custom_data.user_id
//  - checkout[email]           → prefills + strengthens the email fallback
// Brackets stay literal (Lemon Squeezy expects them); only values are encoded.
export function buildLemonCheckoutUrl(
  userId?: string | null,
  email?: string | null,
  baseUrl: string = lemonCheckoutUrl
): string {
  const parts: string[] = [];
  if (email) parts.push(`checkout[email]=${encodeURIComponent(email)}`);
  if (userId) parts.push(`checkout[custom][user_id]=${encodeURIComponent(userId)}`);
  return parts.length ? `${baseUrl}?${parts.join("&")}` : baseUrl;
}
