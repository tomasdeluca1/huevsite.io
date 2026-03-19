import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/social/feed — actividad reciente de usuarios seguidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "global"; // "global" | "following" | "launches"
    const audience = searchParams.get("audience") || "all"; // "all" | "following"
    const type = searchParams.get("type"); // filter by activity type
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const needsFollowingScope = tab === "following" || audience === "following";

    if (authError || !user) {
      if (needsFollowingScope) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
    }

    if (tab === "launches") {
      let followingIds: string[] = [];

      if (audience === "following" && user) {
        const { data: followsData, error: followsError } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        if (followsError) {
          return NextResponse.json({ error: followsError.message }, { status: 500 });
        }

        followingIds = (followsData || []).map((follow) => follow.following_id);

        if (followingIds.length === 0) {
          return NextResponse.json({
            launches: [],
            count: 0,
            page,
            limit,
            totalPages: 0,
          });
        }
      }

      let launchesQuery = supabase
        .from("blocks")
        .select("id, user_id, sub_site_id, data, created_at", { count: "exact" })
        .eq("type", "project")
        .order("created_at", { ascending: false });

      if (audience === "following" && followingIds.length > 0) {
        launchesQuery = launchesQuery.in("user_id", followingIds);
      }

      const { data: launchBlocks, error: launchesError, count } = await launchesQuery.range(offset, offset + limit - 1);

      if (launchesError) {
        return NextResponse.json({ error: launchesError.message }, { status: 500 });
      }

      const userIds = Array.from(new Set((launchBlocks || []).map((block: any) => block.user_id).filter(Boolean)));
      const subSiteIds = Array.from(new Set((launchBlocks || []).map((block: any) => block.sub_site_id).filter(Boolean)));

      const [{ data: profiles }, { data: subSites }] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, username, name, image, accent_color, subscription_tier, pro_since")
              .in("id", userIds)
          : Promise.resolve({ data: [] as any[] }),
        subSiteIds.length > 0
          ? supabase
              .from("sub_sites")
              .select("id, slug, title, avatar_url")
              .in("id", subSiteIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const profilesById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      const subSitesById = new Map((subSites || []).map((site: any) => [site.id, site]));

      const normalizedLaunches = (launchBlocks || [])
        .map((launch: any) => {
          const profile = profilesById.get(launch.user_id);
          if (!profile) return null;

          const subSite = launch.sub_site_id ? subSitesById.get(launch.sub_site_id) : null;

          return {
            id: launch.id,
            created_at: launch.created_at,
            title: launch.data?.title || "Proyecto sin título",
            description: launch.data?.description || "",
            imageUrl: launch.data?.imageUrl || "",
            link: launch.data?.link || "",
            metrics: launch.data?.metrics || "",
            stack: launch.data?.stack || [],
            user: profile,
            subSite: subSite
              ? {
                  ...subSite,
                  avatarUrl: subSite.avatar_url || "",
                }
              : null,
          };
        })
        .filter(Boolean);

      return NextResponse.json({
        launches: normalizedLaunches,
        count: count ?? normalizedLaunches.length,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      });
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
