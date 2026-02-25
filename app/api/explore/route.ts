import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
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

    // Sort mapping
    const sortField = {
      'created_at': 'created_at',
      'updated_at': 'updated_at',
      'followers': 'followers_count',
      'nominations': 'nominations_count',
      'endorsements': 'endorsements_count'
    }[sort] || 'created_at';

    // Pro users are prioritized visually
    query = query.order("pro_since", { ascending: false, nullsFirst: false });
    query = query.order(sortField, { ascending: false });

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
