import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getProfileBadges } from "@/lib/profile-badges";
import {
  getAdjustedAccentColor,
  MAX_FREE_BLOCKS,
  type BlockData,
  type ProfileBadge,
} from "@/lib/profile-types";
import { hasProAccess } from "@/lib/pro-access";
import { getCurrentWeek, getWeekString } from "@/lib/showcase-service";

export interface LabProfile {
  username: string;
  displayName: string;
  tagline: string;
  avatarUrl: string;
  accentColor: string;
  borderRadius: string;
  subscriptionTier: "free" | "pro";
  builderScore: number;
  followers: number;
  following: number;
  nominations: number;
  winnerWeek: string | null;
  isWinner: boolean;
  notaHref: string | null;
  badges: ProfileBadge[];
  blocks: BlockData[];
  subSites: { id: string; title: string; slug: string; description?: string; avatarUrl?: string }[];
  showEcosystem: boolean;
}

const PROFILE_COLS = [
  "id",
  "username",
  "name",
  "tagline",
  "image",
  "github_handle",
  "accent_color",
  "border_radius",
  "subscription_tier",
  "pro_since",
  "extra_blocks_from_share",
  "twitter_share_unlocked",
  "builder_score",
  "updated_at",
  "pro_referrals_count",
  "referral_reward_expires_at",
  "is_profile_verified",
  "free_trial_claimed_at",
  "free_trial_started_at",
  "free_trial_ends_at",
  "free_trial_last_insights_viewed_at",
].join(",");

function publicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

