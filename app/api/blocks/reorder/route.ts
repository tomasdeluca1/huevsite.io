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

    // Dos formas de body:
    //  - array pelado [{ id, order }]            -> escritorio (compatibilidad)
    //  - { view: 'desktop' | 'mobile', blocks }  -> blocks: [{ id, order }]
    //    En 'mobile' cada item escribe mobile_order, con `mobile_order` u `order`
    //    como valor; `null` vuelve a seguir el orden de escritorio.
    const raw = await request.json()
    const view: 'desktop' | 'mobile' =
      !Array.isArray(raw) && raw?.view === 'mobile' ? 'mobile' : 'desktop'
    const items: Array<{ id: string; order?: number | null; mobile_order?: number | null }> =
      Array.isArray(raw) ? raw : raw?.blocks

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      (!Array.isArray(raw) && raw?.view !== undefined && raw.view !== 'desktop' && raw.view !== 'mobile')
    ) {
      return NextResponse.json(
        { error: 'Se requiere un array de bloques con id y order' },
        { status: 400 }
      )
    }

    const valid = items.every(i => {
      if (!i || typeof i.id !== 'string') return false
      const v = view === 'mobile' ? (i.mobile_order !== undefined ? i.mobile_order : i.order) : i.order
      return view === 'mobile' ? v === null || Number.isInteger(v) : Number.isInteger(v)
    })
    if (!valid) {
      return NextResponse.json(
        { error: 'Cada bloque necesita un id y un order numérico' },
        { status: 400 }
      )
    }

    // Actualizar cada bloque
    const updates = items.map(async (item) => {
      const patch = view === 'mobile'
        ? { mobile_order: item.mobile_order !== undefined ? item.mobile_order : item.order }
        : { order: item.order as number }
      return supabase
        .from('blocks')
        .update(patch)
        .eq('id', item.id)
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
