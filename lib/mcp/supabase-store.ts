import { createLaunch } from "@/lib/launch-service";
import { syncGitHubBlocks } from "@/lib/github-sync";
import { scoreService } from "@/lib/score-service";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { McpBlock, McpNewBlock, McpProfile, McpStore } from "@/lib/mcp/types";

const PROFILE_COLS =
  "id, username, name, tagline, image, github_handle, accent_color, border_radius, layout, profile_layout, link_box_style, roles, location, country, available, subscription_tier, pro_since, referral_reward_expires_at, free_trial_claimed_at, free_trial_started_at, free_trial_ends_at, free_trial_last_insights_viewed_at, extra_blocks_from_share, builder_score, published_board";

function mapProfile(row: Record<string, any>): McpProfile {
  return {
    id: row.id,
    username: row.username ?? null,
    name: row.name ?? null,
    tagline: row.tagline ?? null,
    image: row.image ?? null,
    github_handle: row.github_handle ?? null,
    accent_color: row.accent_color ?? null,
    border_radius: row.border_radius ?? null,
    layout: row.layout ?? null,
    profile_layout: row.profile_layout ?? "portfolio",
    link_box_style: row.link_box_style ?? "pill",
    roles: Array.isArray(row.roles) ? row.roles : null,
    location: row.location ?? null,
    country: row.country ?? null,
    available: row.available ?? null,
    subscription_tier: row.subscription_tier ?? null,
    pro_since: row.pro_since ?? null,
    referral_reward_expires_at: row.referral_reward_expires_at ?? null,
    free_trial_claimed_at: row.free_trial_claimed_at ?? null,
    free_trial_started_at: row.free_trial_started_at ?? null,
    free_trial_ends_at: row.free_trial_ends_at ?? null,
    free_trial_last_insights_viewed_at: row.free_trial_last_insights_viewed_at ?? null,
    extra_blocks_from_share: row.extra_blocks_from_share ?? 0,
    builder_score: row.builder_score ?? 0,
    published_board: row.published_board ?? 0,
  };
}

function mapBlock(row: Record<string, any>): McpBlock {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    data: row.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data : {},
    visible: row.visible !== false,
    sub_site_id: row.sub_site_id ?? null,
    board_index: row.board_index ?? 0,
    order: row.order ?? 0,
    col_span: row.col_span ?? 1,
    row_span: row.row_span ?? 1,
    created_at: row.created_at,
  };
}

