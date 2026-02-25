import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Query follows where following_id is the user, and join with the follower's profile
    const { data: follows, error } = await supabase
      .from("follows")
      .select(`
        follower:profiles!follower_id(
          id,
          username,
          name,
          image,
          accent_color
        )
      `)
      .eq("following_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching followers:", error);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    const followers = (follows || [])
      .map(f => f.follower)
      .filter(Boolean);

    return NextResponse.json({ followers }, { status: 200 });
  } catch (error) {
    console.error("Error in followers API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
