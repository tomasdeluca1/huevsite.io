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

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'non-pro' or null
    const preview = searchParams.get('preview') === 'true';

    // Fetch top candidates (let the Twitter service decide how many fit)
    let query = supabase
      .from('profiles')
      .select('username, builder_score, subscription_tier')
      .order('builder_score', { ascending: false })
      .limit(30);

    if (filter === 'non-pro') {
      query = query.eq('subscription_tier', 'free');
    }

    const { data: topProfiles, error: fetchError } = await query;

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

    const title = filter === 'non-pro' ? '🔥 TOP BUILDERS (Non Pro Only)' : '🔥 TOP BUILDERS';
    const result = await postLeaderboard(leaderboardData, preview, title);

    return NextResponse.json({ 
      success: true, 
      preview: preview ? result : null 
    });
  } catch (error: any) {
    console.error("Leaderboard Twitter post error:", error);
    return NextResponse.json({ error: error.message || "Failed to post leaderboard" }, { status: 500 });
  }
}