function fold(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

async function visibleProfileText(username: string): Promise<string> {
  try {
    const res = await fetch(`https://huevsite.io/${username}`, {
      cache: "no-store",
      headers: { "Accept-Language": "es-AR,es;q=0.9", "User-Agent": "huevsite-lab" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ");
  } catch {
    return "";
  }
}

function blockTitle(block: { type?: string; data?: { name?: string; title?: string } }): string {
  const data = block.data || {};
  return (block.type === "hero" ? data.name : data.title) || "";
}

/**
 * El board publicado vive en una columna que el rol anónimo no puede leer.
 * Elegimos el board cuyos títulos aparecen en el HTML público ya renderizado.
 */
function pickBoard(
  blocks: { type?: string; board_index?: number | null; data?: { name?: string; title?: string } }[],
  visibleText: string,
  displayName: string
): number {
  const boards = Array.from(new Set(blocks.map((block) => block.board_index ?? 0)));
  if (boards.length <= 1) return boards[0] ?? 0;

  const foldedName = fold(displayName);
  const foldedText = fold(visibleText);
  let best = boards[0];
  let bestScore = -1;

  for (const board of boards) {
    const mine = blocks.filter((block) => (block.board_index ?? 0) === board);
    let score = 0;
    for (const block of mine) {
      const title = blockTitle(block).trim();
      if (title.length < 4) continue;
      if (visibleText.includes(title)) score += block.type === "hero" ? 5 : 1;
      if (block.type === "hero" && foldedName && fold(title).includes(foldedName)) score += 4;
    }
    if (foldedText && mine.some((block) => block.type === "hero" && fold(blockTitle(block)) === foldedName)) {
      score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = board;
    }
  }

  return best;
}

async function countOf(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: string,
  extra?: { column: string; value: string }
): Promise<number> {
  let query = supabase.from(table).select("id", { count: "exact", head: true }).eq(column, value);
  if (extra) query = query.eq(extra.column, extra.value);
  const { count } = await query;
  return count || 0;
}

function mapBlocks(rows: any[], pro: boolean): BlockData[] {
  return (rows || [])
    .map((row) => {
      const data = row.data || {};
      const { id: _id, type: _type, order: _order, col_span: _col, row_span: _row, visible: _visible, ...rest } = data;
      return {
        ...rest,
        id: row.id,
        type: row.type,
        order: row.order,
        col_span: row.col_span,
        row_span: row.row_span,
        visible: row.visible,
        mobileOrder: row.mobile_order ?? null,
        visibleOn: pro ? row.visible_on || "both" : "both",
      };
    })
    .filter((block) => !(block.type === "project" && (block as { archived?: boolean }).archived === true)) as BlockData[];
}

export async function loadLabProfile(username: string): Promise<LabProfile | null> {
  const supabase = publicClient();
  if (!supabase) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("username", username)
    .maybeSingle();

  if (error || !profile) return null;
  const row = profile as any;

  const fullBlocks = await (async () => {
    const withMobile = await supabase
      .from("blocks")
      .select("id,type,order,col_span,row_span,visible,board_index,mobile_order,visible_on,data")
      .eq("user_id", row.id)
      .is("sub_site_id", null)
      .eq("visible", true)
      .order("order", { ascending: true });
    if (!withMobile.error) return withMobile.data || [];
    const legacy = await supabase
      .from("blocks")
      .select("id,type,order,col_span,row_span,visible,board_index,data")
      .eq("user_id", row.id)
      .is("sub_site_id", null)
      .eq("visible", true)
      .order("order", { ascending: true });
    return legacy.data || [];
  })();

  const visibleText = await visibleProfileText(username);
  const displayName = row.name || row.username;
  const board = pickBoard(fullBlocks, visibleText, displayName);
  const boardRows = fullBlocks.filter((row) => (row.board_index ?? 0) === board);

  const pro = hasProAccess(row);
  let blocks = mapBlocks(boardRows, pro);
  blocks = blocks.map((block) =>
    block.type === "hero" ? { ...block, avatarUrl: row.image || "" } : block
  );
  const badgeBlockCount = blocks.length;

  if (!pro) {
    const limit = MAX_FREE_BLOCKS + (row.extra_blocks_from_share || 0);
    if (blocks.length > limit) blocks = blocks.slice(0, limit);
  }

  const currentWeek = getCurrentWeek();
  const prevWeek = getWeekString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  const [
    followers,
    following,
    nominations,
    userWin,
    windowWin,
    nota,
    subSitesResult,
  ] = await Promise.all([
    countOf(supabase, "follows", "following_id", row.id),
    countOf(supabase, "follows", "follower_id", row.id),
    countOf(supabase, "showcase_nominations", "user_id", row.id, { column: "week", value: currentWeek }),
    supabase
      .from("showcase_winners")
      .select("week")
      .eq("user_id", row.id)
      .order("week", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("showcase_winners")
      .select("week")
      .in("week", [currentWeek, prevWeek])
      .order("week", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("blog_posts")
      .select("slug,tags")
      .eq("author_username", username)
      .eq("is_published", true)
      .order("date", { ascending: false })
      .limit(8),
    supabase
      .from("sub_sites")
      .select("id,title,description,slug,avatar_url")
      .eq("user_id", row.id)
      .order("created_at", { ascending: false }),
  ]);

  const winnerWeek = (userWin.data as { week?: string } | null)?.week || null;
  const windowWeek = (windowWin.data as { week?: string } | null)?.week || null;
  const badges = getProfileBadges(row, {
    blockCount: badgeBlockCount,
    hasWonBuilderOfTheWeek: !!winnerWeek,
    blocks,
  });

  const notaRow = ((nota.data || []) as { slug?: string; tags?: string[] }[]).find((post) => {
    const slug = post.slug || "";
    const tags = post.tags || [];
    return slug.startsWith("builder-de-la-semana-") || tags.includes("builder-de-la-semana");
  });

  const showEcosystem = /Ecosistema|Ecosystem/.test(visibleText);
  const subSites = showEcosystem
    ? ((subSitesResult.data || []) as { id: string; title: string; description?: string | null; slug: string; avatar_url?: string | null }[]).map(
        (site) => ({
          id: site.id,
          title: site.title,
          slug: site.slug,
          description: site.description || undefined,
          avatarUrl: site.avatar_url || undefined,
        })
      )
    : [];

  const tier: "free" | "pro" =
    row.subscription_tier === "pro" || row.pro_since ? "pro" : "free";

  return {
    username: row.username,
    displayName,
    tagline: row.tagline || "",
    avatarUrl: row.image || "",
    accentColor: getAdjustedAccentColor(row.accent_color),
    borderRadius: row.border_radius || "1.5rem",
    subscriptionTier: tier,
    builderScore: row.builder_score || 0,
    followers,
    following,
    nominations,
    winnerWeek,
    isWinner: !!winnerWeek && winnerWeek === windowWeek,
    notaHref: notaRow?.slug ? `/blog/${notaRow.slug}` : null,
    badges,
    blocks,
    subSites,
    showEcosystem,
  };
}
