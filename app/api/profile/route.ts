import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Obtener bloques
    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .eq('user_id', user.id)
      .order('order', { ascending: true })

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError)
    }

    return NextResponse.json({
      profile,
      blocks: blocks || [],
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
      'tagline',
      'accent_color',
      'layout',
      'roles',
      'location',
      'available',
      'image',
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
