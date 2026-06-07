// lib/github-service.ts
//
// Single source of truth for fetching a GitHub user's PUBLIC stats.
//
// Prefers an authenticated GraphQL request (env GITHUB_TOKEN), which returns the
// real contribution calendar (heatmap) and per-month commit counts in ONE call,
// and is rate-limited at 5,000 req/h instead of the 60 req/h that the old
// unauthenticated REST fan-out kept hitting (the root cause of "all metrics at
// zero"). Falls back to a light unauthenticated REST request for basic stats.
//
// GOLDEN RULE: on any failure this returns `null`. Callers MUST keep existing
// data when this returns null — never overwrite good stats with zeros.

const GRAPHQL_URL = "https://api.github.com/graphql";
const REST_BASE = "https://api.github.com";

export interface GitHubLanguage {
  name: string;
  percent: number;
}

export interface GitHubTopRepo {
  name: string;
  stars: number;
  description: string;
}

export interface GitHubStats {
  stars: number;
  repos: number;
  followers: number;
  topLanguages: GitHubLanguage[];
  heatmap: number[]; // up to 182 daily values, scaled 0-4
  commitsByMonth: Array<{ month: string; count: number }>; // month = "YYYY-MM", ascending
  commitsThisYear: number;
  totalCommits: number; // alias of commitsThisYear (block UI label "Commits / Year")
  pullRequests: number;
  syncedAt: string; // ISO timestamp of this successful fetch
}

export interface GitHubProfile {
  username: string;
  avatarUrl: string;
  name: string;
  bio: string;
  topRepos: GitHubTopRepo[];
  languages: string[]; // names only (onboarding compatibility)
}

export interface GitHubFetchResult {
  stats: GitHubStats;
  profile: GitHubProfile;
}

const HEATMAP_DAYS = 182;
const NAV_MONTHS = 12;

/** Scale a raw daily contribution count to the 0-4 heatmap intensity buckets. */
function scaleContribution(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

/** Last N calendar months (UTC), ascending (oldest first). */
function lastNMonths(n: number): Array<{ key: string; from: string; to: string }> {
  const out: Array<{ key: string; from: string; to: string }> = [];
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth(); // 0-11

  for (let i = 0; i < n; i++) {
    const from = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)); // day 0 of next month = last day
    out.push({
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  return out.reverse();
}

function buildLanguages(
  rawCounts: Record<string, number>,
  topN: number
): GitHubLanguage[] {
  const top = Object.entries(rawCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN);
  const sum = top.reduce((acc, [, c]) => acc + c, 0) || 1;
  return top.map(([name, c]) => ({
    name,
    percent: Math.max(1, Math.round((c / sum) * 100)),
  }));
}

interface GraphQLRepoNode {
  name: string;
  description: string | null;
  stargazerCount: number;
  primaryLanguage: { name: string } | null;
}

interface GraphQLDay {
  date: string;
  contributionCount: number;
}

/** Authenticated GraphQL fetch — full data set in a single request. */
async function fetchViaGraphQL(
  handle: string,
  token: string
): Promise<GitHubFetchResult | null> {
  const months = lastNMonths(NAV_MONTHS);

  const monthAliases = months
    .map(
      (m, i) =>
        `m${i}: contributionsCollection(from: "${m.from}", to: "${m.to}") { totalCommitContributions }`
    )
    .join("\n");

  const query = `
    query($login: String!) {
      user(login: $login) {
        login
        name
        bio
        avatarUrl
        followers { totalCount }
        repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
          totalCount
          nodes {
            name
            description
            stargazerCount
            primaryLanguage { name }
          }
        }
        contributionsCollection {
          totalPullRequestContributions
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
        ${monthAliases}
      }
    }
  `;

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: handle } }),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`[github-service] GraphQL HTTP ${res.status} for ${handle}`);
    return null;
  }

  const json = await res.json();
  const user = json?.data?.user;
  if (!user) {
    // user not found, or GraphQL errors
    if (json?.errors) console.error("[github-service] GraphQL errors:", json.errors);
    return null;
  }

  const nodes: GraphQLRepoNode[] = user.repositories?.nodes || [];

  const stars = nodes.reduce((acc, r) => acc + (r.stargazerCount || 0), 0);
  const repos = user.repositories?.totalCount || nodes.length;
  const followers = user.followers?.totalCount || 0;

  const langCounts: Record<string, number> = {};
  nodes.forEach((r) => {
    const name = r.primaryLanguage?.name;
    if (name) langCounts[name] = (langCounts[name] || 0) + 1;
  });

  const topRepos: GitHubTopRepo[] = nodes.slice(0, 3).map((r) => ({
    name: r.name,
    stars: r.stargazerCount || 0,
    description: r.description || "",
  }));

  // Heatmap from the real contribution calendar (last HEATMAP_DAYS days).
  const days: GraphQLDay[] = (
    user.contributionsCollection?.contributionCalendar?.weeks || []
  ).flatMap((w: { contributionDays: GraphQLDay[] }) => w.contributionDays || []);
  days.sort((a, b) => (a.date < b.date ? -1 : 1));
  const heatmap = days
    .slice(-HEATMAP_DAYS)
    .map((d) => scaleContribution(d.contributionCount || 0));

  // Per-month commit counts from the aliased contributionsCollection blocks.
  const commitsByMonth = months.map((m, i) => ({
    month: m.key,
    count: user[`m${i}`]?.totalCommitContributions || 0,
  }));
  const commitsThisYear = commitsByMonth.reduce((acc, m) => acc + m.count, 0);
  const pullRequests =
    user.contributionsCollection?.totalPullRequestContributions || 0;

  const syncedAt = new Date().toISOString();

  return {
    stats: {
      stars,
      repos,
      followers,
      topLanguages: buildLanguages(langCounts, 3),
      heatmap,
      commitsByMonth,
      commitsThisYear,
      totalCommits: commitsThisYear,
      pullRequests,
      syncedAt,
    },
    profile: {
      username: user.login || handle,
      avatarUrl: user.avatarUrl || "",
      name: user.name || user.login || handle,
      bio: user.bio || "",
      topRepos,
      languages: Object.keys(langCounts).slice(0, 5),
    },
  };
}

