import { exchangeAuthorizationCode, exchangeRefreshToken } from "@/lib/mcp/oauth/flow";
import { clientSecretFromRequest, oauthError, oauthJson, oauthRateLimited, publicResource, readOauthBody, resolveOauthClient } from "@/lib/mcp/oauth/http-helpers";
import { createSupabaseOAuthStore } from "@/lib/mcp/oauth/supabase";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return oauthJson({ ok: true }, 204);
}

export async function POST(request: Request) {
  const limited = oauthRateLimited(request, "token");
  if (limited) return limited;
  const params = await readOauthBody(request);
  const auth = clientSecretFromRequest(request, params);
  const clientId = auth.clientId || params.get("client_id");
  if (!clientId) return oauthError("invalid_client", "Falta client_id.", 401);
  if (auth.clientId && params.get("client_id") && auth.clientId !== params.get("client_id")) {
    return oauthError("invalid_client", "El client_id no coincide.", 401);
  }
  const client = await resolveOauthClient(clientId).catch(() => null);
  if (!client) return oauthError("invalid_client", "No encontramos ese cliente.", 401);

  const endpoints = publicResource(request);
  const grant = params.get("grant_type");
  const store = createSupabaseOAuthStore();
  const now = new Date();
  try {
    if (grant === "authorization_code") {
      const result = await exchangeAuthorizationCode(store, {
        code: params.get("code") || "",
        client,
        redirectUri: params.get("redirect_uri") || "",
        codeVerifier: params.get("code_verifier") || "",
        resource: params.get("resource") || "",
        expectedResource: endpoints.resource,
        clientSecret: auth.clientSecret,
        now,
      });
      if (!result.ok) return oauthError(result.error, result.description, result.error === "invalid_client" ? 401 : 400);
      return oauthJson(tokenBody(result.token));
    }
    if (grant === "refresh_token") {
      const result = await exchangeRefreshToken(store, {
        refreshToken: params.get("refresh_token") || "",
        client,
        resource: params.get("resource"),
        expectedResource: endpoints.resource,
        clientSecret: auth.clientSecret,
        now,
      });
      if (!result.ok) return oauthError(result.error, result.description, result.error === "invalid_client" ? 401 : 400);
      return oauthJson(tokenBody(result.token));
    }
    return oauthError("unsupported_grant_type", "El grant tiene que ser authorization_code o refresh_token.");
  } catch (error) {
    console.error("[oauth] token", error instanceof Error ? error.message : "error");
    return oauthError("server_error", "No se pudo emitir el token.", 500);
  }
}

function tokenBody(token: { accessToken: string; refreshToken: string; expiresIn: number; scope: string }) {
  return {
    access_token: token.accessToken,
    token_type: "Bearer",
    expires_in: token.expiresIn,
    refresh_token: token.refreshToken,
    scope: token.scope,
  };
}
