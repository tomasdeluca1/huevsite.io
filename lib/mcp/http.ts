import { rateLimit } from "@/lib/rate-limit";
import { mcpBatchAllowed, mcpHourlyLimit, MCP_AUTH_FAILS_PER_WINDOW, MCP_AUTH_WINDOW_MS, MCP_BURST_PER_MINUTE, MCP_HOUR_MS } from "@/lib/mcp/limits";
import { MCP_TOOL_NAMES } from "@/lib/mcp/tools";
import { hashMcpToken, parseBearer, readBearer } from "@/lib/mcp/tokens";
import { createSupabaseMcpStore } from "@/lib/mcp/supabase-store";
import { dispatchMcp } from "@/lib/mcp/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isAccessToken } from "@/lib/mcp/oauth/crypto";
import { authenticateAccessToken } from "@/lib/mcp/oauth/flow";
import { endpointsFromRequest, wwwAuthenticate } from "@/lib/mcp/oauth/metadata";
import { createSupabaseOAuthStore } from "@/lib/mcp/oauth/supabase";
import type { McpProfile } from "@/lib/mcp/types";

const burstLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 5000 });
const authFailLimiter = rateLimit({ interval: MCP_AUTH_WINDOW_MS, uniqueTokenPerInterval: 5000 });

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function challenge(request: Request): Record<string, string> {
  return { "WWW-Authenticate": wwwAuthenticate(endpointsFromRequest(request).metadataUrl) };
}

function jsonRpcError(status: number, message: string, id: string | number | null, extraHeaders?: Record<string, string>) {
  return withCors(new Response(JSON.stringify({
    jsonrpc: "2.0",
    id,
    error: { code: -32000, message },
  }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  }));
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip.slice(0, 64) || "unknown";
}

type RpcView = { id: string | number | null; calls: string[] };

export function readRpcView(text: string): RpcView {
  if (!text) return { id: null, calls: [] };
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { id: null, calls: [] };
  }
  const messages = Array.isArray(body) ? body : [body];
  const calls: string[] = [];
  let id: string | number | null = null;
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const record = message as { id?: unknown; method?: unknown; params?: { name?: unknown } };
    if (id == null && (typeof record.id === "string" || typeof record.id === "number")) id = record.id;
    if (record.method === "tools/call" && typeof record.params?.name === "string" && MCP_TOOL_NAMES.includes(record.params.name as typeof MCP_TOOL_NAMES[number])) {
      calls.push(record.params.name);
    }
  }
  return { id, calls };
}

type AuthOk = { tokenId: string | null; credentialId: string; userId: string; profile: McpProfile };
type AuthResult = AuthOk | { expired: true } | null;

async function authenticateOauth(raw: string, request: Request): Promise<AuthResult> {
  const endpoints = endpointsFromRequest(request);
  const result = await authenticateAccessToken(createSupabaseOAuthStore(), raw, endpoints.resource, new Date());
  if (!result.ok) return result.reason === "expired" ? { expired: true } : null;
  const profile = await createSupabaseMcpStore().getProfile(result.userId);
  if (!profile) return null;
  return { tokenId: null, credentialId: `oauth:${result.familyId}`, userId: result.userId, profile };
}

async function authenticate(raw: string, request: Request): Promise<AuthResult> {
  if (!parseBearer(`Bearer ${raw}`)) {
    if (!isAccessToken(raw)) return null;
    return authenticateOauth(raw, request);
  }
  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("mcp_access_tokens")
    .select("id, user_id, revoked_at, expires_at")
    .eq("token_hash", hashMcpToken(raw))
    .maybeSingle();
  if (error) {
    console.error("[mcp] token lookup", error.message);
    throw new Error("mcp_unavailable");
  }
  if (!data || data.revoked_at) return null;
  if (data.expires_at && Date.parse(data.expires_at) <= Date.now()) return null;

  const store = createSupabaseMcpStore();
  const profile = await store.getProfile(data.user_id);
  if (!profile) return null;

  void db
    .from("mcp_access_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(({ error: touchError }) => {
      if (touchError) console.error("[mcp] last_used", touchError.message);
    });

  return { tokenId: data.id, credentialId: `pat:${data.id}`, userId: data.user_id, profile };
}

