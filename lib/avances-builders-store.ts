import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  launchCandidate,
  postedLogsFromRows,
  projectCandidate,
  updateCandidate,
  withAdditionalPost,
  type ActivityRow,
  type AvancesLogInsert,
  type AvancesStore,
  type LaunchRow,
  type PostedLog,
  type PublicBlock,
  type PublicProfile,
} from "@/lib/avances-builders";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Db = ReturnType<typeof createServiceRoleClient>;

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === "42P01" || /does not exist/i.test(error.message || ""));
}

async function profilesById(db: Db, ids: string[]): Promise<Map<string, PublicProfile>> {
  const unique = Array.from(new Set(ids)).filter((id) => UUID_RE.test(id));
  const map = new Map<string, PublicProfile>();
  if (unique.length === 0) return map;
  const { data, error } = await db.from("profiles").select("id, username, name").in("id", unique);
  if (error) throw error;
  for (const row of data || []) {
    map.set(row.id, { id: row.id, username: row.username, name: row.name });
  }
  return map;
}

async function blocksById(db: Db, ids: string[]): Promise<Map<string, PublicBlock>> {
  const unique = Array.from(new Set(ids)).filter((id) => UUID_RE.test(id));
  const map = new Map<string, PublicBlock>();
  if (unique.length === 0) return map;
  const { data, error } = await db
    .from("blocks")
    .select("id, user_id, type, data, visible, sub_site_id, created_at")
    .in("id", unique);
  if (error) throw error;
  for (const row of data || []) {
    map.set(row.id, {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      data: (row.data as Record<string, unknown> | null) ?? null,
      visible: row.visible,
      sub_site_id: row.sub_site_id,
      created_at: row.created_at,
    });
  }
  return map;
}

