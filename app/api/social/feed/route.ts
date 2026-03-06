import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/social/feed — actividad reciente de usuarios seguidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "global"; // "global" | "following"
    const type = searchParams.get("type"); // filter by activity type
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

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
          accent_color,
          subscription_tier,
          pro_since
        )
      `, { count: "exact" });

    // Type filtering
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    if (tab === "following" && user) {
      // Fetch who the user follows
      const { data: followsData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = (followsData || []).map(f => f.following_id);

      if (followingIds.length === 0) {
        return NextResponse.json({ activities: [], count: 0 });
      }

      query = query.in("user_id", followingIds);
    } else {
      // Global feed: Exclude nominations and minor profile updates if not explicitly filtered to avoid noise
      if (!type || type === "all") {
        query = query.not("type", "in", '("new_nomination","profile_update")');
      }
    }

    const { data: activities, error: activitiesError, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (activitiesError) {
      return NextResponse.json({ error: activitiesError.message }, { status: 500 });
    }

    return NextResponse.json({
      activities: activities ?? [],
      count: count ?? 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
