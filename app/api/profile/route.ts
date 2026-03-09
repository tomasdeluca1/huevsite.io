import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreService } from '@/lib/score-service'

export const dynamic = 'force-dynamic'

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
      .select('*')
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

    // Obtener sub_sites
    const { data: subSites, error: subSitesError } = await supabase
      .from('sub_sites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (subSitesError) {
      console.error('Error fetching subSites:', subSitesError)
    }

    return NextResponse.json({
      profile,
      blocks: blocks || [],
      subSites: subSites || [],
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
      'has_seen_update_feb25',
      'custom_domain',
    ]

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
