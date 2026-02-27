import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const q = searchParams.get("q") || "";
    const startIndex = page * limit;
    const endIndex = startIndex + limit - 1;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Query follows where follower_id is the user, and join with the followed profile
    let query = supabase
      .from("follows")
      .select(`
        following:profiles!following_id(
          id,
          username,
          name,
          image,
          accent_color
        )
      `, { count: "exact" })
      .eq("follower_id", userId);

    if (q) {
      query = query.or(`username.ilike.%${q}%,name.ilike.%${q}%`, { foreignTable: "profiles" });
    }

    const { data: follows, error, count } = await query
      .order("created_at", { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error("Error fetching following:", error);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    // `follows` should typically type output following as a single object or array depending on relation,
    // assuming it returns the relation explicitly
    const following = (follows || [])
      .map(f => (f as any).following)
      .filter(Boolean);

    return NextResponse.json({ 
      following, 
      hasMore: (startIndex + limit) < (count || 0) 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in following API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
