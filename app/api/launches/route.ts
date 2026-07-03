import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { currentLaunchWeek, compareWeeks } from "@/lib/launch-week";
import { getWeekLaunches, createLaunch } from "@/lib/launch-service";

export const dynamic = "force-dynamic";

// GET /api/launches?week=YYYY-Wxx — ranked launches for a week (never future).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let week = searchParams.get("week") || currentLaunchWeek();
  if (compareWeeks(week, currentLaunchWeek()) > 0) week = currentLaunchWeek();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { launches, votedIds } = await getWeekLaunches(week, user?.id || null);
    return NextResponse.json({ week, launches, votedIds });
  } catch (e) {
    console.error("[launches] feed error:", e);
    return NextResponse.json({ week, launches: [], votedIds: [] });
  }
}

// POST /api/launches  { blockId, week? } — launch a project into a week.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { blockId?: string; week?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.blockId) return NextResponse.json({ error: "missing_block" }, { status: 400 });

  const db = createServiceRoleClient();
  const { data: prof } = await db
    .from("profiles")
    .select("subscription_tier, pro_since")
    .eq("id", user.id)
    .single();
  const isPro = prof?.subscription_tier === "pro" || !!prof?.pro_since;

  const cur = currentLaunchWeek();
  const week = body.week || cur;
  const cmp = compareWeeks(week, cur);
  if (cmp < 0) return NextResponse.json({ error: "past_week" }, { status: 400 });
  if (cmp > 0 && !isPro) {
    return NextResponse.json({ error: "pro_required_to_schedule" }, { status: 403 });
  }

  try {
    const result = await createLaunch(body.blockId, user.id, week, isPro);
    if (!result.ok) {
      const status =
        result.error === "already_launched"
          ? 409
          : result.error === "not_owner" || result.error === "monthly_limit"
            ? 403
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, launchId: result.launchId, week });
  } catch (e) {
    console.error("[launches] create error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
