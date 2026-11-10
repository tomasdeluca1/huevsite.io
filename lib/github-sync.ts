import { fetchGitHubStats, statsAreMeaningful, type GitHubStats } from "@/lib/github-service";

// How long synced GitHub stats are considered fresh (skip re-sync unless forced).
const STALE_MS = 12 * 60 * 60 * 1000;

type GithubBlockRow = {
  id: string;
  type: string;
  data: Record<string, any> | null;
};

type GithubQuery = {
  from: (table: string) => {
    select: (cols: string) => any;
    update: (patch: Record<string, unknown>) => any;
  };
};

export async function syncGitHubBlocks(
  supabase: GithubQuery,
  userId: string,
  opts: { blockId?: string; force?: boolean } = {}
): Promise<{ updated: Array<{ id: string; stats: GitHubStats }> }> {
  let query = supabase
    .from("blocks")
    .select("id, type, data")
    .eq("user_id", userId)
    .eq("type", "github");

  if (opts.blockId) query = query.eq("id", opts.blockId);

  const { data: blocks, error: fetchError } = await query;
  if (fetchError) {
    console.error("[github/sync] fetch blocks error:", fetchError);
    throw new Error("Error al leer bloques");
  }

  const updated: Array<{ id: string; stats: GitHubStats }> = [];
  const now = Date.now();

  for (const block of (blocks || []) as GithubBlockRow[]) {
    const data = block.data || {};
    const handle: string | undefined = data.username;
    if (!handle) continue;

    const existing = data.stats;

    if (!opts.force && statsAreMeaningful(existing) && existing?.syncedAt) {
      const age = now - new Date(existing.syncedAt).getTime();
      if (Number.isFinite(age) && age < STALE_MS) continue;
    }

    const result = await fetchGitHubStats(handle);
    if (!result) continue;

    if (!statsAreMeaningful(result.stats) && statsAreMeaningful(existing)) continue;

    const newStats = result.stats;
    const newData = { ...data, stats: newStats };

    const { error: updateError } = await supabase
      .from("blocks")
      .update({ data: newData })
      .eq("id", block.id)
      .eq("user_id", userId);

    if (updateError) {
      console.error("[github/sync] update error:", updateError);
      continue;
    }

    updated.push({ id: block.id, stats: newStats });
  }

  return { updated };
}
