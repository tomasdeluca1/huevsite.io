import type { CreateLaunchResult } from "@/lib/launch-service";

export type McpProfile = {
  id: string;
  username: string | null;
  name: string | null;
  tagline: string | null;
  image: string | null;
  github_handle: string | null;
  accent_color: string | null;
  border_radius: string | null;
  layout: string | null;
  profile_layout: string | null;
  link_box_style: string | null;
  roles: string[] | null;
  location: string | null;
  country: string | null;
  available: boolean | null;
  subscription_tier: string | null;
  pro_since: string | null;
  referral_reward_expires_at: string | null;
  free_trial_claimed_at: string | null;
  free_trial_started_at: string | null;
  free_trial_ends_at: string | null;
  free_trial_last_insights_viewed_at: string | null;
  extra_blocks_from_share: number | null;
  builder_score: number | null;
  published_board: number | null;
};

export type McpBlock = {
  id: string;
  user_id: string;
  type: string;
  data: Record<string, unknown>;
  visible: boolean;
  sub_site_id: string | null;
  board_index: number;
  order: number;
  col_span: number;
  row_span: number;
  created_at: string;
};

export type McpNewBlock = {
  type: string;
  data: Record<string, unknown>;
  boardIndex: number;
  colSpan: number;
  rowSpan: number;
};

export interface McpStore {
  getProfile(userId: string): Promise<McpProfile | null>;
  updateProfile(userId: string, patch: Record<string, unknown>): Promise<void>;
  listMainBlocks(userId: string): Promise<McpBlock[]>;
  countVisibleMainBlocks(userId: string, boardIndex: number): Promise<number>;
  insertBlock(userId: string, input: McpNewBlock): Promise<McpBlock>;
  updateBlockData(userId: string, blockId: string, data: Record<string, unknown>): Promise<McpBlock | null>;
  deleteProject(userId: string, blockId: string): Promise<boolean>;
  insertActivity(userId: string, type: string, data: Record<string, unknown>): Promise<{ id: string; created_at: string }>;
  createLaunch(blockId: string, userId: string, week: string, isPro: boolean): Promise<CreateLaunchResult>;
  syncGithub(userId: string, opts: { blockId?: string; force?: boolean }): Promise<{ updated: Array<{ id: string }> }>;
  recomputeScore(userId: string): Promise<void>;
}

export type ToolSuccess = { ok: true; data: Record<string, unknown> };
export type ToolFailure = { ok: false; error: string; message: string };
export type ToolOutcome = ToolSuccess | ToolFailure;

export function toolError(error: string, message: string): ToolFailure {
  return { ok: false, error, message };
}
