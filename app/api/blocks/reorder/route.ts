import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseReorderBody } from '@/lib/mobile-order'

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

    // Forma del body (array pelado de escritorio o { view, blocks }) y validación
    // completa antes de escribir: ver parseReorderBody en lib/mobile-order.ts.
    const plan = parseReorderBody(await request.json())
    if (!plan.ok) {
      return NextResponse.json(
        { error: 'Se requiere un array de bloques con id y order (o { view, blocks })' },
        { status: 400 }
      )
    }
    const items = plan.updates

    const updates = items.map(async ({ id, patch }) => {
      return supabase
        .from('blocks')
        .update(patch)
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
      updated: items.length,
    })

  } catch (error) {
    console.error('Reorder blocks error:', error)
    return NextResponse.json(
      { error: 'Algo falló al reordenar los bloques' },
      { status: 500 }
    )
  }
}
