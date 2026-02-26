import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "24", 10);
    const sort = searchParams.get("sort") || "created_at"; // 'created_at' | 'updated_at'
    const q = searchParams.get("q") || "";

    const startIndex = page * limit;
    const endIndex = startIndex + limit - 1;

    const supabase = await createClient();

    // Use the view that has pre-calculated counts
    let query = supabase
      .from("profiles_explore")
      .select("*", { count: "exact" });

    if (q) {
      // Basic text search over username or name
      query = query.or(`username.ilike.%${q}%,name.ilike.%${q}%`);
    }

    // We might need the user object for certain filters
    const { data: { user } } = await supabase.auth.getUser();

    // Sort mapping
    let sortField = "created_at";
    let isCategorySort = false;
    let isFollowingFilter = false;
    let isFollowersMeFilter = false;

    if (sort === 'following') {
      isFollowingFilter = true;
    } else if (sort === 'followers_me') {
      isFollowersMeFilter = true;
    } else if (sort === 'category') {
      isCategorySort = true;
    } else {
      sortField = {
        'created_at': 'created_at',
        'updated_at': 'updated_at',
        'followers': 'followers_count',
        'nominations': 'nominations_count',
        'endorsements': 'endorsements_count'
      }[sort] || 'created_at';
    }

    if (isFollowingFilter) {
      if (!user) {
        return NextResponse.json({ error: "Debes estar logueado para ver a quién seguís." }, { status: 401 });
      }
      
      // Fetch who the user follows
      const { data: followsData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
        
      const followingIds = (followsData || []).map(f => f.following_id);
      
      if (followingIds.length === 0) {
        return NextResponse.json({ profiles: [], count: 0, hasMore: false }, { status: 200 });
      }
      
      query = query.in("id", followingIds);
      query = query.order("pro_since", { ascending: false, nullsFirst: false });
      query = query.order("created_at", { ascending: false });
    } else if (isFollowersMeFilter) {
      if (!user) {
        return NextResponse.json({ error: "Debes estar logueado para ver quién te sigue." }, { status: 401 });
      }
      
      // Fetch who follows the user
      const { data: followersData } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id);
        
      const followerIds = (followersData || []).map(f => f.follower_id);
      
      if (followerIds.length === 0) {
        return NextResponse.json({ profiles: [], count: 0, hasMore: false }, { status: 200 });
      }
      
      query = query.in("id", followerIds);
      query = query.order("is_winner", { ascending: false, nullsFirst: false });
      query = query.order("pro_since", { ascending: false, nullsFirst: false });
      query = query.order("created_at", { ascending: false });
    } else if (isCategorySort) {
      // Sort by Winner > PRO > Free
      query = query.order("is_winner", { ascending: false, nullsFirst: false });
      query = query.order("pro_since", { ascending: false, nullsFirst: false });
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("is_winner", { ascending: false, nullsFirst: false });
      query = query.order("pro_since", { ascending: false, nullsFirst: false });
      query = query.order(sortField, { ascending: false });
    }

    query = query.range(startIndex, endIndex);

    const { data: profiles, error, count } = await query;

    if (error) {
      console.error("Explore API DB error:", error);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ profiles, count, hasMore: (startIndex + limit) < (count || 0) }, { status: 200 });
  } catch (error) {
    console.error("Explore API error:", error);
    return NextResponse.json({ error: "Interal Server Error" }, { status: 500 });
  }
}