interface RestRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
}

/**
 * Light unauthenticated REST fallback for basic stats only (no heatmap /
 * commits). Used when GITHUB_TOKEN is absent or GraphQL fails. Best-effort —
 * subject to the 60 req/h limit, so it can still fail (returns null then).
 */
async function fetchViaREST(handle: string): Promise<GitHubFetchResult | null> {
  const headers = { Accept: "application/vnd.github.v3+json" };

  const userRes = await fetch(`${REST_BASE}/users/${handle}`, {
    headers,
    cache: "no-store",
  });
  if (!userRes.ok) {
    console.error(`[github-service] REST user HTTP ${userRes.status} for ${handle}`);
    return null;
  }
  const userData = await userRes.json();

  const reposRes = await fetch(
    `${REST_BASE}/users/${handle}/repos?type=owner&per_page=100&sort=updated`,
    { headers, cache: "no-store" }
  );
  const repos: RestRepo[] = reposRes.ok ? await reposRes.json() : [];
  const ownRepos = Array.isArray(repos) ? repos.filter((r) => !r.fork) : [];

  const stars = ownRepos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);

  const langCounts: Record<string, number> = {};
  ownRepos.forEach((r) => {
    if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  });

  const topRepos: GitHubTopRepo[] = [...ownRepos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 3)
    .map((r) => ({
      name: r.name,
      stars: r.stargazers_count || 0,
      description: r.description || "",
    }));

  const syncedAt = new Date().toISOString();

  return {
    stats: {
      stars,
      repos: userData.public_repos || ownRepos.length,
      followers: userData.followers || 0,
      topLanguages: buildLanguages(langCounts, 3),
      heatmap: [], // not available without GraphQL
      commitsByMonth: [],
      commitsThisYear: 0,
      totalCommits: 0,
      pullRequests: 0,
      syncedAt,
    },
    profile: {
      username: userData.login || handle,
      avatarUrl: userData.avatar_url || "",
      name: userData.name || userData.login || handle,
      bio: userData.bio || "",
      topRepos,
      languages: Object.keys(langCounts).slice(0, 5),
    },
  };
}

/**
 * Fetch a GitHub user's public stats. Returns `null` on any failure — callers
 * must keep existing data rather than overwrite with zeros.
 */
export async function fetchGitHubStats(
  handle: string | null | undefined
): Promise<GitHubFetchResult | null> {
  const clean = handle?.trim().replace(/^@/, "");
  if (!clean) return null;

  const token = process.env.GITHUB_TOKEN;

  if (token) {
    try {
      const result = await fetchViaGraphQL(clean, token);
      if (result) return result;
    } catch (e) {
      console.error("[github-service] GraphQL failed, falling back to REST:", e);
    }
  } else {
    console.warn(
      "[github-service] GITHUB_TOKEN not set — using unauthenticated REST fallback (rate-limited, no heatmap/commits)."
    );
  }

  try {
    return await fetchViaREST(clean);
  } catch (e) {
    console.error("[github-service] REST fallback failed:", e);
    return null;
  }
}

/**
 * True when stats came from a successful real sync via the new service: they
 * carry a sync timestamp AND a populated contribution heatmap (which only the
 * authenticated GraphQL path produces). Legacy/partial blocks — old import or
 * onboarding without stats — pass `statsAreMeaningful` (they have repos) but
 * fail this, because they lack the real heatmap + per-month commits. Use this
 * (not `statsAreMeaningful`) to decide whether a block still needs a backfill.
 */
export function statsAreComplete(
  stats:
    | {
        syncedAt?: string;
        heatmap?: unknown[];
      }
    | null
    | undefined
): boolean {
  if (!stats) return false;
  return (
    !!stats.syncedAt &&
    Array.isArray(stats.heatmap) &&
    stats.heatmap.length > 0
  );
}

/** True when stats carry real signal (used to decide whether to overwrite). */
export function statsAreMeaningful(
  stats:
    | {
        stars?: number;
        repos?: number;
        followers?: number;
        topLanguages?: unknown[];
      }
    | null
    | undefined
): boolean {
  if (!stats) return false;
  return (
    (stats.repos || 0) > 0 ||
    (stats.followers || 0) > 0 ||
    (stats.stars || 0) > 0 ||
    (stats.topLanguages?.length || 0) > 0
  );
}
