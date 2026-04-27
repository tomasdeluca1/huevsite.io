import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import {
  processWinnerForWeek,
  regenerateJointCarouselForWeek,
} from "@/lib/bdls-content-pipeline";

export const dynamic = "force-dynamic";

// POST /api/admin/auto-bdls-from-profile
//
// Manual fallback that mirrors what the Monday cron now does
// automatically: crown a builder for a given ISO week and produce a
// draft blog post + builder_interviews row + Typefully drafts + winner
// email, all without making the builder fill the interview form.
//
// The actual pipeline lives in `lib/bdls-content-pipeline.ts` and is
// shared with /api/admin/pick-winner.
//
// Query params
//   username           (required) — huevsite username of the builder
//   week               (required) — ISO week, e.g. "2026-W17"
//   email              (optional) — "0" to skip the winner email
//   regenerate         (optional) — "1" to overwrite an existing draft
//   force_synthesize   (optional) — "1" to skip findReusableInterview
//                                   even if a recent form exists
export async function POST(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const week = searchParams.get("week");
  const sendEmail = searchParams.get("email") !== "0";
  const regenerate = searchParams.get("regenerate") === "1";
  const forceSynthesize = searchParams.get("force_synthesize") === "1";

  if (!username || !week) {
    return NextResponse.json(
      { error: "Faltan ?username= y ?week= (ej: ?username=galfrevn&week=2026-W17)" },
      { status: 400 }
    );
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, name, tagline, location, github_handle, image")
    .eq("username", username)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json({ error: `Perfil ${username} no encontrado` }, { status: 404 });
  }

  let result;
  try {
    result = await processWinnerForWeek(supabase, {
      profile,
      week,
      sendEmail,
      regenerate,
      forceSynthesize,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Pipeline failed" },
      { status: 500 }
    );
  }

  // If this brought the week up to 2+ winners (or it was already
  // multi-winner and we just added/regenerated content for one of
  // them), refresh the joint carousel prompt across all of them.
  const { count } = await supabase
    .from("showcase_winners")
    .select("*", { count: "exact", head: true })
    .eq("week", week);
  let jointUpdated: number | null = null;
  if ((count ?? 0) >= 2) {
    try {
      const r = await regenerateJointCarouselForWeek(supabase, week);
      jointUpdated = r?.updated ?? null;
    } catch (e) {
      console.error("Joint carousel regen error (non-fatal):", e);
    }
  }

  return NextResponse.json({
    success: true,
    week,
    ...result,
    jointCarouselUpdatedRows: jointUpdated,
  });
}
