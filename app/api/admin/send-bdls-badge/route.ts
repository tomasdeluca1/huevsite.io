import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { BadgeAwardEmail } from "@/components/emails/BadgeAwardEmail";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { listAllAuthUsers } from "@/lib/list-auth-users";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/admin/send-bdls-badge?secret=ADMIN_SECRET[&dryRun=true][&test_email=x@y.com]
// One-time: email every past Builder de la Semana winner their embeddable laurel
// badge so they can add it to their portfolio. Future winners get it via the
// winner email. Low volume (a handful of winners). Run dryRun first.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = searchParams.get("dryRun") === "true";
  const testEmail = searchParams.get("test_email");
  const from = process.env.EMAIL_FROM || "hi@huevsite.studio";
  const subject = "🏆 Tu badge de Builder de la Semana — para tu portfolio";

  const db = createServiceRoleClient();

  const { data: winnerRows, error } = await db
    .from("showcase_winners")
    .select("user_id, profiles:profiles!showcase_winners_user_id_fkey(username, name)");
  if (error) {
    return NextResponse.json({ error: "DB error", detail: error.message }, { status: 500 });
  }

  const seen = new Set<string>();
  const winners: { id: string; username: string; name: string }[] = [];
  for (const r of winnerRows || []) {
    const p = (r as any).profiles;
    if (!r.user_id || seen.has(r.user_id) || !p?.username) continue;
    seen.add(r.user_id);
    winners.push({ id: r.user_id, username: p.username, name: p.name || p.username });
  }

  // map user_id → auth email
  const authUsers = await listAllAuthUsers(db);
  const emailById = new Map(
    authUsers.filter((u: any) => u.email).map((u: any) => [u.id, u.email as string])
  );

  if (testEmail) {
    const w = winners[0] || { name: "builder", username: "tomaspozo" };
    const html = await render(React.createElement(BadgeAwardEmail, { name: w.name, username: w.username }));
    await resend.emails.send({ from, to: testEmail, subject, html });
    return NextResponse.json({ test: true, sentTo: testEmail, sample: w });
  }

  let sent = 0;
  const skippedNoEmail: string[] = [];
  for (const w of winners) {
    const email = emailById.get(w.id);
    if (!email) {
      skippedNoEmail.push(w.username);
      continue;
    }
    if (!dryRun) {
      const html = await render(React.createElement(BadgeAwardEmail, { name: w.name, username: w.username }));
      await resend.emails.send({ from, to: email, subject, html });
      await new Promise((r) => setTimeout(r, 200)); // gentle pace
    }
    sent++;
  }

  return NextResponse.json({ ok: true, dryRun, totalWinners: winners.length, sent, skippedNoEmail });
}
