import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/social/feed — actividad reciente de usuarios seguidos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener IDs de usuarios que sigo
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (followsError) {
      return NextResponse.json({ error: followsError.message }, { status: 500 });
    }

    const followingIds = follows?.map((f) => f.following_id) ?? [];

    if (followingIds.length === 0) {
      return NextResponse.json({ activities: [] });
    }

    // Obtener actividad reciente de esos usuarios
    const { data: activities, error: activitiesError } = await supabase
      .from("activities")
      .select(`
        id,
        type,
        data,
        created_at,
        user:profiles!activities_user_id_fkey (
          id,
          username,
          name,
          image,
          accent_color
        )
      `)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (activitiesError) {
      return NextResponse.json({ error: activitiesError.message }, { status: 500 });
    }

    return NextResponse.json({ activities: activities ?? [] });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
