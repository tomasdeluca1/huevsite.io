import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/blocks/reorder - reordenar múltiples bloques
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body: Array<{ id: string; order: number }> = await request.json()

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de bloques con id y order' },
        { status: 400 }
      )
    }

    // Actualizar cada bloque
    const updates = body.map(async ({ id, order }) => {
      return supabase
        .from('blocks')
        .update({ order })
        .eq('id', id)
        .eq('user_id', user.id)
    })

    const results = await Promise.all(updates)

    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Errors reordering blocks:', errors)
      return NextResponse.json(
        { error: 'Algunos bloques no se pudieron reordenar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated: body.length,
    })

  } catch (error) {
    console.error('Reorder blocks error:', error)
    return NextResponse.json(
      { error: 'Algo falló al reordenar los bloques' },
      { status: 500 }
    )
  }
}
