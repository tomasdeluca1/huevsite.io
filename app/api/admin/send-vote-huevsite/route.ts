import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { VoteHuevsiteEmail } from "@/components/emails/VoteHuevsiteEmail";
import { buildUnsubscribeUrl } from "@/lib/email-unsubscribe";
import { listAllAuthUsers } from "@/lib/list-auth-users";

export const dynamic = "force-dynamic";
// Full-base send (~240 eligible × 100ms throttle + Resend latency) ≈ 60s+.
export const maxDuration = 300;

const resend = new Resend(process.env.RESEND_API_KEY);
const UNSUB_MARKER = "__UNSUB_URL__";

// The huevsite launch on Builders Hunt, week 2026-W27. Deep link scrolls to the
// card and highlights it; UTM so umami attributes the campaign.
const LAUNCH_URL =
  "https://huevsite.io/feed?launch=c2065d59-2314-479e-85e2-6df7a6502cd8&week=2026-W27" +
  "&utm_source=email&utm_medium=email&utm_campaign=vote-huevsite";

/**
 * GET /api/admin/send-vote-huevsite — one-shot "vote huevsite on Builders Hunt"
 * campaign (week closes Sunday 2026-07-05).
 *  - secret=<ADMIN_SECRET>  required
 *  - preview=1              render + count recipients, send nothing
 *  - test_email=<addr>      send only to this address
 *  - start_page=N           catch-up support (skip already-sent pages of 50)
 * Excludes unsubscribed users. Unlike the founder batch, lifetime buyers ARE
 * included — everyone can vote.
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

    const htmlTemplate = await render(
      React.createElement(VoteHuevsiteEmail, {
        launchUrl: LAUNCH_URL,
        unsubscribeUrl: UNSUB_MARKER,
      })
    );

    const subject = "🚀 Lancé huevsite en Builders Hunt. ¿Me das tu voto?";
    const from = process.env.EMAIL_FROM || "hi@huevsite.studio";

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, community_digest_unsubscribed")
      .not("username", "is", null);
    const profMap = new Map((profs || []).map((p) => [p.id, p]));

    const isEligible = (u: { id: string; email?: string | null }) => {
      const p = profMap.get(u.id);
      return !!u.email && !!p && !p.community_digest_unsubscribed;
    };

    if (preview) {
      const authUsers = await listAllAuthUsers(supabase, startPage);
      const eligible = authUsers.filter(isEligible);
      return NextResponse.json({
        preview: true,
        startPage,
        authUsers: authUsers.length,
        eligibleRecipients: eligible.length,
        subject,
        launchUrl: LAUNCH_URL,
      });
    }

    if (testEmail) {
      const html = htmlTemplate.replaceAll(UNSUB_MARKER, buildUnsubscribeUrl("test"));
      await resend.emails.send({ from, to: testEmail, subject, html });
      return NextResponse.json({ success: true, test: true, sentTo: testEmail });
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

    return NextResponse.json({ success: true, emailsSent, errors });
  } catch (error: any) {
    console.error("[send-vote-huevsite] error:", error);
    return NextResponse.json({ error: error?.message || "Algo salió mal." }, { status: 500 });
  }
}
