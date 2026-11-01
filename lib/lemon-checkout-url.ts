import { CHECKOUT_CUSTOM_KEYS, type CheckoutAttribution } from "@/lib/checkout-attribution";

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

// One-time Founder checkout at $129, used only after the $79 batch is full.
// No hardcoded fallback: if this is empty the pricing card shows "Agotado"
// instead of sending people through the $79 product. Server-only env is
// enough because the URL is chosen in a server component and passed down.
export const lemonFounder129CheckoutUrl =
  process.env.LEMON_FOUNDER_129_CHECKOUT_URL ||
  process.env.NEXT_PUBLIC_LEMON_FOUNDER_129_CHECKOUT_URL ||
  "";

// One-time "Launch boost" checkout ($12: pins a Builders Hunt launch as
// featured for its week). No hardcoded fallback — the feature stays hidden
// until the env var points at the live Lemon product.
export const lemonBoostCheckoutUrl =
  process.env.NEXT_PUBLIC_LEMON_BOOST_CHECKOUT_URL || "";

// Build a checkout URL that carries the buyer's identity so the Lemon Squeezy
// webhook can map the purchase deterministically:
//  - checkout[custom][user_id] → echoed back as meta.custom_data.user_id
//  - checkout[email]           → prefills + strengthens the email fallback
//  - checkout[custom][utm_*|ref] → echoed back and stored on order/subscription
// Brackets stay literal (Lemon Squeezy expects them); only values are encoded.
export function buildLemonCheckoutUrl(
  userId?: string | null,
  email?: string | null,
  baseUrl: string = lemonCheckoutUrl,
  attribution?: CheckoutAttribution | null
): string {
  const parts: string[] = [];
  if (email) parts.push(`checkout[email]=${encodeURIComponent(email)}`);
  if (userId) parts.push(`checkout[custom][user_id]=${encodeURIComponent(userId)}`);
  if (attribution) {
    for (const key of CHECKOUT_CUSTOM_KEYS) {
      const val = attribution[key];
      if (val) parts.push(`checkout[custom][${key}]=${encodeURIComponent(val)}`);
    }
  }
  return parts.length ? `${baseUrl}?${parts.join("&")}` : baseUrl;
}

// Lemon honors this per checkout, so /checkout/success can tell a Founder
// purchase from Pro without reading columns the browser role cannot select.
export function withCheckoutSuccess(
  url: string,
  plan: "pro" | "founder",
  value?: number
): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io").replace(/\/$/, "");
  const target = new URL("/checkout/success", origin);
  target.searchParams.set("plan", plan);
  if (typeof value === "number" && value > 0) target.searchParams.set("value", String(value));
  const param = `checkout[product_options][redirect_url]=${encodeURIComponent(target.toString())}`;
  return `${url}${url.includes("?") ? "&" : "?"}${param}`;
}

// Boost checkout: identity + the launch to feature. The webhook reads
// custom_data.launch_id and flips project_launches.featured after payment.
export function buildBoostCheckoutUrl(
  launchId: string,
  userId?: string | null,
  email?: string | null
): string {
  if (!lemonBoostCheckoutUrl) return "";
  const parts: string[] = [`checkout[custom][launch_id]=${encodeURIComponent(launchId)}`];
  if (email) parts.push(`checkout[email]=${encodeURIComponent(email)}`);
  if (userId) parts.push(`checkout[custom][user_id]=${encodeURIComponent(userId)}`);
  return `${lemonBoostCheckoutUrl}?${parts.join("&")}`;
}
