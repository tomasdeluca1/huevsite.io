import { createHash, randomBytes } from "crypto";

export const MCP_TOKEN_PREFIX = "hvst_";

// First 12 chars are safe to show in the dashboard (`hvst_` + 7).
// The rest is the secret and is never stored or logged.
export const MCP_TOKEN_VISIBLE_PREFIX = 12;

const TOKEN_RE = /^hvst_[A-Za-z0-9_-]{43,}$/;

export function generateMcpToken(): { raw: string; prefix: string; hash: string } {
  const raw = `${MCP_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return { raw, prefix: tokenPrefix(raw), hash: hashMcpToken(raw) };
}

export function tokenPrefix(raw: string): string {
  return raw.slice(0, MCP_TOKEN_VISIBLE_PREFIX);
}

export function hashMcpToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function readBearer(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/.exec(header.trim());
  if (!match || match[1].length > 500) return null;
  return match[1];
}

export function parseBearer(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/.exec(header.trim());
  if (!match) return null;
  const token = match[1];
  if (!TOKEN_RE.test(token)) return null;
  return token;
}
