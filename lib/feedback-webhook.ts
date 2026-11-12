import { waitUntil } from "@vercel/functions";

const FORWARD_TIMEOUT_MS = 5_000;

export type FeedbackWebhookPayload = {
  message: string;
  page_url: string | null;
  user_handle: string | null;
  user_id: string;
  plan: string;
  created_at: string;
  feedback_id: string;
};

type FeedbackPlanProfile = {
  subscription_tier?: string | null;
  is_lifetime?: boolean | null;
} | null;

/** http(s) page URL, or null. Userinfo is stripped so credentials are not forwarded. */
export function feedbackPageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2000) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  url.username = "";
  url.password = "";
  return url.toString();
}

/** Billing plan label. Lifetime wins over the stored tier. Missing profile is "unknown". */
export function feedbackPlan(profile: FeedbackPlanProfile): string {
  if (!profile) return "unknown";
  if (profile.is_lifetime) return "lifetime";
  const tier = typeof profile.subscription_tier === "string" ? profile.subscription_tier.trim() : "";
  return tier || "free";
}

/**
 * POST the payload after the response. Skipped unless both webhook env vars
 * are set. Failures are logged without the URL, the key, or the error text
 * (fetch errors can echo the URL) and never thrown.
 */
export function scheduleFeedbackWebhook(loadPayload: () => Promise<FeedbackWebhookPayload>): void {
  const url = process.env.FEEDBACK_WEBHOOK_URL?.trim() ?? "";
  const key = process.env.FEEDBACK_WEBHOOK_KEY?.trim() ?? "";
  if (!url || !key) return;

  const task = deliverFeedbackWebhook(url, key, loadPayload);
  try {
    waitUntil(task);
  } catch {
    void task;
  }
}

async function deliverFeedbackWebhook(
  url: string,
  key: string,
  loadPayload: () => Promise<FeedbackWebhookPayload>
): Promise<void> {
  try {
    const payload = await loadPayload();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: payload.message,
          page_url: payload.page_url,
          user_handle: payload.user_handle,
          user_id: payload.user_id,
          plan: payload.plan,
          created_at: payload.created_at,
          feedback_id: payload.feedback_id,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        console.error("[feedback-webhook] forward failed", { status: response.status });
      }
      await response.body?.cancel().catch(() => undefined);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    console.error("[feedback-webhook] forward failed");
  }
}
