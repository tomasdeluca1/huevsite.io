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
    const filter = searchParams.get('filter'); // 'non-pro', 'twitter-only', or null
    const preview = searchParams.get('preview') === 'true';

    // Fetch top candidates (let the Twitter service decide how many fit)
    let query = supabase
      .from('profiles')
      .select('username, builder_score, subscription_tier')
      .order('builder_score', { ascending: false })
      .limit(filter === 'twitter-only' ? 100 : 30);

    if (filter === 'non-pro') {
      query = query.eq('subscription_tier', 'free');
    }

    const { data: topProfiles, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!topProfiles || topProfiles.length === 0) {
      return NextResponse.json({ error: "No profiles found" }, { status: 404 });
    }

    let filteredProfiles = topProfiles;

    // For twitter-only: keep only profiles that have a twitter link in their social blocks
    if (filter === 'twitter-only') {
      const usernames = topProfiles.map(p => p.username);
      const { data: socialBlocks } = await supabase
        .from('blocks')
        .select('user_id, data, profiles!inner(username)')
        .eq('type', 'social')
        .in('profiles.username', usernames);

      const usernamesWithTwitter = new Set<string>();
      for (const block of socialBlocks || []) {
        const links = block.data?.links || [];
        const hasTwitter = links.some((l: any) => l.platform === 'twitter' && (l.url || l.handle));
        if (hasTwitter) {
          usernamesWithTwitter.add((block as any).profiles?.username);
        }
      }

      filteredProfiles = topProfiles.filter(p => usernamesWithTwitter.has(p.username)).slice(0, 30);
    }

    if (filteredProfiles.length === 0) {
      return NextResponse.json({ error: "No profiles found with that filter" }, { status: 404 });
    }

    const usernames = filteredProfiles.map(p => p.username);
    const mentionsMap = await resolveXHandles(usernames);

    const leaderboardData = filteredProfiles.map(p => ({
      mention: mentionsMap[p.username] || `@${p.username}`,
      score: p.builder_score || 0
    }));

    const title = filter === 'non-pro'
      ? '🔥 TOP BUILDERS (Non Pro Only)'
      : filter === 'twitter-only'
        ? '🔥 TOP BUILDERS (Twitter Connected)'
        : '🔥 TOP BUILDERS';
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
