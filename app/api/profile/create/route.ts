import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndPostCommunityMilestone } from '@/lib/twitter'

export const dynamic = 'force-dynamic'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

interface CreateProfileRequest {
  username: string
  name?: string
  tagline?: string
  accentColor: string
  layout: string
  roles: string[]
  location?: string
  githubHandle?: string
  referredBy?: string // Referral code
  githubData?: any
  blocks?: Array<{
    type: string
    order: number
    colSpan: number
    rowSpan: number
    data: any
    visible: boolean
  }>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body: CreateProfileRequest = await request.json()

    // Validaciones
    if (!body.username || !USERNAME_REGEX.test(body.username)) {
      return NextResponse.json(
        { error: 'Username inválido' },
        { status: 400 }
      )
    }

    if (!body.accentColor || !body.layout || !body.roles || body.roles.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Verificar que el username esté disponible
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', body.username)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Ese username ya lo agarraron. Probá otro.' },
        { status: 409 }
      )
    }

    // Buscar ID del referente si existe código
    let referredById = null;
    if (body.referredBy) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', body.referredBy)
        .maybeSingle();
      
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Crear perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: body.username,
        name: body.name || user.user_metadata.full_name || null,
        email: user.email || null,
        image: user.user_metadata.avatar_url || null,
        github_handle: body.githubHandle || user.user_metadata.user_name || null,
        accent_color: body.accentColor,
        layout: body.layout,
        roles: body.roles,
        tagline: body.tagline || null,
        location: body.location || null,
        available: false,
        referred_by: referredById,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json(
        { error: 'Error al crear perfil' },
        { status: 500 }
      )
    }

    // Crear bloques iniciales si se proveen o si tiene handle de GitHub
    const blocksToInsert = [];

    if (body.blocks && body.blocks.length > 0) {
      blocksToInsert.push(...body.blocks.map(block => ({
        user_id: user.id,
        type: block.type,
        order: block.order,
        col_span: block.colSpan,
        row_span: block.rowSpan,
        data: block.data,
        visible: block.visible,
      })));
    }

    // Si no hay bloque de GitHub en body.blocks y tenemos un githubHandle, agregarlo automáticamente
    const hasGithubBlock = blocksToInsert.some(b => b.type === 'github');
    const githubHandle = body.githubHandle || user.user_metadata.user_name;

    if (!hasGithubBlock && githubHandle) {
      let stats = {
        stars: 0,
        repos: 0,
        followers: 0,
        topLanguages: [] as any[]
      };

      if (body.githubData) {
        stats = {
          stars: body.githubData.topRepos?.reduce((acc: number, r: any) => acc + (r.stars || 0), 0) || 0,
          repos: body.githubData.publicRepos || 0,
          followers: body.githubData.followers || 0,
          topLanguages: body.githubData.topLanguages?.map((l: string) => ({ name: l, percent: 33 })) || [],
        };
      } else {
        // Fallback: Intentar obtener stats reales del API si no vinieron en el body
        try {
          console.log(`// Fetching GitHub stats for ${githubHandle} (on-create fallback)`);
          const reposRes = await fetch(`https://api.github.com/users/${githubHandle}/repos?type=owner&per_page=100`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
          });

          if (reposRes.ok) {
            const repos = await reposRes.json();
            const userDataRes = await fetch(`https://api.github.com/users/${githubHandle}`, {
              headers: { 'Accept': 'application/vnd.github.v3+json' }
            });
            const userData = userDataRes.ok ? await userDataRes.json() : {};

            stats = {
              stars: repos.reduce((acc: number, r: any) => acc + (r.stargazers_count || 0), 0) || 0,
              repos: repos.length || 0,
              followers: userData.followers || 0,
              topLanguages: Array.from(new Set(repos.map((r: any) => r.language).filter(Boolean)))
                .slice(0, 3)
                .map(l => ({ name: l, percent: 33 }))
            };
          }
        } catch (e) {
          console.error('// Fallback github sync error:', e);
        }
      }

      blocksToInsert.push({
        user_id: user.id,
        type: 'github',
        order: blocksToInsert.length,
        col_span: 1,
        row_span: 2,
        data: {
          username: githubHandle,
          stats,
          showAdvanced: true
        },
        visible: true,
      });
    }

    if (blocksToInsert.length > 0) {
      const { error: blocksError } = await supabase
        .from('blocks')
        .insert(blocksToInsert)

      if (blocksError) {
        console.error('Error creating blocks:', blocksError)
        // No fallar toda la request si los bloques fallan
      }
    }

    // Registrar actividad de nuevo builder en el feed
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'new_builder',
      data: { username: body.username }
    });

    // Check for community milestones (e.g. 100, 150, 200...)
    await checkAndPostCommunityMilestone(supabase);

    return NextResponse.json({
      success: true,
      profile,
    })

  } catch (error) {
    console.error('Profile creation error:', error)
    return NextResponse.json(
      { error: 'Algo falló. Nos pasa a todos. Reintentá.' },
      { status: 500 }
    )
  }
}
