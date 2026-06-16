import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { scoreService } from '@/lib/score-service'
import { checkAndPostWelcomeTweet } from '@/lib/twitter'
import { hasProAccess } from '@/lib/pro-access'
import { rateLimit, getIdentifier } from '@/lib/rate-limit'
import { fetchGitHubStats, statsAreMeaningful } from '@/lib/github-service'

const blockCreateSchema = z.object({
  type: z.string().min(1),
  data: z.record(z.unknown()),
  order: z.number().int().nonnegative().optional(),
  colSpan: z.number().int().min(1).max(4).optional(),
  rowSpan: z.number().int().min(1).max(4).optional(),
  visible: z.boolean().optional(),
  sub_site_id: z.string().uuid().nullable().optional(),
  // Board preset (perfil principal): a qué board pertenece el bloque (0-2).
  board_index: z.number().int().min(0).max(2).optional(),
})

const blockCreateLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 })

export const dynamic = 'force-dynamic'

async function syncOwnerAvatarFromHero(
  supabase: any,
  userId: string,
  subSiteId: string | null,
  avatarUrl: string | null
) {
  if (subSiteId) {
    await supabase
      .from('sub_sites')
      .update({
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subSiteId)
      .eq('user_id', userId);
    return;
  }

  await supabase
    .from('profiles')
    .update({ image: avatarUrl || null })
    .eq('id', userId);
}

// POST /api/blocks - crear nuevo bloque
export async function POST(request: NextRequest) {
  try {
    const sessionClient = await createClient()

    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // After auth, switch to service-role. The `authenticated` role can no
    // longer SELECT the trial / subscription columns we need for the pro
    // check, and the public-column GRANT doesn't cover all of them. All
    // queries below are scoped to user.id so there's no cross-user access.
    const supabase = createServiceRoleClient()

    // Rate limit: 20 block creations per minute per user
    const rl = blockCreateLimiter.check(20, getIdentifier(request, user.id))
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Esperá un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      )
    }

    const body = await request.json()

    // Validaciones
    const parsed = blockCreateSchema.safeParse(body)
    if (!parsed.success) {
      console.error('POST - Validation error:', parsed.error.flatten())
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Limit logic. Intentamos traer published_board (board presets); si la
    // columna no está migrada, reintentamos sin ella (degrada a board 0).
    const PROFILE_LIMIT_COLS = 'subscription_tier, pro_since, referral_reward_expires_at, free_trial_claimed_at, free_trial_started_at, free_trial_ends_at, free_trial_last_insights_viewed_at, extra_blocks_from_share'
    let profileData: any = null
    ;({ data: profileData } = await supabase
      .from('profiles')
      .select(PROFILE_LIMIT_COLS + ', published_board')
      .eq('id', user.id)
      .single())
    if (!profileData) {
      ({ data: profileData } = await supabase
        .from('profiles')
        .select(PROFILE_LIMIT_COLS)
        .eq('id', user.id)
        .single())
    }
    const publishedBoard = profileData?.published_board ?? 0

    // Contar bloques del mismo scope (main profile o sub-site específico).
    // El frontend limita por scope, así que la API debe alinearse — si no,
    // usuarios Pro con muchos sub-sites quedan bloqueados incorrectamente.
    const targetSubSiteId = body.sub_site_id || null
    // Board del perfil principal (0-2). Los sub-sites no usan boards → siempre 0.
    const boardIndex = targetSubSiteId ? 0 : (body.board_index ?? 0)

    // Boards múltiples son Pro: un free solo puede editar su board publicado
    // (board 0 en el caso normal; o el que tenía publicado si era Pro y bajó).
    if (boardIndex !== publishedBoard && !(profileData && hasProAccess(profileData))) {
      return NextResponse.json(
        { error: 'Los boards múltiples son una función Pro.' },
        { status: 403 }
      )
    }

    let blockCountQuery = supabase
      .from('blocks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('visible', true)

    blockCountQuery = targetSubSiteId
      ? blockCountQuery.eq('sub_site_id', targetSubSiteId)
      : blockCountQuery.is('sub_site_id', null).eq('board_index', boardIndex)

    const { count: blockCount } = await blockCountQuery

    const MAX_BASE_FREE = 5
    const MAX_PRO = 22 // Consistente con MAX_PRO_BLOCKS en el frontend
    const effectiveLimit = profileData && hasProAccess(profileData)
      ? MAX_PRO
      : MAX_BASE_FREE + (profileData?.extra_blocks_from_share || 0)

    if (blockCount !== null && blockCount >= effectiveLimit) {
      return NextResponse.json(
        { error: `Límite de bloques alcanzado (${effectiveLimit})` },
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

    const insertData: any = {
      user_id: user.id,
      type: body.type,
      order: body.order !== undefined ? body.order : newOrder,
      col_span: body.colSpan || 1,
      row_span: body.rowSpan || 1,
      data: body.data,
      visible: body.visible !== undefined ? body.visible : true,
      sub_site_id: body.sub_site_id || null,
      board_index: boardIndex,
    }

    // Enrich GitHub blocks with real stats from the GitHub API (authenticated
    // via GITHUB_TOKEN: stars, repos, followers, languages, real contribution
    // heatmap, and per-month commits). Never overwrite with zeros — only write
    // when the fetch returns meaningful data.
    if (insertData.type === 'github' && insertData.data?.username) {
      try {
        const result = await fetchGitHubStats(insertData.data.username);
        if (result && statsAreMeaningful(result.stats)) {
          insertData.data = { ...insertData.data, stats: result.stats };
        }
      } catch (e) {
        console.error('// GitHub block sync error:', e);
      }
    }

    // Crear bloque
    let { data: block, error: createError } = await supabase
      .from('blocks')
      .insert(insertData)
      .select()
      .single()

    // Si la migración de board_index no está aplicada todavía, reintentamos sin
    // esa columna para no romper la creación de bloques (degrada a un solo board).
    if (createError && /board_index/i.test(createError.message || '')) {
      const { board_index: _omit, ...legacyInsert } = insertData;
      ({ data: block, error: createError } = await supabase
        .from('blocks')
        .insert(legacyInsert)
        .select()
        .single())
    }

    if (createError) {
      console.error('POST - Create error:', createError)
      return NextResponse.json(
        { error: 'Error al crear bloque', details: createError.message },
        { status: 500 }
      )
    }

    if (body.type === 'hero') {
      await syncOwnerAvatarFromHero(
        supabase,
        user.id,
        body.sub_site_id || null,
        body.data?.avatarUrl || null
      );
    }

    // Log the activity to the feed
    const { error: activityError } = await supabase.from('activities').insert({
      user_id: user.id,
      type: 'new_block',
      data: { blockType: body.type }
    });

    if (activityError) console.error("Error logging block activity", activityError);
    
    // Check and post welcome tweet if social block
    await checkAndPostWelcomeTweet(supabase, user.id, body.type, body.data);

    // Recompute score
    await scoreService.recomputeScore(user.id);

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
