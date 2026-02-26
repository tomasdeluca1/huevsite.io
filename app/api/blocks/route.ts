import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/blocks - crear nuevo bloque
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

    const body = await request.json()
    console.log('POST /api/blocks - body:', body)

    // Validaciones
    if (!body.type || !body.data) {
      console.error('POST - Missing type or data')
      return NextResponse.json(
        { error: 'Tipo y datos son requeridos' },
        { status: 400 }
      )
    }

    // Limit logic
    const { data: profileData } = await supabase
      .from('profiles')
      .select('subscription_tier, extra_blocks_from_share')
      .eq('id', user.id)
      .single()

    const { count: blockCount } = await supabase
      .from('blocks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const MAX_BASE_FREE = 5
    const effectiveLimit = MAX_BASE_FREE + (profileData?.extra_blocks_from_share || 0)

    if (profileData?.subscription_tier !== 'pro' && blockCount !== null && blockCount >= effectiveLimit) {
      return NextResponse.json(
        { error: 'Límite de bloques alcanzado para plan gratuito' },
        { status: 403 }
      )
    }

    // Obtener el último order para asignar uno nuevo
    const { data: lastBlock } = await supabase
      .from('blocks')
      .select('order')
      .eq('user_id', user.id)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const newOrder = lastBlock ? lastBlock.order + 1 : 0
    console.log('POST - New order:', newOrder)

    const insertData = {
      user_id: user.id,
      type: body.type,
      order: body.order !== undefined ? body.order : newOrder,
      col_span: body.colSpan || 1,
      row_span: body.rowSpan || 1,
      data: body.data,
      visible: body.visible !== undefined ? body.visible : true,
    }
    console.log('POST - Insert data:', insertData)

    // Crear bloque
    const { data: block, error: createError } = await supabase
      .from('blocks')
      .insert(insertData)
      .select()
      .single()

    if (createError) {
      console.error('POST - Create error:', createError)
      return NextResponse.json(
        { error: 'Error al crear bloque', details: createError.message },
        { status: 500 }
      )
    }

    console.log('POST - Success:', block)

    // Log the activity to the feed
    const { error: activityError } = await supabase.from('activities').insert({
       user_id: user.id,
       type: 'new_block',
       data: { blockType: body.type }
    });
    
    if (activityError) console.error("Error logging block activity", activityError);

    return NextResponse.json({
      success: true,
      block,
    })

  } catch (error) {
    console.error('Create block error:', error)
    return NextResponse.json(
      { error: 'Algo falló al crear el bloque' },
      { status: 500 }
    )
  }
}
