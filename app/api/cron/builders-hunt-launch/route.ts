import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";
// Triggers the launch email blast (send-update) which itself loops the whole base.
export const maxDuration = 60;

const SENT_KEY = "bh_launch_email_sent";
const SITE = "https://huevsite.io";

// One-shot Builders Hunt launch email, fired by the Vercel cron (vercel.json).
// Auth mirrors the digest crons: Vercel cron bearer (CRON_SECRET) OR ?secret=ADMIN_SECRET
// for a manual trigger. A site_settings flag guards against ever sending twice
// (re-fire, next-year cron re-match, or accidental hit). ?force=1 overrides the guard.
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
    // if site_settings is unreachable, fall through (better to send than to silently skip)
  }

  const res = await fetch(`${SITE}/api/admin/send-update?secret=${encodeURIComponent(process.env.ADMIN_SECRET || "")}`);
  const result = await res.json().catch(() => ({}));

  try {
    await db.from("site_settings").upsert({ key: SENT_KEY, value: "sent" }, { onConflict: "key" });
  } catch {
    // non-fatal: the email already went out
  }

  return NextResponse.json({ ok: true, result });
}
