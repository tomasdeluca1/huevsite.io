import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getCommunityWall } from "@/lib/community-wall";

export const dynamic = "force-dynamic";

export type ProfilePulse = {
  /** Visitas al perfil hoy y en los últimos 7 días (solo el número; el detalle es Pro). */
  viewsToday: number;
  viewsWeek: number;
  /** Qué número de builder sos, por orden de llegada. */
  builderNumber: number | null;
  /** Tu lugar en el muro de la home (null si no tenés foto y no aparecés). */
  wall: { rank: number; total: number } | null;
};

const LOCAL = '("127.0.0.1","::1","localhost")';

// El "pulso" del dashboard: lo que pasa con tu perfil, en números chicos y reales.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createServiceRoleClient();
  const now = Date.now();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const views = (since: Date) =>
    admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "page_view")
      .not("visitor_id", "in", LOCAL)
      .gte("created_at", since.toISOString());

  const { data: me } = await admin.from("profiles").select("username, created_at").eq("id", user.id).maybeSingle();

  const [today, week, before, wall] = await Promise.all([
    views(dayStart),
    views(weekStart),
    me?.created_at
      ? admin.from("profiles").select("id", { count: "exact", head: true }).not("username", "is", null).lte("created_at", me.created_at)
      : Promise.resolve({ count: null }),
    getCommunityWall(),
  ]);

  const index = me?.username ? wall.builders.findIndex((b) => b.username === me.username) : -1;

  const body: ProfilePulse = {
    viewsToday: today.count ?? 0,
    viewsWeek: week.count ?? 0,
    builderNumber: before.count ?? null,
    wall: index >= 0 ? { rank: index + 1, total: wall.builders.length } : null,
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, max-age=60" } });
}
