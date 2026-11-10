import { redirectAllowed } from "@/lib/mcp/oauth/redirect";
import { pkceMatches } from "@/lib/mcp/oauth/pkce";
import type { ClientMetadata } from "@/lib/mcp/oauth/clients";
import {
  accessExpiry,
  codeExpiry,
  grantedScope,
  randomToken,
  refreshExpiry,
  secretsMatch,
  sha256,
  ACCESS_PREFIX,
  CODE_PREFIX,
  REFRESH_PREFIX,
} from "@/lib/mcp/oauth/crypto";
import { OAUTH_SCOPE, sameResource } from "@/lib/mcp/oauth/metadata";

export type StoredClient = ClientMetadata & { clientSecretHash: string | null };

export type StoredCode = {
  codeHash: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string;
  resource: string;
  expiresAt: string;
  usedAt: string | null;
};

export type StoredGrant = {
  id: string;
  familyId: string;
  userId: string;
  clientId: string;
  clientName: string;
  scope: string;
  resource: string;
  accessTokenHash: string;
  refreshTokenHash: string | null;
  accessExpiresAt: string;
  refreshExpiresAt: string | null;
  revokedAt: string | null;
};

export type OAuthConnection = {
  clientId: string;
  clientName: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export interface OAuthStore {
  saveClient(client: StoredClient): Promise<void>;
  getClient(clientId: string): Promise<StoredClient | null>;
  insertCode(code: StoredCode): Promise<void>;
  consumeCode(codeHash: string, now: Date): Promise<StoredCode | null>;
  insertGrant(grant: StoredGrant): Promise<void>;
  getByAccessHash(hash: string): Promise<StoredGrant | null>;
  getByRefreshHash(hash: string): Promise<StoredGrant | null>;
  consumeRefresh(hash: string, now: Date): Promise<StoredGrant | null>;
  revokeFamily(familyId: string, now: Date): Promise<void>;
  touchGrant(id: string, now: Date): Promise<void>;
  listConnections(userId: string): Promise<OAuthConnection[]>;
  revokeClient(userId: string, clientId: string, now: Date): Promise<void>;
}

export type TokenResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  tokenId: string;
  familyId: string;
  userId: string;
};

function clientSecretOk(client: StoredClient, presented: string | null): boolean {
  if (client.tokenEndpointAuthMethod === "none") return true;
  if (!presented || !client.clientSecretHash) return false;
  return secretsMatch(presented, client.clientSecretHash);
}

export async function issueAuthorizationCode(
  store: OAuthStore,
  input: {
    client: StoredClient;
    userId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    scope: string | null;
    resource: string;
    expectedResource: string;
    now: Date;
  }
): Promise<{ ok: true; code: string; scope: string } | { ok: false; error: string; description: string }> {
  if (input.codeChallengeMethod !== "S256" || !input.codeChallenge) {
    return { ok: false, error: "invalid_request", description: "Hace falta PKCE con S256." };
  }
  if (!sameResource(input.resource, input.expectedResource)) {
    return { ok: false, error: "invalid_target", description: "El resource no es el MCP de huevsite." };
  }
  if (!redirectAllowed(input.redirectUri, input.client.redirectUris)) {
    return { ok: false, error: "invalid_request", description: "Esa redirect URI no está permitida." };
  }
  const scope = grantedScope(input.scope);
  if (input.scope && input.scope.trim() && !input.scope.trim().split(/\s+/).every((part) => part === OAUTH_SCOPE)) {
    return { ok: false, error: "invalid_scope", description: "El único scope es huevsite." };
  }
  const code = randomToken(CODE_PREFIX);
  await store.saveClient(input.client);
  await store.insertCode({
    codeHash: sha256(code),
    clientId: input.client.clientId,
    userId: input.userId,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    scope,
    resource: input.expectedResource,
    expiresAt: codeExpiry(input.now),
    usedAt: null,
  });
  return { ok: true, code, scope };
}