export function createSupabaseMcpStore(): McpStore {
  const db = createServiceRoleClient();

  return {
    async getProfile(userId) {
      // profile_layout y link_box_style llegan con 20261110200000. Si esa
      // migración todavía no está, el SELECT falla y reintentamos sin ellas.
      const legacyCols = PROFILE_COLS.replace(", profile_layout, link_box_style", "");
      const first = await db.from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle();
      const retry = first.error
        ? await db.from("profiles").select(legacyCols).eq("id", userId).maybeSingle()
        : first;
      const data = retry.data as Record<string, any> | null;
      const error = retry.error;
      if (error) {
        console.error("[mcp] getProfile", error.message);
        throw new Error("No se pudo leer el perfil.");
      }
      return data ? mapProfile(data) : null;
    },

    async updateProfile(userId, patch) {
      const { country, ...rest } = patch;
      if (Object.keys(rest).length > 0) {
        const { error } = await db.from("profiles").update(rest).eq("id", userId);
        if (error) {
          console.error("[mcp] updateProfile", error.message);
          throw new Error("No se pudo actualizar el perfil.");
        }
      }
      if (country !== undefined) {
        const { error } = await db.from("profiles").update({ country }).eq("id", userId);
        if (error) console.warn("[mcp] country update skipped:", error.message);
      }
    },

    async listMainBlocks(userId) {
      const { data, error } = await db
        .from("blocks")
        .select("id, user_id, type, data, visible, sub_site_id, board_index, order, col_span, row_span, created_at")
        .eq("user_id", userId)
        .is("sub_site_id", null)
        .order("order", { ascending: true });
      if (error) {
        console.error("[mcp] listBlocks", error.message);
        throw new Error("No se pudieron leer los bloques.");
      }
      return (data || []).map(mapBlock);
    },

    async countVisibleMainBlocks(userId, boardIndex) {
      const run = (withBoard: boolean) => {
        let query = db
          .from("blocks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("visible", true)
          .is("sub_site_id", null);
        if (withBoard) query = query.eq("board_index", boardIndex);
        return query;
      };
      let { count, error } = await run(true);
      if (error && /board_index/i.test(error.message || "")) {
        ({ count, error } = await run(false));
      }
      if (error) {
        console.error("[mcp] countBlocks", error.message);
        throw new Error("No se pudo contar los bloques.");
      }
      return count || 0;
    },

    async insertBlock(userId, input: McpNewBlock) {
      const { data: last } = await db
        .from("blocks")
        .select("order")
        .eq("user_id", userId)
        .order("order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const order = last ? Number(last.order) + 1 : 0;
      const row = {
        user_id: userId,
        type: input.type,
        data: input.data,
        order,
        col_span: input.colSpan,
        row_span: input.rowSpan,
        visible: true,
        sub_site_id: null,
        board_index: input.boardIndex,
      };
      let { data, error } = await db.from("blocks").insert(row).select("*").single();
      if (error && /board_index/i.test(error.message || "")) {
        const { board_index: _omit, ...legacy } = row;
        ({ data, error } = await db.from("blocks").insert(legacy).select("*").single());
      }
      if (error || !data) {
        console.error("[mcp] insertBlock", error?.message);
        throw new Error("No se pudo crear el bloque.");
      }
      return mapBlock(data);
    },

    async updateBlockData(userId, blockId, data) {
      const { data: row, error } = await db
        .from("blocks")
        .update({ data })
        .eq("id", blockId)
        .eq("user_id", userId)
        .is("sub_site_id", null)
        .select("*")
        .maybeSingle();
      if (error) {
        console.error("[mcp] updateBlock", error.message);
        throw new Error("No se pudo actualizar el bloque.");
      }
      return row ? mapBlock(row) : null;
    },

    async updateBlockLayout(userId, blockId, patch) {
      const row: Record<string, unknown> = {};
      for (const key of ["order", "col_span", "row_span", "visible"] as const) {
        if (patch[key] !== undefined) row[key] = patch[key];
      }
      if (Object.keys(row).length === 0) return null;
      const { data, error } = await db
        .from("blocks")
        .update(row)
        .eq("id", blockId)
        .eq("user_id", userId)
        .is("sub_site_id", null)
        .select("*")
        .maybeSingle();
      if (error) {
        console.error("[mcp] updateBlockLayout", error.message);
        throw new Error("No se pudo acomodar el bloque.");
      }
      return data ? mapBlock(data) : null;
    },

    async deleteProject(userId, blockId) {
      const { data, error } = await db
        .from("blocks")
        .delete()
        .eq("id", blockId)
        .eq("user_id", userId)
        .eq("type", "project")
        .is("sub_site_id", null)
        .select("id");
      if (error) {
        console.error("[mcp] deleteProject", error.message);
        throw new Error("No se pudo borrar el proyecto.");
      }
      return (data || []).length > 0;
    },

    async insertActivity(userId, type, data) {
      const { data: row, error } = await db
        .from("activities")
        .insert({ user_id: userId, type, data })
        .select("id, created_at")
        .single();
      if (error || !row) {
        console.error("[mcp] activity", error?.message);
        throw new Error("No se pudo registrar la actividad.");
      }
      return { id: row.id, created_at: row.created_at };
    },

    createLaunch(blockId, userId, week, isPro) {
      return createLaunch(blockId, userId, week, isPro);
    },

    async syncGithub(userId, opts) {
      const result = await syncGitHubBlocks(db as any, userId, opts);
      return { updated: result.updated.map((row) => ({ id: row.id })) };
    },

    async recomputeScore(userId) {
      await scoreService.recomputeScore(userId);
    },
  };
}
