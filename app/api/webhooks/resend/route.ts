import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { recordEmailSuppression } from "@/lib/email-suppression";
import { suppressionFromResendEvent, verifyResendWebhook } from "@/lib/resend-webhook";

export const dynamic = "force-dynamic";

// POST /api/webhooks/resend
// Resend bounce and complaint events. Verifies the Svix signature with
// RESEND_WEBHOOK_SECRET and marks the recipient so later mass sends skip them.
// Does not send email. Other event types are acknowledged and ignored.
export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const ok = verifyResendWebhook(
    rawBody,
    {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature"),
    },
    secret
  );
  if (!ok) {
    console.error("[resend-webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = suppressionFromResendEvent(payload);
  if (!event) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const supabase = createServiceRoleClient();
    await recordEmailSuppression(supabase, event.email, event.reason);
  } catch (err) {
    console.error("[resend-webhook] could not record suppression:", err);
    return NextResponse.json({ error: "Could not record suppression" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reason: event.reason });
}
