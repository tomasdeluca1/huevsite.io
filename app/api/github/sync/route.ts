import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { fetchGitHubStats, statsAreMeaningful } from '@/lib/github-service'
import { scoreService } from '@/lib/score-service'

export const dynamic = 'force-dynamic'

// How long synced GitHub stats are considered fresh (skip re-sync unless forced).
const STALE_MS = 12 * 60 * 60 * 1000

// POST /api/github/sync
// Body: { blockId?: string, force?: boolean }
// Refreshes the caller's GitHub block(s) (main profile + sub-sites) from the
// GitHub API and persists the result. Never overwrites meaningful stats with
// zeros. Returns { updated: [{ id, stats }] }.
export async function POST(request: NextRequest) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const blockId: string | undefined = body?.blockId
    const force: boolean = body?.force === true

    // Service-role, scoped to this user's github blocks only.
    const supabase = createServiceRoleClient()

    let query = supabase
      .from('blocks')
      .select('id, type, data')
      .eq('user_id', user.id)
      .eq('type', 'github')

    if (blockId) query = query.eq('id', blockId)

    const { data: blocks, error: fetchError } = await query

    if (fetchError) {
      console.error('[github/sync] fetch blocks error:', fetchError)
      return NextResponse.json({ error: 'Error al leer bloques' }, { status: 500 })
    }

    const updated: Array<{ id: string; stats: any }> = []
    const now = Date.now()

    for (const block of blocks || []) {
      const data = block.data || {}
      const handle: string | undefined = data.username
      if (!handle) continue

      const existing = data.stats

      // Skip if fresh and already meaningful, unless forced.
      if (!force && statsAreMeaningful(existing) && existing?.syncedAt) {
        const age = now - new Date(existing.syncedAt).getTime()
        if (Number.isFinite(age) && age < STALE_MS) continue
      }

      const result = await fetchGitHubStats(handle)
      if (!result) continue // fetch failed → keep existing data

      // Never overwrite meaningful existing stats with an empty/zero result.
      if (!statsAreMeaningful(result.stats) && statsAreMeaningful(existing)) continue

      const newStats = result.stats
      const newData = { ...data, stats: newStats }

      const { error: updateError } = await supabase
        .from('blocks')
        .update({ data: newData })
        .eq('id', block.id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[github/sync] update error:', updateError)
        continue
      }

      updated.push({ id: block.id, stats: newStats })
    }

    if (updated.length > 0) {
      await scoreService.recomputeScore(user.id)
    }

    return NextResponse.json({ updated })
  } catch (error) {
    console.error('[github/sync] error:', error)
    return NextResponse.json({ error: 'Algo falló al sincronizar GitHub' }, { status: 500 })
  }
}