export async function exchangeAuthorizationCode(
  store: OAuthStore,
  input: {
    code: string;
    client: StoredClient;
    redirectUri: string;
    codeVerifier: string;
    resource: string;
    expectedResource: string;
    clientSecret: string | null;
    now: Date;
  }
): Promise<{ ok: true; token: TokenResult } | { ok: false; error: string; description: string }> {
  if (!clientSecretOk(input.client, input.clientSecret)) {
    return { ok: false, error: "invalid_client", description: "El cliente no autenticó." };
  }
  if (!sameResource(input.resource, input.expectedResource)) {
    return { ok: false, error: "invalid_target", description: "El resource no es el MCP de huevsite." };
  }
  const row = await store.consumeCode(sha256(input.code), input.now);
  if (!row || row.clientId !== input.client.clientId || row.redirectUri !== input.redirectUri) {
    return { ok: false, error: "invalid_grant", description: "El código no sirve." };
  }
  if (!pkceMatches(input.codeVerifier, row.codeChallenge)) {
    return { ok: false, error: "invalid_grant", description: "El code verifier no coincide." };
  }
  const token = await persistGrant(store, {
    userId: row.userId,
    client: input.client,
    scope: row.scope,
    resource: row.resource,
    familyId: null,
    now: input.now,
  });
  return { ok: true, token };
}

export async function exchangeRefreshToken(
  store: OAuthStore,
  input: {
    refreshToken: string;
    client: StoredClient;
    resource: string | null;
    expectedResource: string;
    clientSecret: string | null;
    now: Date;
  }
): Promise<{ ok: true; token: TokenResult } | { ok: false; error: string; description: string }> {
  if (!clientSecretOk(input.client, input.clientSecret)) {
    return { ok: false, error: "invalid_client", description: "El cliente no autenticó." };
  }
  if (input.resource && !sameResource(input.resource, input.expectedResource)) {
    return { ok: false, error: "invalid_target", description: "El resource no es el MCP de huevsite." };
  }
  const hash = sha256(input.refreshToken);
  const row = await store.consumeRefresh(hash, input.now);
  if (!row || row.clientId !== input.client.clientId) {
    const existing = row || (await store.getByRefreshHash(hash));
    if (existing) await store.revokeFamily(existing.familyId, input.now);
    return { ok: false, error: "invalid_grant", description: "El refresh token no sirve." };
  }
  if (row.refreshExpiresAt && Date.parse(row.refreshExpiresAt) <= input.now.getTime()) {
    await store.revokeFamily(row.familyId, input.now);
    return { ok: false, error: "invalid_grant", description: "El refresh token ya no vale. Volvé a conectar la app." };
  }
  await store.revokeFamily(row.familyId, input.now);
  const token = await persistGrant(store, {
    userId: row.userId,
    client: input.client,
    scope: row.scope,
    resource: row.resource,
    familyId: row.familyId,
    now: input.now,
  });
  return { ok: true, token };
}

async function persistGrant(
  store: OAuthStore,
  input: {
    userId: string;
    client: StoredClient;
    scope: string;
    resource: string;
    familyId: string | null;
    now: Date;
  }
): Promise<TokenResult> {
  const id = crypto.randomUUID();
  const accessToken = randomToken(ACCESS_PREFIX);
  const refreshToken = randomToken(REFRESH_PREFIX);
  await store.insertGrant({
    id,
    familyId: input.familyId || id,
    userId: input.userId,
    clientId: input.client.clientId,
    clientName: input.client.clientName,
    scope: input.scope || OAUTH_SCOPE,
    resource: input.resource,
    accessTokenHash: sha256(accessToken),
    refreshTokenHash: sha256(refreshToken),
    accessExpiresAt: accessExpiry(input.now),
    refreshExpiresAt: refreshExpiry(input.now),
    revokedAt: null,
  });
  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    scope: input.scope || OAUTH_SCOPE,
    tokenId: id,
    familyId: input.familyId || id,
    userId: input.userId,
  };
}

export async function authenticateAccessToken(
  store: OAuthStore,
  token: string,
  expectedResource: string,
  now: Date
): Promise<{ ok: true; userId: string; grantId: string; familyId: string } | { ok: false; reason: "invalid" | "expired" }> {
  const row = await store.getByAccessHash(sha256(token));
  if (!row || row.revokedAt || !sameResource(row.resource, expectedResource)) return { ok: false, reason: "invalid" };
  if (Date.parse(row.accessExpiresAt) <= now.getTime()) return { ok: false, reason: "expired" };
  await store.touchGrant(row.id, now);
  return { ok: true, userId: row.userId, grantId: row.id, familyId: row.familyId };
}

export async function revokePresentedToken(store: OAuthStore, token: string, now: Date): Promise<void> {
  const hash = sha256(token);
  const row = (await store.getByAccessHash(hash)) || (await store.getByRefreshHash(hash));
  if (!row) return;
  await store.revokeFamily(row.familyId, now);
}
