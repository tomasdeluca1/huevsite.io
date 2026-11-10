// Personal MCP tokens. Null expires_at means the token never expires.
// Existing rows stay null, so they keep reading as "Nunca".

export const MCP_TOKEN_TTLS = ["30d", "90d", "never"] as const;
export type McpTokenTtl = (typeof MCP_TOKEN_TTLS)[number];
export const MCP_TOKEN_TTL_DEFAULT: McpTokenTtl = "90d";

const DAY_MS = 24 * 60 * 60 * 1000;

const TTL_MS: Record<McpTokenTtl, number | null> = {
  "30d": 30 * DAY_MS,
  "90d": 90 * DAY_MS,
  never: null,
};

export function parseMcpTokenTtl(value: unknown): McpTokenTtl | "invalid" {
  if (value == null) return MCP_TOKEN_TTL_DEFAULT;
  if (typeof value !== "string") return "invalid";
  return (MCP_TOKEN_TTLS as readonly string[]).includes(value) ? value as McpTokenTtl : "invalid";
}

export function mcpTokenExpiresAt(ttl: McpTokenTtl, now = Date.now()): string | null {
  const ms = TTL_MS[ttl];
  if (ms == null) return null;
  return new Date(now + ms).toISOString();
}

// A present but unparseable timestamp is treated as expired so a bad value
// cannot keep a token alive forever.
export function isMcpTokenExpired(expiresAt: string | null | undefined, now = Date.now()): boolean {
  if (expiresAt == null || expiresAt === "") return false;
  const parsed = Date.parse(expiresAt);
  if (Number.isNaN(parsed)) return true;
  return parsed <= now;
}

export function countUsableMcpTokens(
  rows: Array<{ revoked_at?: string | null; expires_at?: string | null }>,
  now = Date.now(),
): number {
  return rows.filter((row) => !row.revoked_at && !isMcpTokenExpired(row.expires_at, now)).length;
}
