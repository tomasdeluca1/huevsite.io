import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";
// Waits on the full-base founder send (~240 emails ≈ 60s+), same budget as it.
export const maxDuration = 300;

const SENT_KEY = "founder_batch_email_sent";
const SITE = "https://huevsite.io";

// One-shot Founder batch scarcity email, fired by the Vercel cron (vercel.json,
// 2026-07-07 13:00 UTC = 10:00 ART). Auth mirrors builders-hunt-launch: Vercel
// cron bearer (CRON_SECRET) OR ?secret=ADMIN_SECRET for a manual trigger.
// Unlike builders-hunt-launch, the sent flag is set BEFORE firing: if this
// route dies mid-wait we prefer a manual ?force=1 retry over ever double
// blasting a scarcity claim to the whole base.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const secret = searchParams.get("secret");
  const isCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isAdminSecret = secret && secret === process.env.ADMIN_SECRET;
  if (!isCron && !isAdminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceRoleClient();

  try {
    const { data: existing } = await db
      .from("site_settings")
      .select("key")
      .eq("key", SENT_KEY)
      .maybeSingle();
    if (existing && searchParams.get("force") !== "1") {
      return NextResponse.json({ skipped: true, reason: "already_sent" });
    }
  } catch {
    // site_settings unreachable → refuse rather than risk an unguarded blast.
    return NextResponse.json(
      { error: "site_settings unreachable — refusing to send without a double-send guard" },
      { status: 500 }
    );
  }

  try {
    await db.from("site_settings").upsert({ key: SENT_KEY, value: "sent" }, { onConflict: "key" });
  } catch {
    return NextResponse.json(
      { error: "could not set the sent flag — refusing to send without a double-send guard" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `${SITE}/api/admin/send-founder-batch?secret=${encodeURIComponent(process.env.ADMIN_SECRET || "")}`
  );
  const result = await res.json().catch(() => ({}));

  return NextResponse.json({ ok: res.ok, result });
}
