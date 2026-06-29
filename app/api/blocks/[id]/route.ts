import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { scoreService } from '@/lib/score-service'
import { checkAndPostWelcomeTweet } from '@/lib/twitter'

export const dynamic = 'force-dynamic'

// Sync the hero block's header fields (avatar + name + tagline) down to the
// owner's profiles row, so consumers that read the columns (recruiter, explore,
// OG, BDLS, badges) stay in sync with what the user actually set in their hero.
// Only mirror a field when the hero provides it: `image` follows avatarUrl when
// that key is present (preserving the old clear-on-empty behavior); name/tagline
// are only written when non-empty, so a partial save never wipes a modal-set value.
async function syncOwnerProfileFromHero(
  supabase: any,
  userId: string,
  subSiteId: string | null,
  heroData: any
) {
  const d = heroData || {};
  if (subSiteId) {
    const sub: any = { updated_at: new Date().toISOString() };
    if ('avatarUrl' in d) sub.avatar_url = d.avatarUrl || null;
    await supabase.from('sub_sites').update(sub).eq('id', subSiteId).eq('user_id', userId);
    return;
  }
  const update: any = {};
  if ('avatarUrl' in d) update.image = d.avatarUrl || null;
  if (typeof d.name === 'string' && d.name.trim()) update.name = d.name.trim();
  if (typeof d.tagline === 'string' && d.tagline.trim()) update.tagline = d.tagline.trim();
  if (Object.keys(update).length > 0) {
    await supabase.from('profiles').update(update).eq('id', userId);
  }
}

// PATCH /api/blocks/[id] - actualizar bloque
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionClient = await createClient()

    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // After auth, switch to service-role. All queries below are scoped to
    // (id, user_id) so the user can only touch their own blocks.
    const supabase = createServiceRoleClient()

    const blockId = params.id
    const body = await request.json()

    // Verificar que el bloque pertenece al usuario
    const { data: existingBlock, error: fetchError } = await supabase
      .from('blocks')
      .select('*')
      .eq('id', blockId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError || !existingBlock) {
      return NextResponse.json(
        { error: 'Bloque no encontrado' },
        { status: 404 }
      )
    }

    // Separar campos de PostgreSQL vs campos del payload JSON de 'data'
    // Los campos que van directamente a columnas PostgreSQL
    const pgColumns = ['type', 'order', 'col_span', 'row_span', 'visible']
    // Los campos que NO deben guardarse (son metadata o auto-generados)
    const excludeFields = ['id', 'user_id', 'created_at', 'updated_at']

    const updateData: any = {}
    const jsonData: any = {}

    Object.keys(body).forEach(key => {
      // Saltar campos excluidos
      if (excludeFields.includes(key)) {
        return;
      }

      // Manejar el caso de que el front nos mande un object anidado "data" directamente
      if (key === 'data') {
        Object.assign(jsonData, body[key]);
        return;
      }

      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()

      if (pgColumns.includes(snakeKey) || pgColumns.includes(key)) {
        // Campo va a columna PostgreSQL
        updateData[snakeKey] = body[key]
      } else {
        // Cualquier otro campo va al JSONB de 'data'
        jsonData[key] = body[key]
      }
    })

    // Solo actualizar el JSONB si hay datos para él
    if (Object.keys(jsonData).length > 0) {
      updateData.data = jsonData
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No hay datos para actualizar' },
        { status: 400 }
      )
    }

    // Actualizar bloque
    const { data: block, error: updateError } = await supabase
      .from('blocks')
      .update(updateData)
      .eq('id', blockId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating block:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar bloque' },
        { status: 500 }
      )
    }

    if (existingBlock.type === 'hero') {
      await syncOwnerProfileFromHero(
        supabase,
        user.id,
        existingBlock.sub_site_id || null,
        jsonData
      );
    }

    // Log the activity to the feed
    const { error: activityError } = await supabase.from('activities').insert({
      user_id: user.id,
      type: 'block_update',
      data: {
        blockType: block.type,
        blockId: block.id,
        updateType: Object.keys(updateData).filter(k => k !== 'data')
      }
    });

    if (activityError) console.error("Error logging block activity", activityError);

    // Check and post welcome tweet if social block
    await checkAndPostWelcomeTweet(supabase, user.id, block.type, block.data);

    // Recompute score
    await scoreService.recomputeScore(user.id);

    return NextResponse.json({
      success: true,
      block,
    })

  } catch (error) {
    console.error('Update block error:', error)
    return NextResponse.json(
      { error: 'Algo falló al actualizar el bloque' },
      { status: 500 }
    )
  }
}

// DELETE /api/blocks/[id] - eliminar bloque
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionClient = await createClient()

    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    if (authError || !user) {
      console.error('DELETE - Auth error:', authError)
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // After auth, service-role client scoped to (id, user_id).
    const supabase = createServiceRoleClient()

    const blockId = params.id

    // Primero verificar que existe y pertenece al usuario
    const { data: existingBlock, error: fetchError } = await supabase
      .from('blocks')
      .select('id, user_id')
      .eq('id', blockId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('DELETE - Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Error al verificar bloque' },
        { status: 500 }
      )
    }

    if (!existingBlock) {
      console.error('DELETE - Block not found or not owned by user')
      return NextResponse.json(
        { error: 'Bloque no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar bloque
    const { error: deleteError } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('DELETE - Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar bloque' },
        { status: 500 }
      )
    }

    // Recompute score
    await scoreService.recomputeScore(user.id);

    return NextResponse.json({
      success: true,
    })

  } catch (error) {
    console.error('DELETE - Catch error:', error)
    return NextResponse.json(
      { error: 'Algo falló al eliminar el bloque' },
      { status: 500 }
    )
  }
}
