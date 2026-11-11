import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { OAuthConnection, OAuthStore, StoredClient, StoredCode, StoredGrant } from "@/lib/mcp/oauth/flow";

function mapClient(row: Record<string, any>): StoredClient {
  return {
    clientId: row.client_id,
    clientName: row.client_name,
    clientUri: row.client_uri,
    logoUri: row.logo_uri,
    redirectUris: row.redirect_uris || [],
    tokenEndpointAuthMethod: row.token_endpoint_auth_method,
    source: row.registration_source,
    clientSecretHash: row.client_secret_hash,
  };
}

function mapCode(row: Record<string, any>): StoredCode {
  return {
    id: row.id,
    codeHash: row.code_hash,
    clientId: row.client_id,
    userId: row.user_id,
    redirectUri: row.redirect_uri,
    codeChallenge: row.code_challenge,
    scope: row.scope,
    resource: row.resource,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
  };
}

function mapGrant(row: Record<string, any>): StoredGrant {
  return {
    id: row.id,
    familyId: row.family_id,
    userId: row.user_id,
    clientId: row.client_id,
    clientName: row.client_name,
    scope: row.scope,
    resource: row.resource,
    accessTokenHash: row.access_token_hash,
    refreshTokenHash: row.refresh_token_hash,
    accessExpiresAt: row.access_expires_at,
    refreshExpiresAt: row.refresh_expires_at,
    revokedAt: row.revoked_at,
  };
}

export function createSupabaseOAuthStore(): OAuthStore {
  const db = createServiceRoleClient();
  return {
    async saveClient(client) {
      const { error } = await db.from("oauth_clients").upsert({
        client_id: client.clientId,
        client_name: client.clientName,
        client_uri: client.clientUri,
        logo_uri: client.logoUri,
        redirect_uris: client.redirectUris,
        token_endpoint_auth_method: client.tokenEndpointAuthMethod,
        client_secret_hash: client.clientSecretHash,
        registration_source: client.source,
      }, { onConflict: "client_id" });
      if (error) throw new Error(error.message);
    },
    async getClient(clientId) {
      const { data, error } = await db.from("oauth_clients").select("*").eq("client_id", clientId).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapClient(data) : null;
    },
    async insertCode(code) {
      const { error } = await db.from("oauth_authorization_codes").insert({
        id: code.id,
        code_hash: code.codeHash,
        client_id: code.clientId,
        user_id: code.userId,
        redirect_uri: code.redirectUri,
        code_challenge: code.codeChallenge,
        scope: code.scope,
        resource: code.resource,
        expires_at: code.expiresAt,
      });
      if (error) throw new Error(error.message);
    },
    async consumeCode(codeHash, now) {
      const { data, error } = await db
        .from("oauth_authorization_codes")
        .update({ used_at: now.toISOString() })
        .eq("code_hash", codeHash)
        .is("used_at", null)
        .gt("expires_at", now.toISOString())
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapCode(data) : null;
    },
    async findCode(codeHash) {
      const { data, error } = await db.from("oauth_authorization_codes").select("*").eq("code_hash", codeHash).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapCode(data) : null;
    },
    async insertGrant(grant) {
      const { error } = await db.from("oauth_grants").insert({
        id: grant.id,
        family_id: grant.familyId,
        user_id: grant.userId,
        client_id: grant.clientId,
        client_name: grant.clientName,
        scope: grant.scope,
        resource: grant.resource,
        access_token_hash: grant.accessTokenHash,
        refresh_token_hash: grant.refreshTokenHash,
        access_expires_at: grant.accessExpiresAt,
        refresh_expires_at: grant.refreshExpiresAt,
        revoked_at: null,
      });
      if (error) throw new Error(error.message);
    },
    async getByAccessHash(hash) {
      const { data, error } = await db.from("oauth_grants").select("*").eq("access_token_hash", hash).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapGrant(data) : null;
    },
    async getByRefreshHash(hash) {
      const { data, error } = await db.from("oauth_grants").select("*").eq("refresh_token_hash", hash).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapGrant(data) : null;
    },
    async consumeRefresh(hash, now) {
      const { data, error } = await db
        .from("oauth_grants")
        .update({ revoked_at: now.toISOString() })
        .eq("refresh_token_hash", hash)
        .is("revoked_at", null)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapGrant(data) : null;
    },
    async revokeFamily(familyId, now) {
      const { error } = await db
        .from("oauth_grants")
        .update({ revoked_at: now.toISOString() })
        .eq("family_id", familyId)
        .is("revoked_at", null);
      if (error) throw new Error(error.message);
    },
    async touchGrant(id, now) {
      const { error } = await db.from("oauth_grants").update({ last_used_at: now.toISOString() }).eq("id", id);
      if (error) console.error("[oauth] last_used", error.message);
    },
    async listConnections(userId) {
      const { data, error } = await db
        .from("oauth_grants")
        .select("client_id, client_name, created_at, last_used_at, revoked_at")
        .eq("user_id", userId)
        .is("revoked_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      const seen = new Set<string>();
      const connections: OAuthConnection[] = [];
      for (const row of data || []) {
        if (seen.has(row.client_id)) continue;
        seen.add(row.client_id);
        connections.push({
          clientId: row.client_id,
          clientName: row.client_name,
          createdAt: row.created_at,
          lastUsedAt: row.last_used_at,
        });
      }
      return connections;
    },
    async revokeClient(userId, clientId, now) {
      const { error } = await db
        .from("oauth_grants")
        .update({ revoked_at: now.toISOString() })
        .eq("user_id", userId)
        .eq("client_id", clientId)
        .is("revoked_at", null);
      if (error) throw new Error(error.message);
    },
  };
}
