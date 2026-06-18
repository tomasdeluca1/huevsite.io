import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { buildOnboardingBlocks, selectOnboardingLayout } from '@/lib/onboarding-utils'
import { checkAndPostCommunityMilestone } from '@/lib/twitter'
import { type LinktreeImportData } from '@/lib/linktree-import'
import { scoreService } from '@/lib/score-service'
import { isValidAccentColor } from '@/lib/profile-types'
import { isReservedUsername } from '@/lib/reserved-usernames'
import { isValidCountry } from '@/lib/countries'

export const dynamic = 'force-dynamic'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/
const LINKTREE_BONUS_BLOCKS = 3

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

interface CreateProfileRequest {
  username: string
  name?: string
  tagline?: string
  image?: string
  accentColor: string
  roles: string[]
  location?: string
  githubHandle?: string
  referredBy?: string // Referral code
  githubData?: any
  linktreeData?: LinktreeImportData | null
  country?: string // ISO-3166-1 alpha-2
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

    // After authentication, switch to service-role for all DB operations.
    // The `authenticated` role has no INSERT policy on profiles (only SELECT
    // and UPDATE), so the session client's INSERT is silently denied by RLS.
    const adminSupabase = createServiceRoleClient()

    const body: CreateProfileRequest = await request.json()
    const inferredGitHubHandle = getGitHubHandleFromUser(user)

    // Validaciones
    if (!body.username || !USERNAME_REGEX.test(body.username)) {
      return NextResponse.json(
        { error: 'Username inválido' },
        { status: 400 }
      )
    }

    // Rechazar usernames reservados (rutas del sistema/marca). Guard autoritativo
    // server-side, además del chequeo en /api/username/check.
    if (isReservedUsername(body.username)) {
      return NextResponse.json(
        { error: 'Ese username está reservado por el sistema. Probá otro.', reserved: true },
        { status: 409 }
      )
    }

    if (!body.accentColor || !body.roles || body.roles.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // accent_color is interpolated UNESCAPED into a <style> tag on every public
    // profile page. Enforce the same strict hex format the PATCH route uses, so
    // this path can't be used to store a CSS/HTML-injection payload.
    if (!isValidAccentColor(body.accentColor)) {
      return NextResponse.json(
        { error: 'accent_color debe ser un color hex de 6 dígitos (ej: #C8FF00)' },
        { status: 400 }
      )
    }

    // Verificar que el username esté disponible
    const { data: existingProfile } = await adminSupabase
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

    // Buscar ID del referente si existe código.
    let referredById = null;
    if (body.referredBy) {
      const { data: referrer } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('referral_code', body.referredBy)
        .maybeSingle();

      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Crear perfil
    const hasImportedLinktree = !!body.linktreeData?.links?.length
    const selectedLayout = selectOnboardingLayout(body.username)
    const githubHandle = body.githubHandle || body.githubData?.username || inferredGitHubHandle || null

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: user.id,
        username: body.username,
        name: body.name || user.user_metadata.full_name || null,
        email: user.email || null,
        image: body.image || user.user_metadata.avatar_url || null,
        github_handle: githubHandle,
        accent_color: body.accentColor,
        layout: selectedLayout,
        roles: body.roles,
        tagline: body.tagline || null,
        location: body.location || null,
        available: false,
        referred_by: referredById,
        extra_blocks_from_share: hasImportedLinktree ? LINKTREE_BONUS_BLOCKS : 0,
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

    // Best-effort country write (separate from the insert so an unmigrated
    // `country` column never blocks signup). Ignored if invalid or absent.
    if (body.country && isValidCountry(body.country)) {
      const { error: countryErr } = await adminSupabase
        .from('profiles')
        .update({ country: body.country.toUpperCase() })
        .eq('id', user.id)
      if (countryErr) {
        console.warn('country set skipped on create (column may not exist yet):', countryErr.message)
      } else if (profile) {
        ;(profile as any).country = body.country.toUpperCase()
      }
    }

    const generatedBlocks = buildOnboardingBlocks({
      state: {
        username: body.username,
        accentColor: body.accentColor as any,
        layout: selectedLayout,
        roles: body.roles as any,
        githubHandle: githubHandle || undefined,
        githubData: body.githubData || null,
        linktreeData: body.linktreeData || null,
      },
      displayName: body.name || user.user_metadata.full_name || undefined,
      avatarUrl: body.image || user.user_metadata.avatar_url || undefined,
      tagline: body.tagline || undefined,
    })

    const blocksToInsert = generatedBlocks.map((block) => ({
      user_id: user.id,
      type: block.type,
      order: block.order,
      col_span: block.col_span,
      row_span: block.row_span,
      visible: block.visible,
      data: block.type === 'hero'
        ? {
            name: block.name,
            tagline: block.tagline,
            avatarUrl: block.avatarUrl,
            status: block.status,
            location: block.location,
            description: block.description,
            roles: block.roles,
          }
        : block.type === 'github'
          ? {
              username: block.username,
              stats: block.stats,
              showAdvanced: block.showAdvanced,
            }
          : block.type === 'social'
            ? { links: block.links }
            : block.type === 'stack'
              ? { items: block.items }
              : block.type === 'project'
                ? {
                    title: block.title,
                    description: block.description,
                    imageUrl: block.imageUrl,
                    metrics: block.metrics,
                    link: block.link,
                    stack: block.stack,
                  }
                : block.type === 'writing'
                  ? { posts: block.posts }
                  : block.type === 'media'
                    ? {
                        url: block.url,
                        title: block.title,
                        description: block.description,
                        link: block.link,
                      }
                    : block.type === 'custom'
                      ? {
                          label: block.label,
                          title: block.title,
                          description: block.description,
                          link: block.link,
                        }
                      : {},
    }))

    if (blocksToInsert.length > 0) {
      const { error: blocksError } = await adminSupabase
        .from('blocks')
        .insert(blocksToInsert)

      if (blocksError) {
        console.error('Error creating blocks:', blocksError)
        // No fallar toda la request si los bloques fallan
      }
    }

    // Registrar actividad de nuevo builder en el feed
    await adminSupabase.from('activities').insert({
      user_id: user.id,
      type: 'new_builder',
      data: { username: body.username }
    });

    // Check for community milestones (e.g. 100, 150, 200...)
    await checkAndPostCommunityMilestone(adminSupabase);

    const newScore = await scoreService.recomputeScore(user.id);
    if (profile) {
      profile.builder_score = newScore;
    }

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
