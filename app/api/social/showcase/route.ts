import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// GET /api/social/showcase — obtener winner y finalistas de la semana actual
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week") || getCurrentWeek();

  try {
    const supabase = await createClient();

    // Winner de la semana
    const { data: winner } = await supabase
      .from("showcase_winners")
      .select(`
        week,
        user:profiles!showcase_winners_user_id_fkey (
          id, username, name, image, accent_color, tagline
        )
      `)
      .eq("week", week)
      .maybeSingle();

    // Top 5 nominados (excl. winner si existe)
    const { data: nominations } = await supabase
      .from("showcase_nominations")
      .select(`
        user_id,
        user:profiles!showcase_nominations_user_id_fkey (
          id, username, name, image, accent_color
        )
      `)
      .eq("week", week);

    // Contar nominaciones por usuario
    const counts = (nominations ?? []).reduce<Record<string, { count: number; user: unknown }>>((acc, n: any) => {
      if (!acc[n.user_id]) acc[n.user_id] = { count: 0, user: n.user };
      acc[n.user_id].count++;
      return acc;
    }, {});

    const finalists = Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([userId, data]) => ({ userId, count: data.count, user: data.user }));

    return NextResponse.json({ week, winner: winner ?? null, finalists });
  } catch (error) {
    console.error("Showcase GET error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
