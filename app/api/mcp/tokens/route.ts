import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { MCP_MAX_ACTIVE_TOKENS, mcpHourlyLimit } from "@/lib/mcp/limits";
import { countUsableMcpTokens, mcpTokenExpiresAt, parseMcpTokenTtl } from "@/lib/mcp/token-expiry";
import { generateMcpToken } from "@/lib/mcp/tokens";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

async function requireUser() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const db = createServiceRoleClient();
  const [{ data: tokens, error: tokenError }, { data: audit, error: auditError }, { data: profile }] = await Promise.all([
    db
      .from("mcp_access_tokens")
      .select("id, name, token_prefix, created_at, last_used_at, revoked_at, expires_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    db
      .from("mcp_audit_log")
      .select("id, tool, ok, error_code, created_at, token_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15),
    db
      .from("profiles")
      .select("subscription_tier, pro_since, referral_reward_expires_at, free_trial_ends_at")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (tokenError || auditError) {
    console.error("[mcp] list", tokenError?.message || auditError?.message);
    return NextResponse.json({ error: "No se pudieron leer los tokens. ¿Aplicaste la migración?" }, { status: 503 });
  }

  return NextResponse.json({
    tokens: tokens || [],
    audit: audit || [],
    limits: {
      maxActive: MCP_MAX_ACTIVE_TOKENS,
      hourly: mcpHourlyLimit(profile),
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Poné un nombre de hasta 60 caracteres." }, { status: 400 });
  const ttlInput = body && typeof body === "object" && !Array.isArray(body) ? (body as { ttl?: unknown }).ttl : undefined;
  const ttl = parseMcpTokenTtl(ttlInput);
  if (ttl === "invalid") return NextResponse.json({ error: "Elegí 30 días, 90 días o nunca." }, { status: 400 });

  const db = createServiceRoleClient();
  const { data: openTokens, error: countError } = await db
    .from("mcp_access_tokens")
    .select("revoked_at, expires_at")
    .eq("user_id", user.id)
    .is("revoked_at", null);
  if (countError) {
    console.error("[mcp] count tokens", countError.message);
    return NextResponse.json({ error: "No se pudieron crear tokens. ¿Aplicaste la migración?" }, { status: 503 });
  }
  if (countUsableMcpTokens(openTokens || []) >= MCP_MAX_ACTIVE_TOKENS) {
    return NextResponse.json({ error: `Podés tener hasta ${MCP_MAX_ACTIVE_TOKENS} tokens activos. Revocá uno primero.` }, { status: 400 });
  }

  const minted = generateMcpToken();
  const expiresAt = mcpTokenExpiresAt(ttl);
  const { data, error } = await db
    .from("mcp_access_tokens")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      token_prefix: minted.prefix,
      token_hash: minted.hash,
      expires_at: expiresAt,
    })
    .select("id, name, token_prefix, created_at, expires_at")
    .single();

  if (error || !data) {
    console.error("[mcp] insert token", error?.message);
    return NextResponse.json({ error: "No se pudo crear el token." }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    prefix: data.token_prefix,
    created_at: data.created_at,
    expires_at: data.expires_at,
    token: minted.raw,
  });
}