async function countToolCalls(auth: AuthOk, sinceIso: string): Promise<number> {
  const db = createServiceRoleClient();
  let query = db
    .from("mcp_audit_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso)
    .in("tool", [...MCP_TOOL_NAMES]);
  query = auth.tokenId
    ? query.or(`token_id.eq.${auth.tokenId},credential_id.eq.${auth.credentialId}`)
    : query.eq("credential_id", auth.credentialId);
  const { count, error } = await query;
  if (error) {
    console.error("[mcp] rate count", error.message);
    throw new Error("mcp_unavailable");
  }
  return count || 0;
}

async function writeAudit(row: {
  userId: string;
  tokenId: string | null;
  credentialId: string;
  tool: string;
  ok: boolean;
  errorCode: string | null;
  meta: Record<string, unknown>;
}) {
  const db = createServiceRoleClient();
  const base = {
    user_id: row.userId,
    token_id: row.tokenId,
    tool: row.tool.slice(0, 64),
    ok: row.ok,
    error_code: row.errorCode,
    meta: row.meta,
  };
  const { error } = await db.from("mcp_audit_log").insert({ ...base, credential_id: row.credentialId });
  if (error && /credential_id/i.test(error.message || "")) {
    const retry = await db.from("mcp_audit_log").insert(base);
    if (retry.error) console.error("[mcp] audit", retry.error.message);
    return;
  }
  if (error) console.error("[mcp] audit", error.message);
}

export async function handleMcpHttp(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  const ip = clientIp(request);
  const raw = readBearer(request.headers.get("authorization"));
  if (!raw) {
    return jsonRpcError(401, "Tenés que entrar con tu cuenta de huevsite.", null, challenge(request));
  }

  let auth: AuthResult;
  try {
    auth = await authenticate(raw, request);
  } catch {
    return jsonRpcError(503, "El MCP no está disponible. Falta aplicar la migración.", null, challenge(request));
  }
  if (!auth) {
    const gate = authFailLimiter.check(MCP_AUTH_FAILS_PER_WINDOW, `ip:${ip}`);
    if (!gate.success) {
      return jsonRpcError(429, "Demasiados intentos. Esperá un toque.", null, {
        "Retry-After": String(Math.ceil((gate.reset - Date.now()) / 1000)),
        ...challenge(request),
      });
    }
    return jsonRpcError(401, "Token inválido o vencido.", null, challenge(request));
  }
  if ("expired" in auth) {
    return jsonRpcError(401, "Token inválido o vencido.", null, challenge(request));
  }

  const burst = burstLimiter.check(MCP_BURST_PER_MINUTE, `token:${auth.credentialId}`);
  if (!burst.success) {
    await writeAudit({
      userId: auth.userId,
      tokenId: auth.tokenId,
      credentialId: auth.credentialId,
      tool: "rate_limit",
      ok: false,
      errorCode: "burst",
      meta: {},
    });
    return jsonRpcError(429, "Demasiadas llamadas. Esperá un toque.", null, {
      "Retry-After": String(Math.ceil((burst.reset - Date.now()) / 1000)),
    });
  }

  let bodyText = "";
  let replay = request;
  if (request.method !== "GET" && request.method !== "DELETE") {
    bodyText = await request.text();
    replay = new Request(request.url, { method: request.method, headers: request.headers, body: bodyText });
  }
  const rpc = readRpcView(bodyText);
  if (rpc.calls.length > 0) {
    const limit = mcpHourlyLimit(auth.profile);
    let count = 0;
    try {
      count = await countToolCalls(auth, new Date(Date.now() - MCP_HOUR_MS).toISOString());
    } catch {
      return jsonRpcError(503, "El MCP no está disponible. Falta aplicar la migración de tokens.", rpc.id);
    }
    if (!mcpBatchAllowed(count, rpc.calls.length, limit)) {
      await writeAudit({
        userId: auth.userId,
        tokenId: auth.tokenId,
        credentialId: auth.credentialId,
        tool: "rate_limit",
        ok: false,
        errorCode: "hourly",
        meta: { limit },
      });
      return jsonRpcError(429, `Llegaste al cupo de ${limit} llamadas por hora de tu plan.`, rpc.id, {
        "Retry-After": "60",
      });
    }
  }

  const store = createSupabaseMcpStore();
  const response = await dispatchMcp(replay, {
    userId: auth.userId,
    store,
    audit: async (tool, ok, errorCode, meta) => {
      await writeAudit({
        userId: auth.userId,
        tokenId: auth.tokenId,
        credentialId: auth.credentialId,
        tool,
        ok,
        errorCode,
        meta,
      });
    },
  });
  return withCors(response);
}
