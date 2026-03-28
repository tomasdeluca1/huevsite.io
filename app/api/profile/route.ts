import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreService } from '@/lib/score-service'
import { vercelService } from '@/lib/vercel-service'
import { hasProAccess } from '@/lib/pro-access'

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
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

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
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Campos actualizables
    const allowedFields = [
      'name',
      'username',
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
    ]

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

    if (updateData.image !== undefined) {
      await syncMainHeroAvatar(supabase, user.id, updateData.image || null)
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
