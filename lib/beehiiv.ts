/**
 * Beehiiv subscriber sync helper.
 *
 * Use from auth callbacks / signup handlers / payment webhooks to push
 * customer emails to the central beehiiv newsletter. Fire-and-forget —
 * never blocks or throws on failure (beehiiv being down should not break
 * user signup).
 *
 * Env vars required (graceful no-op if missing):
 *   BEEHIIV_API_KEY
 *   BEEHIIV_PUBLICATION_ID
 */

type SubscribePayload = {
  email: string;
  utmSource: string;       // e.g. "huevsite-io"
  utmCampaign?: string;    // e.g. "signup", "upgraded-pro"
  customFields?: Record<string, string>;
  /**
   * Force beehiiv to send a double opt-in email instead of subscribing
   * silently. Use for backfill of existing users where consent was not
   * collected at signup time (GDPR-safe).
   */
  doubleOptIn?: boolean;
};

export type SubscribeResult = { ok: boolean; error?: string };

export async function subscribeToBeehiiv(payload: SubscribePayload): Promise<SubscribeResult> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !pubId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[beehiiv] missing env vars — skipping subscribe");
    }
    return { ok: false, error: "missing env" };
  }

  if (!payload.email || !payload.email.trim()) {
    return { ok: false, error: "missing email" };
  }

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email: payload.email.trim().toLowerCase(),
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: payload.utmSource,
          utm_medium: "saas-signup",
          utm_campaign: payload.utmCampaign ?? "signup",
          ...(payload.customFields ? { custom_fields: payload.customFields } : {}),
          ...(payload.doubleOptIn ? { double_opt_override: "on" } : {}),
        }),
      }
    );

    if (!res.ok) {
      // 422 = email already subscribed (idempotent — treat as success)
      if (res.status === 422) return { ok: true };
      const err = await res.text().catch(() => "unknown");
      console.error("[beehiiv] subscribe failed:", res.status, err);
      return { ok: false, error: `${res.status}: ${err}` };
    }

    return { ok: true };
  } catch (err) {
    console.error("[beehiiv] subscribe threw:", err);
    return { ok: false, error: String(err) };
  }
}
