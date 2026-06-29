import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

// POST /api/admin/backfill-hero-profile?secret=ADMIN_SECRET&dryRun=true&limit=2000
//
// Fill profiles.name / tagline / image from the owner's HERO BLOCK for users who
// set those in their hero but never via the Edit Profile modal — so the columns
// stayed empty even though their profile looked complete (this is what kept the
// "Perfil completo" badge locked, e.g. tomaspozo's tagline). Going forward the
// block save syncs these automatically; this is the one-time backfill for
// existing users. NON-DESTRUCTIVE: only fills columns that are currently empty.
// Idempotent — safe to re-run. Run with dryRun=true first to preview.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = searchParams.get("dryRun") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "2000", 10) || 2000, 5000);

  const db = createServiceRoleClient();

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, username, name, tagline, image")
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: "DB error", detail: error.message }, { status: 500 });
  }

  const empty = (v: unknown) => !v || !String(v).trim();
  // Only users missing at least one of the three columns need work.
  const needy = (profiles || []).filter((p) => empty(p.name) || empty(p.tagline) || empty(p.image));
  const ids = needy.map((p) => p.id);

  const heroByUser: Record<string, any> = {};
  if (ids.length) {
    const { data: heroes } = await db
      .from("blocks")
      .select("user_id, data")
      .eq("type", "hero")
      .is("sub_site_id", null)
      .in("user_id", ids);
    for (const h of heroes || []) {
      if (!heroByUser[h.user_id]) heroByUser[h.user_id] = h.data || {};
    }
  }

  let updated = 0;
  const samples: any[] = [];
  for (const p of needy) {
    const hero = heroByUser[p.id];
    if (!hero) continue;
    const update: Record<string, string> = {};
    if (empty(p.name) && typeof hero.name === "string" && hero.name.trim()) update.name = hero.name.trim();
    if (empty(p.tagline) && typeof hero.tagline === "string" && hero.tagline.trim()) update.tagline = hero.tagline.trim();
    if (empty(p.image) && typeof hero.avatarUrl === "string" && hero.avatarUrl.trim()) update.image = hero.avatarUrl.trim();
    if (Object.keys(update).length === 0) continue;

    if (samples.length < 20) samples.push({ username: p.username, ...update });
    if (!dryRun) {
      await db.from("profiles").update(update).eq("id", p.id);
    }
    updated++;
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    totalProfiles: profiles?.length || 0,
    missingSomeColumn: needy.length,
    updated,
    samples,
  });
}
