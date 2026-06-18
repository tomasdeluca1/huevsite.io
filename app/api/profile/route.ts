import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { isValidCountry } from '@/lib/countries'
import { scoreService } from '@/lib/score-service'
import { vercelService } from '@/lib/vercel-service'
import { hasProAccess } from '@/lib/pro-access'
import { rateLimit, getIdentifier } from '@/lib/rate-limit'
import { subscribeToBeehiiv, unsubscribeFromBeehiiv } from '@/lib/beehiiv'

const profilePatchSchema = z.object({
  name: z.string().max(100).optional(),
  username: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username solo puede tener letras, números, guiones y guiones bajos').optional(),
  // Accept "" so the dashboard can send the field unconditionally without a
  // 400. An empty string is normalized to null below (clears the email).
  email: z.string().email().or(z.literal('')).optional(),
  tagline: z.string().max(200).optional(),
  // CSS injection guard: accent_color is interpolated into a <style dangerouslySetInnerHTML>
  // tag on public profile pages. Must be a strict 6-digit hex color.
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'accent_color debe ser un color hex de 6 dígitos (ej: #C8FF00)').optional(),
  layout: z.string().optional(),
  roles: z.array(z.string()).optional(),
  location: z.string().max(100).optional(),
  available: z.boolean().optional(),
  github_handle: z.string().max(50).optional(),
  image: z.string().url().or(z.literal('')).optional(),
  has_seen_update_feb25: z.boolean().optional(),
  custom_domain: z.string().max(253).optional(),
  // Same CSS injection vector: border_radius is interpolated into the same <style> tag.
  // Allow only a numeric value with rem/px/em units (or plain "0").
  border_radius: z.string().regex(/^(0|\d+(\.\d+)?(rem|px|em))$/, 'border_radius debe ser un valor CSS válido (ej: 1.5rem, 12px, 0)').optional(),
  is_onboarding_test_user: z.boolean().optional(),
  newsletter_subscribed: z.boolean().optional(),
  // Board presets (Pro): qué board está publicado (0-2) y sus nombres.
  published_board: z.number().int().min(0).max(2).optional(),
  board_names: z.record(z.string().max(40)).optional(),
})

const profileUpdateLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 })

export const dynamic = 'force-dynamic'

async function syncMainHeroAvatar(supabase: any, userId: string, avatarUrl: string | null) {
  const { data: heroBlock } = await supabase
    .from('blocks')
    .select('id, data')
    .eq('user_id', userId)
    .is('sub_site_id', null)
    .eq('type', 'hero')
    .maybeSingle();

  if (!heroBlock) return;

  const nextData = {
    ...(heroBlock.data || {}),
    avatarUrl: avatarUrl || "",
  };

  await supabase
    .from('blocks')
    .update({ data: nextData })
    .eq('id', heroBlock.id)
    .eq('user_id', userId);
}

// GET /api/profile - obtener perfil del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const sessionClient = await createClient()

    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // After authenticating the user via the session client, switch to the
    // service-role client to read the full profile (including columns that
    // are no longer grant-readable to authenticated, like ai_credits,
    // lemon_squeezy_* and free_trial_*). All queries below are scoped to
    // user.id so we never leak someone else's data.
    const supabase = createServiceRoleClient()

    // Obtener perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, ai_credits, is_onboarding_test_user')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Obtener bloques del sitio principal (sub_site_id IS NULL)
    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .eq('user_id', user.id)
      .is('sub_site_id', null)
      .order('order', { ascending: true })

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError)
    }

    const normalizedBlocks = (blocks || []).map((block: any) => {
      if (block.type !== 'hero') return block;
      return {
        ...block,
        data: {
          ...(block.data || {}),
          avatarUrl: profile.image || "",
        },
      };
    });

    // Obtener sub_sites y check BOTW en paralelo
    const [
      { data: subSites, error: subSitesError },
      { data: botwWin },
    ] = await Promise.all([
      supabase
        .from('sub_sites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('showcase_winners')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle(),
    ])

    if (subSitesError) {
      console.error('Error fetching subSites:', subSitesError)
    }

    return NextResponse.json({
      profile,
      blocks: normalizedBlocks,
      subSites: subSites || [],
      hasWonBuilderOfTheWeek: !!botwWin,
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Algo falló al obtener el perfil' },
      { status: 500 }
    )
  }
}

