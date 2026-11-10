import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { syncGitHubBlocks } from '@/lib/github-sync'
import { scoreService } from '@/lib/score-service'

export const dynamic = 'force-dynamic'

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

    let updated: Array<{ id: string; stats: any }> = []
    try {
      const synced = await syncGitHubBlocks(supabase, user.id, { blockId, force })
      updated = synced.updated
    } catch (error) {
      console.error('[github/sync] error:', error)
      return NextResponse.json({ error: 'Error al leer bloques' }, { status: 500 })
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
