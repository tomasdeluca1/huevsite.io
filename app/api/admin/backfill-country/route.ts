import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { guessCountryFromLocation } from "@/lib/countries";

export const dynamic = "force-dynamic";

// POST /api/admin/backfill-country?secret=ADMIN_SECRET&dryRun=true&limit=1000
// Best-effort: derive `profiles.country` (ISO-2) from the free-text `location`
// for profiles that don't have a country set yet. Idempotent; safe to re-run.
// Requires the 20260618000000_profile_country migration to be applied first.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = searchParams.get("dryRun") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "1000", 10) || 1000, 5000);

  const supabase = createServiceRoleClient();

  // Pull candidates: have a location, no country yet. If the column doesn't
  // exist (migration not applied), surface a clear error instead of crashing.
  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, username, location, country")
    .not("location", "is", null)
    .is("country", null)
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: "DB error — is the country column migrated?", detail: error.message },
      { status: 500 }
    );
  }

  const matched: Array<{ username: string; location: string; country: string }> = [];
  const unmatched: Array<{ username: string; location: string }> = [];

  for (const row of rows || []) {
    const loc = (row.location || "").trim();
    if (!loc) continue;
    const code = guessCountryFromLocation(loc);
    if (code) matched.push({ username: row.username, location: loc, country: code });
    else unmatched.push({ username: row.username, location: loc });
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
    candidates: rows?.length || 0,
    matchedCount: matched.length,
    unmatchedCount: unmatched.length,
    updated,
    matched: matched.slice(0, 100),
    unmatched: unmatched.slice(0, 50),
  });
}
