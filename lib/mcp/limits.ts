import { MAX_FREE_BLOCKS, MAX_PRO_BLOCKS } from "@/lib/profile-types";
import { hasProAccess } from "@/lib/pro-access";

export const MCP_MAX_ACTIVE_TOKENS = 5;
export const MCP_FREE_CALLS_PER_HOUR = 60;
export const MCP_PRO_CALLS_PER_HOUR = 600;
export const MCP_BURST_PER_MINUTE = 40;
export const MCP_AUTH_FAILS_PER_WINDOW = 20;
export const MCP_HOUR_MS = 60 * 60 * 1000;
export const MCP_AUTH_WINDOW_MS = 10 * 60 * 1000;

type AccessProfile = {
  subscription_tier?: string | null;
  pro_since?: string | null;
  referral_reward_expires_at?: string | null;
  free_trial_ends_at?: string | null;
};

export function mcpHourlyLimit(profile: AccessProfile | null | undefined): number {
  return profile && hasProAccess(profile) ? MCP_PRO_CALLS_PER_HOUR : MCP_FREE_CALLS_PER_HOUR;
}

export function mcpCallAllowed(countInWindow: number, limit: number): boolean {
  return countInWindow < limit;
}

export function mcpBatchAllowed(countInWindow: number, incoming: number, limit: number): boolean {
  return countInWindow + incoming <= limit;
}

// Same visible-block cap the dashboard POST /api/blocks enforces.
export function effectiveBlockLimit(profile: {
  subscription_tier?: string | null;
  pro_since?: string | null;
  referral_reward_expires_at?: string | null;
  free_trial_ends_at?: string | null;
  extra_blocks_from_share?: number | null;
} | null): number {
  if (profile && hasProAccess(profile)) return MAX_PRO_BLOCKS;
  return MAX_FREE_BLOCKS + (profile?.extra_blocks_from_share || 0);
}

// Builders Hunt launch gate, copied from POST /api/launches.
// Trial and referral Pro do not lift the monthly launch cap there.
export function launchPlanIsPro(profile: {
  subscription_tier?: string | null;
  pro_since?: string | null;
} | null): boolean {
  return profile?.subscription_tier === "pro" || !!profile?.pro_since;
}
