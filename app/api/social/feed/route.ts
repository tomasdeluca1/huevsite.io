import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/social/feed — actividad reciente de usuarios seguidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "global"; // "global" | "following"

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      if (tab === "following") {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
    }

    let query = supabase
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
      `);

    if (tab === "following" && user) {
      // Fetch who the user follows
      const { data: followsData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
        
      const followingIds = (followsData || []).map(f => f.following_id);
      
      if (followingIds.length === 0) {
        return NextResponse.json({ activities: [] });
      }
      
      query = query.in("user_id", followingIds);
    } else {
      // Global feed: Exclude nominations to avoid noise
      query = query.neq("type", "new_nomination");
    }

    const { data: activities, error: activitiesError } = await query
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
