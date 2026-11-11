import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { issueAuthorizationCode } from "@/lib/mcp/oauth/flow";
import { resolveOauthClient } from "@/lib/mcp/oauth/http-helpers";
import { endpointsFromRequest } from "@/lib/mcp/oauth/metadata";
import { redirectAllowed } from "@/lib/mcp/oauth/redirect";
import { createSupabaseOAuthStore } from "@/lib/mcp/oauth/supabase";

export const dynamic = "force-dynamic";

// Esta ruta responde a un POST. Con el 307 por defecto el navegador repite el POST
// contra el callback del cliente, que sólo acepta GET. El 303 lo convierte en GET.
const SEE_OTHER = 303;

function isBrowserSameOrigin(request: Request): boolean {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === expected;
  const site = (request.headers.get("sec-fetch-site") || "").toLowerCase();
  if (site) return site === "same-origin";
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expected;
    } catch {
      return false;
    }
  }
  return false;
}

function bounce(redirectUri: string, params: Record<string, string | undefined>) {
  const target = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value) target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target, SEE_OTHER);
}

export async function POST(request: Request) {
  if (!isBrowserSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const form = await request.formData();
  const action = String(form.get("action") || "");
  const params = {
    response_type: String(form.get("response_type") || ""),
    client_id: String(form.get("client_id") || ""),
    redirect_uri: String(form.get("redirect_uri") || ""),
    code_challenge: String(form.get("code_challenge") || ""),
    code_challenge_method: String(form.get("code_challenge_method") || ""),
    state: String(form.get("state") || ""),
    resource: String(form.get("resource") || ""),
    scope: String(form.get("scope") || ""),
  };
  if (params.state.length > 2048 || params.code_challenge.length > 256) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = `/oauth/authorize?${new URLSearchParams(params).toString()}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url), SEE_OTHER);
  }

  const client = await resolveOauthClient(params.client_id, { fetchFor: user.id }).catch(() => null);
  const redirectOk = !!client && redirectAllowed(params.redirect_uri, client.redirectUris);
  if (!client || !redirectOk) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const endpoints = endpointsFromRequest(request);
  const common = params.state ? { state: params.state, iss: endpoints.issuer } : { iss: endpoints.issuer };
  if (action !== "allow") {
    return bounce(params.redirect_uri, { ...common, error: "access_denied" });
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "profile_required" }, { status: 400 });
  }

  try {
    const issued = await issueAuthorizationCode(createSupabaseOAuthStore(), {
      client,
      userId: user.id,
      redirectUri: params.redirect_uri,
      codeChallenge: params.code_challenge,
      codeChallengeMethod: params.code_challenge_method,
      scope: params.scope,
      resource: params.resource,
      expectedResource: endpoints.resource,
      now: new Date(),
    });
    if (!issued.ok) {
      return bounce(params.redirect_uri, { ...common, error: issued.error, error_description: issued.description });
    }
    return bounce(params.redirect_uri, { ...common, code: issued.code });
  } catch (error) {
    console.error("[oauth] authorize", error instanceof Error ? error.message : "error");
    return bounce(params.redirect_uri, { ...common, error: "server_error" });
  }
}
