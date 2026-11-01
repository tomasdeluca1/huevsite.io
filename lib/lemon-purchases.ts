import { attributionFromCustomData } from "@/lib/checkout-attribution";

// The $79 Founder variant the webhook already expects. An env override is
// added on top so a renamed product still grants lifetime, and the original
// id keeps working for refunds of orders already sold.
const FOUNDER_LAUNCH_VARIANT_ID = "1769406";

export function founderVariantIds(): string[] {
  const ids = new Set<string>([FOUNDER_LAUNCH_VARIANT_ID]);
  const launch = process.env.LEMON_LIFETIME_VARIANT_ID?.trim();
  const next = process.env.LEMON_FOUNDER_129_VARIANT_ID?.trim();
  if (launch) ids.add(launch);
  if (next) ids.add(next);
  return Array.from(ids);
}

export function isFounderVariant(variantId: unknown): boolean {
  if (variantId == null || variantId === "") return false;
  return founderVariantIds().includes(String(variantId));
}

export function orderVariantId(attrs: { first_order_item?: { variant_id?: unknown } } | null | undefined): string | null {
  const id = attrs?.first_order_item?.variant_id;
  if (id == null || id === "") return null;
  return String(id);
}

type PurchaseClient = {
  from: (table: string) => any;
};

export async function recordLemonPurchase(
  supabase: PurchaseClient,
  input: {
    userId: string | null;
    eventName: string;
    lemonId: string;
    variantId?: string | null;
    status?: string | null;
    customData?: Record<string, unknown> | null;
  }
): Promise<void> {
  if (!input.lemonId) return;
  const attr = attributionFromCustomData(input.customData);
  try {
    const { error } = await supabase.from("lemon_purchases").upsert(
      {
        user_id: input.userId,
        event_name: input.eventName,
        lemon_id: input.lemonId,
        variant_id: input.variantId ?? null,
        status: input.status ?? null,
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign,
        utm_content: attr.utm_content,
        ref: attr.ref,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_name,lemon_id", ignoreDuplicates: true }
    );
    if (error) console.error("[lemon_purchases] upsert:", error.message);
  } catch (e) {
    console.error("[lemon_purchases] upsert failed:", e);
  }
}

export async function markLemonOrderRefunded(
  supabase: PurchaseClient,
  orderId: string,
  userId: string | null,
  variantId: string | null
): Promise<void> {
  await recordLemonPurchase(supabase, {
    userId,
    eventName: "order_refunded",
    lemonId: orderId,
    variantId,
    status: "refunded",
  });
  try {
    const { error } = await supabase
      .from("lemon_purchases")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("event_name", "order_created")
      .eq("lemon_id", orderId);
    if (error) console.error("[lemon_purchases] refund status:", error.message);
  } catch (e) {
    console.error("[lemon_purchases] refund status failed:", e);
  }
}

/** True when this order was stored as a Founder purchase (variant missing on the refund payload). */
export async function isRecordedFounderOrder(supabase: PurchaseClient, orderId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("lemon_purchases")
      .select("variant_id")
      .eq("event_name", "order_created")
      .eq("lemon_id", orderId)
      .maybeSingle();
    if (error || !data) return false;
    return !data.variant_id || isFounderVariant(data.variant_id);
  } catch {
    return false;
  }
}

export async function founderRefundAlreadyRecorded(
  supabase: PurchaseClient,
  orderId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("lemon_purchases")
      .select("id")
      .eq("event_name", "order_refunded")
      .eq("lemon_id", orderId)
      .maybeSingle();
    if (error) {
      console.error("[lemon_purchases] refund lookup:", error.message);
      return false;
    }
    return !!data;
  } catch (e) {
    console.error("[lemon_purchases] refund lookup failed:", e);
    return false;
  }
}

// true = active Pro sub, false = none, null = could not verify (caller should retry).
export async function hasActiveProSubscription(subscriptionId: string | null | undefined): Promise<boolean | null> {
  if (!subscriptionId) return false;
  const key = process.env.LEMON_SQUEEZY_API_KEY;
  if (!key) {
    console.error("[lemon] falta LEMON_SQUEEZY_API_KEY para verificar la suscripción en un reembolso");
    return null;
  }
  try {
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      }
    );
    if (res.status === 404) return false;
    if (!res.ok) {
      console.error("[lemon] subscription lookup status", res.status);
      return null;
    }
    const json = await res.json();
    const status = json?.data?.attributes?.status;
    return status === "active" || status === "on_trial";
  } catch (e) {
    console.error("[lemon] subscription lookup failed:", e);
    return null;
  }
}
