import { rateLimit } from "@/lib/rate-limit";
import { mcpBatchAllowed, mcpHourlyLimit, MCP_AUTH_FAILS_PER_WINDOW, MCP_AUTH_WINDOW_MS, MCP_BURST_PER_MINUTE, MCP_HOUR_MS } from "@/lib/mcp/limits";
import { MCP_TOOL_NAMES } from "@/lib/mcp/tools";
import { hashMcpToken, parseBearer } from "@/lib/mcp/tokens";
import { createSupabaseMcpStore } from "@/lib/mcp/supabase-store";
import { dispatchMcp } from "@/lib/mcp/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
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

function jsonRpcError(status: number, message: string, id: string | number | null, extraHeaders?: Record<string, string>) {
  return withCors(new Response(JSON.stringify({
    jsonrpc: "2.0",
    id,
    error: { code: -32000, message },
  }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": "Bearer",
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

async function authenticate(raw: string): Promise<{ tokenId: string; userId: string; profile: McpProfile } | null> {
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

  return { tokenId: data.id, userId: data.user_id, profile };
}

async function countToolCalls(tokenId: string, sinceIso: string): Promise<number> {
  const db = createServiceRoleClient();
  const { count, error } = await db
    .from("mcp_audit_log")
    .select("id", { count: "exact", head: true })
    .eq("token_id", tokenId)
    .gte("created_at", sinceIso)
    .in("tool", [...MCP_TOOL_NAMES]);
  if (error) {
    console.error("[mcp] rate count", error.message);
    throw new Error("mcp_unavailable");
  }
  return count || 0;
}

async function writeAudit(row: {
  userId: string;
  tokenId: string;
  tool: string;
  ok: boolean;
  errorCode: string | null;
  meta: Record<string, unknown>;
}) {
  try {
    const db = createServiceRoleClient();
    const { error } = await db.from("mcp_audit_log").insert({
      user_id: row.userId,
      token_id: row.tokenId,
      tool: row.tool.slice(0, 64),
      ok: row.ok,
      error_code: row.errorCode,
      meta: row.meta,
    });
    if (error) console.error("[mcp] audit", error.message);
  } catch (error) {
    console.error("[mcp] audit", error instanceof Error ? error.message : "error");
  }
}

export async function handleMcpHttp(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  const ip = clientIp(request);
  const token = parseBearer(request.headers.get("authorization"));
  if (!token) {
    const gate = authFailLimiter.check(MCP_AUTH_FAILS_PER_WINDOW, `ip:${ip}`);
    if (!gate.success) {
      return jsonRpcError(429, "Demasiados intentos. Esperá un toque.", null, {
        "Retry-After": String(Math.ceil((gate.reset - Date.now()) / 1000)),
      });
    }
    return jsonRpcError(401, "Token inválido o revocado.", null);
  }

  let auth: { tokenId: string; userId: string; profile: McpProfile } | null;
  try {
    auth = await authenticate(token);
  } catch {
    return jsonRpcError(503, "El MCP no está disponible. Falta aplicar la migración de tokens.", null);
  }
  if (!auth) {
    const gate = authFailLimiter.check(MCP_AUTH_FAILS_PER_WINDOW, `ip:${ip}`);
    if (!gate.success) {
      return jsonRpcError(429, "Demasiados intentos. Esperá un toque.", null, {
        "Retry-After": String(Math.ceil((gate.reset - Date.now()) / 1000)),
      });
    }
    return jsonRpcError(401, "Token inválido o revocado.", null);
  }

  const burst = burstLimiter.check(MCP_BURST_PER_MINUTE, `token:${auth.tokenId}`);
  if (!burst.success) {
    await writeAudit({
      userId: auth.userId,
      tokenId: auth.tokenId,
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
      count = await countToolCalls(auth.tokenId, new Date(Date.now() - MCP_HOUR_MS).toISOString());
    } catch {
      return jsonRpcError(503, "El MCP no está disponible. Falta aplicar la migración de tokens.", rpc.id);
    }
    if (!mcpBatchAllowed(count, rpc.calls.length, limit)) {
      await writeAudit({
        userId: auth.userId,
        tokenId: auth.tokenId,
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
        tool,
        ok,
        errorCode,
        meta,
      });
    },
  });
  return withCors(response);
}
