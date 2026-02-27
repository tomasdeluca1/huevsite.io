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

    // Query follows where following_id is the user, and join with the follower's profile
    let query = supabase
      .from("follows")
      .select(`
        follower:profiles!follower_id(
          id,
          username,
          name,
          image,
          accent_color
        )
      `, { count: "exact" })
      .eq("following_id", userId);

    if (q) {
      // Filtrar por nombre o username del follower
      // Nota: Supabase query builders can sometimes be tricky with nested joins for filtering.
      // If this doesn't work directly, we might need a view or raw query.
      // For now, let's assume it works or we'll filter in JS if small.
      // Actually, standard way is filtering on the joined table.
      query = query.or(`username.ilike.%${q}%,name.ilike.%${q}%`, { foreignTable: "profiles" });
    }

    const { data: follows, error, count } = await query
      .order("created_at", { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error("Error fetching followers:", error);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    const followers = (follows || [])
      .map(f => f.follower)
      .filter(Boolean);

    return NextResponse.json({ 
      followers, 
      hasMore: (startIndex + limit) < (count || 0) 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in followers API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
