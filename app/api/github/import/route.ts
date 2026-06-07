import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubStats } from '@/lib/github-service'

export const dynamic = 'force-dynamic'

function getGitHubHandleFromUser(user: any) {
  const directCandidates = [
    user?.user_metadata?.user_name,
    user?.user_metadata?.preferred_username,
    user?.user_metadata?.userName,
    user?.app_metadata?.user_name,
    user?.app_metadata?.preferred_username,
  ].filter(Boolean);

  if (directCandidates.length > 0) {
    return directCandidates[0] as string;
  }

  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const githubIdentity = identities.find((identity: any) => identity?.provider === "github");
  const identityData = githubIdentity?.identity_data || {};

  return (
    identityData.user_name ||
    identityData.preferred_username ||
    identityData.userName ||
    identityData.login ||
    null
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const requestedUsername = request.nextUrl.searchParams.get("username")?.trim()
    const githubHandle = requestedUsername || getGitHubHandleFromUser(user)

    if (!githubHandle) {
      return NextResponse.json(
        { error: 'No se encontró handle de GitHub en la sesión.' },
        { status: 400 }
      )
    }

    const result = await fetchGitHubStats(githubHandle)

    if (!result) {
      return NextResponse.json(
        { error: 'No pudimos traer tu GitHub ahora. Reintentá en un momento.' },
        { status: 502 }
      )
    }

    const { stats, profile } = result

    // Return both the flat profile fields (existing consumers like onboarding)
    // AND the full normalized stats object (heatmap, commitsByMonth, etc.).
    return NextResponse.json({
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      name: profile.name,
      bio: profile.bio,
      followers: stats.followers,
      repos: stats.repos,
      topRepos: profile.topRepos,
      languages: profile.languages,
      stats,
    })
  } catch (error) {
    console.error('GitHub import error:', error)
    return NextResponse.json(
      { error: 'Algo falló al importar de GitHub. Reintentá.' },
      { status: 500 }
    )
  }
}
