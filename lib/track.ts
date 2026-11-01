// Thin client-side wrapper over umami. Safe to call anywhere: no-ops on the
// server or when the analytics script hasn't loaded.
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, any>) => void;
    };
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(eventName: string, data?: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.umami?.track(eventName, data);
}

/** Umami + GA4 purchase. Fired once the post-checkout page confirms Pro. */
export function trackPurchase(params: {
  tier: "pro" | "founder";
  transactionId?: string;
  value?: number;
}) {
  const data: Record<string, any> = { tier: params.tier, currency: "USD" };
  if (params.transactionId) data.transaction_id = params.transactionId;
  if (typeof params.value === "number") data.value = params.value;
  trackEvent("purchase", data);
  if (typeof window === "undefined") return;
  window.gtag?.("event", "purchase", {
    currency: "USD",
    ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
    ...(typeof params.value === "number" ? { value: params.value } : {}),
    items: [{ item_name: params.tier === "founder" ? "Founder" : "Pro" }],
  });
}

/** Cookie + localStorage key for the sticky hero A/B variant. Assigned
 *  server-side on the landing (app/page.tsx), persisted client-side, and read
 *  downstream (e.g. onboarding published) so funnel events join per variant. */
export const HERO_VARIANT_KEY = "hv_hero_variant";

export function getStoredHeroVariant(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(HERO_VARIANT_KEY);
  } catch {
    return null;
  }
}
