import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { issueAuthorizationCode } from "@/lib/mcp/oauth/flow";
import { resolveOauthClient } from "@/lib/mcp/oauth/http-helpers";
import { endpointsFromRequest } from "@/lib/mcp/oauth/metadata";
import { redirectAllowed } from "@/lib/mcp/oauth/redirect";
import { createSupabaseOAuthStore } from "@/lib/mcp/oauth/supabase";

export const dynamic = "force-dynamic";

function bounce(redirectUri: string, params: Record<string, string | undefined>) {
  const target = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value) target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
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
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url));
  }

  const client = await resolveOauthClient(params.client_id).catch(() => null);
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
