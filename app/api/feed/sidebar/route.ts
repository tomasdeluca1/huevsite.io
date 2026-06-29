import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getActiveBuildersThisWeek } from "@/lib/showcase-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Consolidated data for the discovery right rail. Each widget is independently
// guarded so a single failure never breaks the rail (or the page hosting it).
export async function GET() {
  const db = createServiceRoleClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let winner: { username: string; name: string; image: string | null } | null = null;
  try {
    const { data } = await db
      .from("showcase_winners")
      .select("week, user:profiles!showcase_winners_user_id_fkey ( username, name, image )")
      .order("week", { ascending: false })
      .limit(1)
      .maybeSingle();
    const u = (data as any)?.user;
    if (u?.username) winner = { username: u.username, name: u.name || u.username, image: u.image || null };
  } catch (e) {
    console.error("[feed/sidebar] winner:", e);
  }

  let topBuilders: { username: string; name: string; image: string | null; score: number }[] = [];
  try {
    const { data } = await db
      .from("profiles")
      .select("username, name, image, builder_score")
      .not("username", "is", null)
      .order("builder_score", { ascending: false })
      .limit(5);
    topBuilders = (data || [])
      .filter((p: any) => p.username)
      .map((p: any) => ({
        username: p.username,
        name: p.name || p.username,
        image: p.image || null,
        score: p.builder_score || 0,
      }));
  } catch (e) {
    console.error("[feed/sidebar] topBuilders:", e);
  }

  const pulse = { activeThisWeek: 0, newProjects: 0, endorsements: 0 };
  try {
    const [active, projRes, endRes] = await Promise.all([
      getActiveBuildersThisWeek().catch(() => 0),
      db
        .from("blocks")
        .select("id", { count: "exact", head: true })
        .in("type", ["project", "building"])
        .gte("created_at", weekAgo),
      db.from("endorsements").select("id", { count: "exact", head: true }),
    ]);
    pulse.activeThisWeek = active || 0;
    pulse.newProjects = projRes.count || 0;
    pulse.endorsements = endRes.count || 0;
  } catch (e) {
    console.error("[feed/sidebar] pulse:", e);
  }

  return NextResponse.json({ winner, topBuilders, pulse });
}
