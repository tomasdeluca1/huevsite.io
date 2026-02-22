import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Crear bloques iniciales si se proveen
    if (body.blocks && body.blocks.length > 0) {
      const blocksToInsert = body.blocks.map(block => ({
        user_id: user.id,
        type: block.type,
        order: block.order,
        col_span: block.colSpan,
        row_span: block.rowSpan,
        data: block.data,
        visible: block.visible,
      }))

      const { error: blocksError } = await supabase
        .from('blocks')
        .insert(blocksToInsert)

      if (blocksError) {
        console.error('Error creating blocks:', blocksError)
        // No fallar toda la request si los bloques fallan
      }
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
