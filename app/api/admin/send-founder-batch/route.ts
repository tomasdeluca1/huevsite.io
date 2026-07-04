import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { FounderBatchEmail } from "@/components/emails/FounderBatchEmail";
import { buildUnsubscribeUrl } from "@/lib/email-unsubscribe";
import { listAllAuthUsers } from "@/lib/list-auth-users";
import { getFounderSeats, FOUNDER_NEXT_PRICE } from "@/lib/founder-seats";

export const dynamic = "force-dynamic";
// Full-base send: ~240 eligible × (100ms throttle + Resend latency) ≈ 50s+,
// so 60s risked a mid-send kill. 300s is within both Hobby and Pro limits.
export const maxDuration = 300;

const resend = new Resend(process.env.RESEND_API_KEY);
const UNSUB_MARKER = "__UNSUB_URL__";

/**
 * GET /api/admin/send-founder-batch — one-time Founder scarcity campaign.
 *  - secret=<ADMIN_SECRET>  required
 *  - preview=1              render + count recipients + live seats, send nothing
 *  - test_email=<addr>      send only to this address
 *  - start_page=N           catch-up support (skip already-sent pages of 50)
 * "Quedan N" is computed LIVE from profiles.is_lifetime at send time, so the
 * scarcity claim in every email is true when it goes out. Excludes lifetime
 * buyers (they already own a seat) and unsubscribed users.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const preview = searchParams.get("preview") === "1";
    const testEmail = searchParams.get("test_email");
    const startPage = Math.max(1, parseInt(searchParams.get("start_page") || "1", 10) || 1);

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seats = await getFounderSeats();
    if (seats.remaining < 0) {
      return NextResponse.json({ error: "Could not compute live founder seats — refusing to send a scarcity claim blind." }, { status: 500 });
    }
    if (seats.remaining === 0) {
      return NextResponse.json({ error: "0 seats remaining — the batch is sold out, nothing to announce." }, { status: 400 });
    }

    const htmlTemplate = await render(
      React.createElement(FounderBatchEmail, {
        remaining: seats.remaining,
        cap: seats.cap,
        nextPrice: FOUNDER_NEXT_PRICE,
        unsubscribeUrl: UNSUB_MARKER,
      })
    );

    const subject = `🥚 Quedan ${seats.remaining} lugares Founder a $79 (después ${FOUNDER_NEXT_PRICE})`;
    const from = process.env.EMAIL_FROM || "hi@huevsite.studio";

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, community_digest_unsubscribed, is_lifetime")
      .not("username", "is", null);
    const profMap = new Map((profs || []).map((p) => [p.id, p]));

    const isEligible = (u: { id: string; email?: string | null }) => {
      const p = profMap.get(u.id);
      // Skip lifetime buyers: they already own a Founder seat.
      return !!u.email && !!p && !p.community_digest_unsubscribed && !p.is_lifetime;
    };

    if (preview) {
      const authUsers = await listAllAuthUsers(supabase, startPage);
      const eligible = authUsers.filter(isEligible);
      return NextResponse.json({
        preview: true,
        startPage,
        seats,
        authUsers: authUsers.length,
        eligibleRecipients: eligible.length,
        subject,
      });
    }

    if (testEmail) {
      const html = htmlTemplate.replaceAll(UNSUB_MARKER, buildUnsubscribeUrl("test"));
      await resend.emails.send({ from, to: testEmail, subject, html });
      return NextResponse.json({ success: true, test: true, sentTo: testEmail, seats });
    }

    const authUsers = await listAllAuthUsers(supabase, startPage);

    let emailsSent = 0;
    const errors: string[] = [];
    for (const u of authUsers) {
      if (!isEligible(u)) continue;
      const html = htmlTemplate.replaceAll(UNSUB_MARKER, buildUnsubscribeUrl(u.id));
      try {
        await resend.emails.send({ from, to: u.email!, subject, html });
        emailsSent++;
        await new Promise((r) => setTimeout(r, 100));
      } catch (err: any) {
        errors.push(`${u.email}: ${err?.message}`);
      }
    }

    return NextResponse.json({ success: true, emailsSent, seats, errors });
  } catch (error: any) {
    console.error("[send-founder-batch] error:", error);
    return NextResponse.json({ error: error?.message || "Algo salió mal." }, { status: 500 });
  }
}
