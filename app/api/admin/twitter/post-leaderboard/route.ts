import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postLeaderboard } from "@/lib/twitter";
import { resolveXHandles } from "@/lib/twitter-utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profile?.username !== 'huevsite') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch top candidates (let the Twitter service decide how many fit)
    const { data: topProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('username, builder_score')
      .order('builder_score', { ascending: false })
      .limit(20);

    if (fetchError) throw fetchError;

    if (!topProfiles || topProfiles.length === 0) {
      return NextResponse.json({ error: "No profiles found" }, { status: 404 });
    }

    const usernames = topProfiles.map(p => p.username);
    const mentionsMap = await resolveXHandles(usernames);

    const leaderboardData = topProfiles.map(p => ({
      mention: mentionsMap[p.username] || `@${p.username}`,
      score: p.builder_score || 0
    }));

    await postLeaderboard(leaderboardData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Leaderboard Twitter post error:", error);
    return NextResponse.json({ error: error.message || "Failed to post leaderboard" }, { status: 500 });
  }
}