// PATCH /api/profile - actualizar perfil del usuario autenticado
export async function PATCH(request: NextRequest) {
  try {
    const sessionClient = await createClient()

    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // After authentication, switch to service-role so the update reaches
    // columns the `authenticated` role can no longer SELECT after the
    // 2026-04-11 hardening (the .select() after .update() would 403 otherwise).
    // All queries below are scoped to user.id so we never touch other rows.
    const supabase = createServiceRoleClient()

    // Rate limit: 30 profile updates per minute per user
    const rl = profileUpdateLimiter.check(30, getIdentifier(request, user.id))
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Esperá un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      )
    }

    const body = await request.json()

    const parsed = profilePatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Campos actualizables
    const allowedFields = [
      'name',
      'username',
      'email',
      'tagline',
      'accent_color',
      'layout',
      'roles',
      'location',
      'available',
      'github_handle',
      'image',
      'has_seen_update_feb25',
      'custom_domain',
      'border_radius',
      'is_onboarding_test_user',
      'newsletter_subscribed',
      'community_digest_unsubscribed',
      'published_board',
      'board_names',
    ]

    // Board presets son Pro: publicar un board != 0 requiere acceso Pro.
    // (Un free solo tiene el board 0, así que nunca llega acá con > 0.)
    if (typeof body.published_board === 'number' && body.published_board !== 0) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('subscription_tier, pro_since, referral_reward_expires_at, free_trial_ends_at')
        .eq('id', user.id)
        .single();
      if (!prof || !hasProAccess(prof)) {
        return NextResponse.json(
          { error: 'Los boards múltiples son una función Pro.' },
          { status: 403 }
        );
      }
    }

    // Segurizar: Solo usuarios PRO pueden configurar custom_domain
    if (body.custom_domain !== undefined) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, pro_since, custom_domain')
        .eq('id', user.id)
        .single();
      
      const isPro = profile && hasProAccess(profile);
      if (!isPro && body.custom_domain !== "") {
        return NextResponse.json(
          { error: 'Para usar un dominio custom necesitás huevsite PRO.' },
          { status: 403 }
        );
      }

      // Sincronizar con Vercel si el dominio cambió
      const oldDomain = profile?.custom_domain;
      const newDomain = body.custom_domain;

      if (newDomain !== oldDomain) {
        // 1. Quitar el viejo si existía
        if (oldDomain) {
          await vercelService.removeDomain(oldDomain);
        }

        // 2. Agregar el nuevo si no es vacío
        if (newDomain) {
          const result = await vercelService.addDomain(newDomain);
          if (!result.success) {
            return NextResponse.json(
              { error: `Error al registrar dominio en Vercel: ${result.error}` },
              { status: 500 }
            );
          }
        }
      }
    }

    const updateData: any = {}
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // custom_domain has a UNIQUE constraint. An empty string ('') collides
    // across profiles (only one '' is allowed), throwing 23505 on save. Persist
    // NULL for "no domain" — UNIQUE permits unlimited NULLs.
    if (updateData.custom_domain === "") {
      updateData.custom_domain = null
    }

    // Empty email means "no email" — persist NULL, never the empty string.
    if (updateData.email === "") {
      updateData.email = null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No hay datos para actualizar' },
        { status: 400 }
      )
    }

    // Actualizar perfil
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar perfil' },
        { status: 500 }
      )
    }

    // Country (ISO-3166-1 alpha-2) is updated as a best-effort, separate write so
    // the column being absent (migration not applied yet) never fails the main
    // profile save. Empty string clears it; invalid codes are ignored.
    if (body.country !== undefined) {
      const raw = String(body.country || '').toUpperCase()
      const val = raw === '' ? null : (isValidCountry(raw) ? raw : null)
      const { error: countryErr } = await supabase
        .from('profiles')
        .update({ country: val })
        .eq('id', user.id)
      if (countryErr) {
        console.warn('country update skipped (column may not exist yet):', countryErr.message)
      } else if (profile) {
        ;(profile as any).country = val
      }
    }

    if (updateData.image !== undefined) {
      await syncMainHeroAvatar(supabase, user.id, updateData.image || null)
    }

    // Sync the newsletter flag to beehiiv when it flips. Fire-and-forget:
    // the profile patch must succeed even if beehiiv is unreachable.
    if (updateData.newsletter_subscribed !== undefined && user.email) {
      if (updateData.newsletter_subscribed) {
        subscribeToBeehiiv({
          email: user.email,
          utmSource: 'huevsite-io',
          utmCampaign: 'dashboard-opt-in',
        }).catch((err) => console.error('// beehiiv subscribe (dashboard):', err))
      } else {
        unsubscribeFromBeehiiv(user.email).catch((err) =>
          console.error('// beehiiv unsubscribe (dashboard):', err)
        )
      }
    }

    // Al actualizar el perfil (name, tagline, image), el score puede cambiar
    const newScore = await scoreService.recomputeScore(user.id);
    if (profile) {
      profile.builder_score = newScore;

      // Log activity to the feed
      const { error: activityError } = await supabase.from('activities').insert({
        user_id: user.id,
        type: 'profile_update',
        data: {
          updatedFields: Object.keys(updateData),
          displayName: profile.name || profile.username
        }
      });
      if (activityError) console.error("Error logging profile activity", activityError);
    }

    return NextResponse.json({
      success: true,
      profile,
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Algo falló al actualizar el perfil' },
      { status: 500 }
    )
  }
}
