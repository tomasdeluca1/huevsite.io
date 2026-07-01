// Thin client-side wrapper over umami. Safe to call anywhere: no-ops on the
// server or when the analytics script hasn't loaded.
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, any>) => void;
    };
  }
}

export function trackEvent(eventName: string, data?: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.umami?.track(eventName, data);
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