export function createSupabaseAvancesStore(): AvancesStore {
  const db = createServiceRoleClient();

  return {
    async loadCandidates(sinceIso: string) {
      const [liveLaunches, nullLaunched] = await Promise.all([
        db
          .from("project_launches")
          .select("id, block_id, user_id, upvote_count, featured, launched_at, created_at, launch_week, scheduled")
          .eq("scheduled", false)
          .gte("launched_at", sinceIso)
          .limit(200),
        db
          .from("project_launches")
          .select("id, block_id, user_id, upvote_count, featured, launched_at, created_at, launch_week, scheduled")
          .eq("scheduled", false)
          .is("launched_at", null)
          .gte("created_at", sinceIso)
          .limit(50),
      ]);

      const launches: LaunchRow[] = [];
      for (const result of [liveLaunches, nullLaunched]) {
        if (result.error) {
          if (isMissingTable(result.error)) continue;
          throw result.error;
        }
        for (const row of result.data || []) launches.push(row as LaunchRow);
      }

      const blocksQuery = await db
        .from("blocks")
        .select("id, user_id, type, data, visible, sub_site_id, created_at")
        .eq("visible", true)
        .is("sub_site_id", null)
        .in("type", ["project", "building"])
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(200);
      if (blocksQuery.error) throw blocksQuery.error;
      const newBlocks: PublicBlock[] = (blocksQuery.data || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        data: (row.data as Record<string, unknown> | null) ?? null,
        visible: row.visible,
        sub_site_id: row.sub_site_id,
        created_at: row.created_at,
      }));

      const activitiesQuery = await db
        .from("activities")
        .select("id, user_id, created_at, data")
        .eq("type", "block_update")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(400);
      if (activitiesQuery.error) throw activitiesQuery.error;
      const activities = (activitiesQuery.data || []) as ActivityRow[];

      const blockIds = [
        ...launches.map((launch) => launch.block_id),
        ...activities.map((activity) => (typeof activity.data?.blockId === "string" ? activity.data.blockId : "")),
      ];
      const blocks = await blocksById(db, blockIds);
      for (const block of newBlocks) blocks.set(block.id, block);

      const profileIds = [
        ...launches.map((launch) => launch.user_id),
        ...newBlocks.map((block) => block.user_id),
        ...activities.map((activity) => activity.user_id),
      ];
      const profiles = await profilesById(db, profileIds);

      const candidates = [];
      const seenLaunch = new Set<string>();
      for (const launch of launches) {
        if (seenLaunch.has(launch.id)) continue;
        seenLaunch.add(launch.id);
        const block = blocks.get(launch.block_id);
        const profile = profiles.get(launch.user_id);
        if (!block || !profile) continue;
        const candidate = launchCandidate(launch, block, profile);
        if (candidate) candidates.push(candidate);
      }
      for (const block of newBlocks) {
        const profile = profiles.get(block.user_id);
        if (!profile) continue;
        const candidate = projectCandidate(block, profile);
        if (candidate) candidates.push(candidate);
      }

      const seenUpdate = new Set<string>();
      for (const activity of activities) {
        const blockId = typeof activity.data?.blockId === "string" ? activity.data.blockId : "";
        if (!blockId || seenUpdate.has(blockId)) continue;
        const block = blocks.get(blockId);
        const profile = profiles.get(activity.user_id);
        if (!block || !profile) continue;
        const candidate = updateCandidate(activity, block, profile);
        if (!candidate) continue;
        seenUpdate.add(blockId);
        candidates.push(candidate);
      }
      return candidates;
    },

    async loadPosted(): Promise<PostedLog[]> {
      const { data, error } = await db
        .from("social_avances_log")
        .select("user_id, source_type, source_id, published_at, run_date, status, payload")
        .eq("status", "posted")
        .order("published_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return postedLogsFromRows(
        (data || []).map((row) => ({
          userId: row.user_id,
          sourceType: row.source_type,
          sourceId: row.source_id,
          publishedAt: row.published_at,
          runDate: row.run_date,
          status: row.status,
          payload: row.payload,
        }))
      );
    },

    async socialLinks(userId: string) {
      const { data, error } = await db
        .from("blocks")
        .select("data")
        .eq("user_id", userId)
        .eq("type", "social")
        .is("sub_site_id", null);
      if (error) throw error;
      const links: { platform?: string; url?: string }[] = [];
      for (const row of data || []) {
        const raw = (row.data as { links?: { platform?: string; url?: string }[] } | null)?.links;
        if (!Array.isArray(raw)) continue;
        for (const link of raw) links.push({ platform: link?.platform, url: link?.url });
      }
      return links;
    },

    async insertLog(row: AvancesLogInsert) {
      const { error } = await db.from("social_avances_log").insert({
        run_date: row.runDate,
        user_id: row.userId,
        builder_username: row.builderUsername,
        source_type: row.sourceType,
        source_id: row.sourceId,
        title: row.title,
        image_url: row.imageUrl,
        include_founder_cta: row.includeFounderCta,
        status: row.status,
        skip_reason: row.skipReason,
        payload: row.payload,
        published_at: row.publishedAt,
        x_result: row.xResult,
        linkedin_result: row.linkedinResult,
        instagram_result: row.instagramResult,
      });
      if (error?.code === "23505" && row.status === "posted" && row.sourceType && row.sourceId) {
        const existing = await db
          .from("social_avances_log")
          .select("id, payload")
          .eq("run_date", row.runDate)
          .eq("status", "posted")
          .maybeSingle();
        if (existing.error || !existing.data) return { ok: false as const, code: error.code };
        const { error: updateError } = await db
          .from("social_avances_log")
          .update({
            payload: withAdditionalPost(existing.data.payload, {
              sourceType: row.sourceType,
              sourceId: row.sourceId,
              userId: row.userId,
              publishedAt: row.publishedAt,
              xResult: row.xResult,
              linkedinResult: row.linkedinResult,
              instagramResult: row.instagramResult,
            }),
          })
          .eq("id", existing.data.id);
        if (updateError) return { ok: false as const, code: updateError.code || "insert_failed" };
        return { ok: true as const };
      }
      if (error) return { ok: false as const, code: error.code || "insert_failed" };
      return { ok: true as const };
    },
  };
}
