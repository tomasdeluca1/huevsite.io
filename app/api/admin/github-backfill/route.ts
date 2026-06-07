import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/admin-auth'
import { fetchGitHubStats, statsAreMeaningful, statsAreComplete } from '@/lib/github-service'
import { scoreService } from '@/lib/score-service'

export const dynamic = 'force-dynamic'
// Bound to Vercel's max; the time guard below stops well before this.
export const maxDuration = 60

// POST /api/admin/github-backfill?secret=ADMIN_SECRET&limit=100&dryRun=true
//
// One-time/repeatable bulk fix for GitHub blocks whose stats are still at zero.
// The dashboard only re-syncs a profile when its owner returns; dormant profiles
// stay zeroed. This endpoint refreshes them in bulk via the same authenticated
// GraphQL path (lib/github-service, GITHUB_TOKEN).
//
// Targets blocks that lack a real sync (no syncedAt + populated heatmap). This
// includes both fully-zeroed blocks AND legacy/partial ones that have old repo
// counts but no real heatmap / per-month commits (statsAreMeaningful is true
// for those, so it would wrongly skip them — statsAreComplete catches them).
// Never overwrites existing data with zeros: a failed or empty fetch is skipped.
// Re-run until "updated" is empty — fixed blocks become complete and drop out
// of the candidate set.

const READ_PAGE = 1000 // Supabase default row cap per query
const CONCURRENCY = 5
const TIME_BUDGET_MS = 50 * 1000 // stop launching work before maxDuration

type BlockRow = { id: string; user_id: string; data: any }

export async function POST(request: NextRequest) {
  try {
    const supabase = await getAdminClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const params = request.nextUrl.searchParams
    const dryRun = params.get('dryRun') === 'true'
    const limit = Math.max(1, parseInt(params.get('limit') || '100', 10) || 100)

    // 1. Read all github blocks, paginated (no block missed past the 1000 cap).
    const all: BlockRow[] = []
    for (let from = 0; ; from += READ_PAGE) {
      const { data, error } = await supabase
        .from('blocks')
        .select('id, user_id, data')
        .eq('type', 'github')
        .range(from, from + READ_PAGE - 1)

      if (error) {
        console.error('[github-backfill] read error:', error)
        return NextResponse.json({ error: 'Error al leer bloques' }, { status: 500 })
      }
      if (!data || data.length === 0) break
      all.push(...(data as BlockRow[]))
      if (data.length < READ_PAGE) break
    }

    const scanned = all.length
    const skippedNoHandle = all.filter((b) => !b.data?.username).length
    const candidates = all.filter(
      (b) => b.data?.username && !statsAreComplete(b.data?.stats)
    )

    if (dryRun) {
      return NextResponse.json({
        scanned,
        candidates: candidates.length,
        updated: [],
        fetchFailed: [],
        noData: [],
        skippedNoHandle,
        remainingCandidates: candidates.length,
        dryRun: true,
      })
    }

    // 2. Process up to `limit` candidates, small concurrency + time guard.
    const toProcess = candidates.slice(0, limit)
    const updated: string[] = []
    const fetchFailed: string[] = []
    const noData: string[] = []
    const affectedUsers = new Set<string>()
    const deadline = Date.now() + TIME_BUDGET_MS

    let cursor = 0
    const worker = async (): Promise<void> => {
      while (true) {
        if (Date.now() > deadline) return
        const i = cursor++
        if (i >= toProcess.length) return

        const block = toProcess[i]
        const handle: string = block.data.username
        try {
          const result = await fetchGitHubStats(handle)
          // Golden rule: never overwrite with zeros. Null = fetch failed;
          // non-meaningful = nothing real to write. Keep existing in both cases.
          if (!result) {
            fetchFailed.push(handle)
            continue
          }
          if (!statsAreMeaningful(result.stats)) {
            noData.push(handle)
            continue
          }

          const newData = { ...block.data, stats: result.stats }
          const { error } = await supabase!
            .from('blocks')
            .update({ data: newData })
            .eq('id', block.id)

          if (error) {
            console.error(`[github-backfill] update error for ${block.id}:`, error)
            fetchFailed.push(handle)
            continue
          }

          updated.push(handle)
          affectedUsers.add(block.user_id)
        } catch (e) {
          console.error(`[github-backfill] fetch error for ${handle}:`, e)
          fetchFailed.push(handle)
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

    // 3. Recompute score once per affected user (showcase visibility).
    for (const userId of Array.from(affectedUsers)) {
      try {
        await scoreService.recomputeScore(userId)
      } catch (e) {
        console.error(`[github-backfill] recomputeScore failed for ${userId}:`, e)
      }
    }

    return NextResponse.json({
      scanned,
      candidates: candidates.length,
      updated,
      fetchFailed,
      noData,
      skippedNoHandle,
      // Anything not updated is still zeroed (failed, no data, or not yet reached).
      remainingCandidates: candidates.length - updated.length,
      dryRun: false,
    })
  } catch (error) {
    console.error('[github-backfill] error:', error)
    return NextResponse.json({ error: 'Algo falló en el backfill' }, { status: 500 })
  }
}
