import { rateLimit } from "@/lib/rate-limit";
import { randomToken, sha256 } from "@/lib/mcp/oauth/crypto";
import { parseRegistration, fetchClientMetadata, isMetadataClientId } from "@/lib/mcp/oauth/clients";
import { endpointsFromRequest } from "@/lib/mcp/oauth/metadata";
import { createSupabaseOAuthStore } from "@/lib/mcp/oauth/supabase";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { StoredClient } from "@/lib/mcp/oauth/flow";

const registerLimiter = rateLimit({ interval: 60 * 60 * 1000, uniqueTokenPerInterval: 2000 });
const DCR_PER_IP_PER_HOUR = 30;
const DCR_GLOBAL_PER_HOUR = 200;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function oauthJson(body: unknown, status = 200, extra?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS, ...extra },
  });
}

export function oauthError(error: string, description: string, status = 400) {
  return oauthJson({ error, error_description: description }, status);
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0].trim() : "unknown").slice(0, 64) || "unknown";
}

export async function readOauthBody(request: Request): Promise<URLSearchParams> {
  const type = request.headers.get("content-type") || "";
  const text = await request.text();
  if (type.includes("application/json")) {
    const params = new URLSearchParams();
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      for (const [key, value] of Object.entries(json)) {
        if (typeof value === "string") params.set(key, value);
      }
    } catch {
      return params;
    }
    return params;
  }
  return new URLSearchParams(text);
}

export function clientSecretFromRequest(request: Request, params: URLSearchParams): { clientId: string | null; clientSecret: string | null } {
  const header = request.headers.get("authorization") || "";
  if (/^basic\s+/i.test(header)) {
    try {
      const decoded = Buffer.from(header.replace(/^basic\s+/i, ""), "base64").toString("utf8");
      const split = decoded.indexOf(":");
      if (split > 0) {
        return {
          clientId: decodeURIComponent(decoded.slice(0, split)),
          clientSecret: decodeURIComponent(decoded.slice(split + 1)),
        };
      }
    } catch {
      return { clientId: null, clientSecret: null };
    }
  }
  return {
    clientId: params.get("client_id"),
    clientSecret: params.get("client_secret"),
  };
}

export async function resolveOauthClient(clientId: string): Promise<StoredClient | null> {
  const store = createSupabaseOAuthStore();
  if (isMetadataClientId(clientId)) {
    const fetched = await fetchClientMetadata(clientId);
    if (!fetched.ok) return null;
    return { ...fetched.client, clientSecretHash: null };
  }
  return store.getClient(clientId);
}

export async function registrationAllowed(request: Request): Promise<boolean> {
  if (!registerLimiter.check(DCR_PER_IP_PER_HOUR, `reg:${clientIp(request)}`).success) return false;
  try {
    const db = createServiceRoleClient();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error } = await db
      .from("oauth_clients")
      .select("client_id", { count: "exact", head: true })
      .gte("created_at", since);
    if (error) {
      console.error("[oauth] register cap", error.message);
      return true;
    }
    return (count || 0) < DCR_GLOBAL_PER_HOUR;
  } catch (error) {
    console.error("[oauth] register cap", error instanceof Error ? error.message : "error");
    return true;
  }
}

export function issuedClient(client: StoredClient, secret: string | null) {
  return {
    client_id: client.clientId,
    client_secret: secret || undefined,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_secret_expires_at: secret ? 0 : undefined,
    client_name: client.clientName,
    redirect_uris: client.redirectUris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: client.tokenEndpointAuthMethod,
  };
}

export function newClientSecret(): { raw: string; hash: string } | null {
  const raw = randomToken("hvcs_");
  return { raw, hash: sha256(raw) };
}

export function publicResource(request: Request) {
  return endpointsFromRequest(request);
}
