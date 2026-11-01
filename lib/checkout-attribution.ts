// UTMs (and ref) that travel from /precios or the landing into Lemon Squeezy
// custom data, then come back on the webhook as meta.custom_data.

export const CHECKOUT_CUSTOM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "ref",
] as const;

// utm_term stays on the login return URL so we don't drop it, but Lemon
// custom data only carries the keys the webhook persists.
const PASSTHROUGH_KEYS = [...CHECKOUT_CUSTOM_KEYS, "utm_term"] as const;

export type CheckoutCustomKey = (typeof CHECKOUT_CUSTOM_KEYS)[number];
export type CheckoutAttribution = Partial<Record<CheckoutCustomKey | "utm_term", string>>;

type SearchParamSource =
  | { [key: string]: string | string[] | undefined }
  | URLSearchParams
  | undefined;

function readParam(sp: SearchParamSource, key: string): string | undefined {
  if (!sp) return undefined;
  if (typeof (sp as URLSearchParams).get === "function" && sp instanceof URLSearchParams) {
    return sp.get(key) || undefined;
  }
  const raw = (sp as { [key: string]: string | string[] | undefined })[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export function cleanAttributionValue(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[\r\n\t]/g, " ").trim().slice(0, 200);
  return cleaned || undefined;
}

export function attributionFromSearchParams(sp?: SearchParamSource): CheckoutAttribution {
  const out: CheckoutAttribution = {};
  for (const key of PASSTHROUGH_KEYS) {
    const val = cleanAttributionValue(readParam(sp, key));
    if (val) out[key] = val;
  }
  return out;
}

export function attributionToQuery(attr?: CheckoutAttribution | null): string {
  if (!attr) return "";
  const parts: string[] = [];
  for (const key of PASSTHROUGH_KEYS) {
    const val = attr[key];
    if (val) parts.push(`${key}=${encodeURIComponent(val)}`);
  }
  return parts.join("&");
}

export function attributionFromCustomData(
  customData: Record<string, unknown> | null | undefined
): Record<CheckoutCustomKey, string | null> {
  const out = {} as Record<CheckoutCustomKey, string | null>;
  for (const key of CHECKOUT_CUSTOM_KEYS) {
    const raw = customData?.[key];
    if (raw == null) {
      out[key] = null;
      continue;
    }
    out[key] = cleanAttributionValue(String(raw)) ?? null;
  }
  return out;
}
