import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { currentLaunchWeek, compareWeeks } from "@/lib/launch-week";
import { hiResFaviconUrl } from "@/lib/favicon";

export interface LaunchFeedItem {
  id: string;
  blockId: string;
  userId: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  stack: string[];
  status: string | null;
  launch: { total: number; live: number; submitted: number } | null;
  upvoteCount: number;
  featured: boolean;
  launchedAt: string;
  user: {
    username: string;
    name: string;
    image: string | null;
    pro: boolean;
    builderScore: number;
  };
}

function isMissingTable(err: any): boolean {
  return !!err && (err.code === "42P01" || /relation .* does not exist/i.test(err.message || ""));
}

/** All launches for a given week, ranked, plus which the viewer has upvoted. */
export async function getWeekLaunches(
  week: string,
  viewerId?: string | null
): Promise<{ launches: LaunchFeedItem[]; votedIds: string[] }> {
  const db = createServiceRoleClient();

  const { data: rows, error } = await db
    .from("project_launches")
    .select("id, block_id, user_id, upvote_count, featured, launched_at")
    .eq("launch_week", week);

  if (error) {
    if (isMissingTable(error)) return { launches: [], votedIds: [] };
    throw error;
  }
  if (!rows || rows.length === 0) return { launches: [], votedIds: [] };

  const blockIds = rows.map((r) => r.block_id);
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const [{ data: blocks }, { data: profiles }] = await Promise.all([
    db.from("blocks").select("id, data").in("id", blockIds),
    db
      .from("profiles")
      .select("id, username, name, image, subscription_tier, pro_since, builder_score")
      .in("id", userIds),
  ]);

  const blockById = new Map((blocks || []).map((b: any) => [b.id, b]));
  const profById = new Map((profiles || []).map((p: any) => [p.id, p]));

  let votedIds: string[] = [];
  if (viewerId) {
    const { data: votes } = await db
      .from("project_upvotes")
      .select("project_launch_id")
      .eq("voter_id", viewerId)
      .in("project_launch_id", rows.map((r) => r.id));
    votedIds = (votes || []).map((v: any) => v.project_launch_id);
  }

  const items = rows
    .map((r): LaunchFeedItem | null => {
      const b = blockById.get(r.block_id);
      const p = profById.get(r.user_id);
      if (!b || !p) return null;
      const d = b.data || {};
      return {
        id: r.id,
        blockId: r.block_id,
        userId: r.user_id,
        title: d.title || "Proyecto",
        description: d.description || "",
        imageUrl:
          d.imageMode === "favicon"
            ? hiResFaviconUrl(d.link, d.faviconUrl)
            : d.imageUrl || "",
        link: d.link || "",
        stack: Array.isArray(d.stack) ? d.stack : [],
        status: d.status || null,
        launch: d.launch || null,
        upvoteCount: r.upvote_count || 0,
        featured: !!r.featured,
        launchedAt: r.launched_at,
        user: {
          username: p.username,
          name: p.name || p.username,
          image: p.image || null,
          pro: p.subscription_tier === "pro" || !!p.pro_since,
          builderScore: p.builder_score || 0,
        },
      };
    })
    .filter((x): x is LaunchFeedItem => x !== null);

  items.sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      b.upvoteCount - a.upvoteCount ||
      (b.launch?.live || 0) - (a.launch?.live || 0) ||
      b.user.builderScore - a.user.builderScore ||
      (b.launchedAt > a.launchedAt ? 1 : -1)
  );

  return { launches: items, votedIds };
}

export type CreateLaunchResult =
  | { ok: true; launchId: string }
  | { ok: false; error: "not_owner" | "no_link" | "already_launched" | "missing_table" };

/** Create a launch row for a project block in a given week. */
export async function createLaunch(
  blockId: string,
  userId: string,
  week: string,
  isPro: boolean
): Promise<CreateLaunchResult> {
  const db = createServiceRoleClient();

  const { data: block, error: be } = await db
    .from("blocks")
    .select("id, user_id, type, data")
    .eq("id", blockId)
    .single();
  if (be || !block) return { ok: false, error: "not_owner" };
  if (block.user_id !== userId || block.type !== "project") return { ok: false, error: "not_owner" };

  const link = (block.data?.link || "").trim();
  if (!/^https?:\/\//i.test(link)) return { ok: false, error: "no_link" };

  const scheduled = compareWeeks(week, currentLaunchWeek()) > 0;

  const { data: inserted, error } = await db
    .from("project_launches")
    .insert({ block_id: blockId, user_id: userId, launch_week: week, scheduled, featured: isPro })
    .select("id")
    .single();

  if (error) {
    if (isMissingTable(error)) return { ok: false, error: "missing_table" };
    if (error.code === "23505") return { ok: false, error: "already_launched" };
    throw error;
  }
  return { ok: true, launchId: inserted.id };
}
