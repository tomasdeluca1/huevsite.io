import { createHash, randomBytes, timingSafeEqual } from "crypto";
import {
  ACCESS_PREFIX,
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_CODE_TTL_SECONDS,
  CLIENT_PREFIX,
  CODE_PREFIX,
  OAUTH_SCOPE,
  REFRESH_PREFIX,
  REFRESH_TOKEN_TTL_SECONDS,
} from "@/lib/mcp/oauth/metadata";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(prefix: string): string {
  return `${prefix}${randomBytes(32).toString("base64url")}`;
}

export function randomClientId(): string {
  return `${CLIENT_PREFIX}${randomBytes(18).toString("base64url")}`;
}

export function secretsMatch(presented: string, hash: string): boolean {
  const actual = Buffer.from(sha256(presented));
  const expected = Buffer.from(hash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function accessExpiresIn(): number {
  return ACCESS_TOKEN_TTL_SECONDS;
}

export function accessExpiry(now: Date): string {
  return new Date(now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();
}

export function refreshExpiry(now: Date): string {
  return new Date(now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();
}

export function codeExpiry(now: Date): string {
  return new Date(now.getTime() + AUTH_CODE_TTL_SECONDS * 1000).toISOString();
}

export function isAccessToken(token: string): boolean {
  return new RegExp(`^${ACCESS_PREFIX}[A-Za-z0-9_-]{43,}$`).test(token);
}

export function isRefreshToken(token: string): boolean {
  return new RegExp(`^${REFRESH_PREFIX}[A-Za-z0-9_-]{43,}$`).test(token);
}

export function scopeIsAllowed(scope: string | null | undefined): boolean {
  if (!scope || !scope.trim()) return true;
  const parts = scope.trim().split(/\s+/);
  return parts.every((part) => part === OAUTH_SCOPE);
}

export function grantedScope(scope: string | null | undefined): string {
  return scope && scope.trim() ? OAUTH_SCOPE : OAUTH_SCOPE;
}

export { CODE_PREFIX, ACCESS_PREFIX, REFRESH_PREFIX };
