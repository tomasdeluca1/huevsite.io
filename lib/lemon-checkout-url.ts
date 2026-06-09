// $9 Pro product. The old $5 product (d1f67827…) stays alive in Lemon Squeezy
// so existing $5 subscribers keep their price; only NEW checkouts use $9.
const FALLBACK_LEMON_CHECKOUT_URL = "https://huevsite.lemonsqueezy.com/checkout/buy/a5f6003d-0d43-4e9d-80b8-27c61dbd08dc";

export const lemonCheckoutUrl =
  process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ||
  process.env.LEMON_SQUEEZY_CHECKOUT_URL ||
  FALLBACK_LEMON_CHECKOUT_URL;

// One-time "Founder / Lifetime" checkout (the live Lemon Squeezy product).
// Hardcoded fallback mirrors lemonCheckoutUrl so the Founder tier is active
// without needing a Vercel env var; the env var still overrides it.
const FALLBACK_LEMON_LIFETIME_CHECKOUT_URL =
  "https://huevsite.lemonsqueezy.com/checkout/buy/ef012c32-fc7a-4b32-974c-8ec00b7071f9";

export const lemonLifetimeCheckoutUrl =
  process.env.NEXT_PUBLIC_LEMON_LIFETIME_CHECKOUT_URL ||
  FALLBACK_LEMON_LIFETIME_CHECKOUT_URL;

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
