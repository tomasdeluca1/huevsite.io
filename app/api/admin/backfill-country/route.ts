import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { guessCountryFromLocation } from "@/lib/countries";

export const dynamic = "force-dynamic";

// POST /api/admin/backfill-country?secret=ADMIN_SECRET&dryRun=true&limit=1000
// Best-effort: derive `profiles.country` (ISO-2) for profiles without one, from
// their free-text location. Location lives mostly in the main hero block
// (`data.location`), with `profiles.location` as a secondary source. Idempotent;
// safe to re-run. Requires the 20260618000000_profile_country migration.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = searchParams.get("dryRun") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "1000", 10) || 1000, 5000);

  const supabase = createServiceRoleClient();

  // Profiles without a country yet. If the column doesn't exist (migration not
  // applied), surface a clear error instead of crashing.
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, location, country")
    .is("country", null)
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: "DB error — is the country column migrated?", detail: error.message },
      { status: 500 }
    );
  }

  const ids = (profiles || []).map((p) => p.id);

  // Pull main hero blocks (sub_site_id null) to read data.location.
  const heroLoc: Record<string, string> = {};
  if (ids.length) {
    const { data: heroes } = await supabase
      .from("blocks")
      .select("user_id, data")
      .eq("type", "hero")
      .is("sub_site_id", null)
      .in("user_id", ids);
    for (const h of heroes || []) {
      const loc = (h as any)?.data?.location;
      if (loc && typeof loc === "string" && loc.trim()) heroLoc[(h as any).user_id] = loc.trim();
    }
  }

  const matched: Array<{ username: string; location: string; country: string }> = [];
  const unmatched: Array<{ username: string; location: string }> = [];

  for (const p of profiles || []) {
    const loc = ((p.location || "").trim() || heroLoc[p.id] || "").trim();
    if (!loc) continue;
    const code = guessCountryFromLocation(loc);
    if (code) matched.push({ username: p.username, location: loc, country: code });
    else unmatched.push({ username: p.username, location: loc });
  }

  let updated = 0;
  if (!dryRun) {
    for (const m of matched) {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ country: m.country })
        .eq("username", m.username);
      if (!upErr) updated += 1;
    }
  }

  return NextResponse.json({
    dryRun,
    profilesWithoutCountry: profiles?.length || 0,
    withLocation: matched.length + unmatched.length,
    matchedCount: matched.length,
    unmatchedCount: unmatched.length,
    updated,
    matched: matched.slice(0, 100),
    unmatched: unmatched.slice(0, 50),
  });
}
