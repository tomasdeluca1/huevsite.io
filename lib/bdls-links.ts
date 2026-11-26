export interface BdlsPostRef {
  slug: string;
  tags: string[];
  author: {
    username: string;
  };
}

export interface BdlsSlugIndex {
  byWinner: Record<string, string>;
  legacyByUsername: Record<string, string>;
}

const BDLS_SLUG_WEEK_RE = /-(\d{4}-w\d{2})$/i;

export function isBdlsPost(post: Pick<BdlsPostRef, "slug" | "tags">): boolean {
  return (
    post.slug.startsWith("builder-de-la-semana-") ||
    post.tags.includes("builder-de-la-semana")
  );
}

export function extractBdlsSlugWeek(slug: string): string | null {
  const match = slug.match(BDLS_SLUG_WEEK_RE);
  return match ? match[1].toLowerCase() : null;
}

export function bdlsWinnerKey(username: string, week: string): string {
  return `${username.toLowerCase()}::${week.toLowerCase()}`;
}

export function buildBdlsSlugIndex(posts: BdlsPostRef[]): BdlsSlugIndex {
  const byWinner: Record<string, string> = {};
  const legacyByUsername: Record<string, string> = {};

  for (const p of posts) {
    if (!isBdlsPost(p)) continue;
    const username = (p.author.username || "").toLowerCase();
    if (!username) continue;

    const week = extractBdlsSlugWeek(p.slug);
    if (week) {
      const key = bdlsWinnerKey(username, week);
      if (!byWinner[key]) byWinner[key] = p.slug;
    } else if (!legacyByUsername[username]) {
      legacyByUsername[username] = p.slug;
    }
  }

  return { byWinner, legacyByUsername };
}

export function resolveBdlsSlug(
  index: BdlsSlugIndex,
  username: string,
  week: string
): string | undefined {
  const u = username.toLowerCase();
  return index.byWinner[bdlsWinnerKey(u, week)] ?? index.legacyByUsername[u];
}
