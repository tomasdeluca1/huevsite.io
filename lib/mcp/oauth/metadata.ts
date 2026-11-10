import { SITE_URL } from "@/lib/site-url";

export const OAUTH_SCOPE = "huevsite";
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const AUTH_CODE_TTL_SECONDS = 5 * 60;

export const ACCESS_PREFIX = "hvsa_";
export const REFRESH_PREFIX = "hvsr_";
export const CODE_PREFIX = "hvsc_";
export const CLIENT_PREFIX = "hvc_";

const PRODUCTION_HOSTS = new Set(["huevsite.io", "www.huevsite.io"]);

export type OAuthEndpoints = {
  issuer: string;
  resource: string;
  metadataUrl: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint: string;
  revocationEndpoint: string;
};

function allowedOrigin(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (PRODUCTION_HOSTS.has(host)) return "https://huevsite.io";
  if (host === "localhost" || host === "127.0.0.1") return url.origin;
  if (host.endsWith(".vercel.app")) return url.origin;
  return null;
}

export function endpointsFromRequest(request: Request): OAuthEndpoints {
  const url = new URL(request.url);
  const issuer = allowedOrigin(url) || SITE_URL;
  return endpointsForIssuer(issuer);
}

export function endpointsForIssuer(issuer: string): OAuthEndpoints {
  const base = issuer.replace(/\/$/, "");
  return {
    issuer: base,
    resource: `${base}/api/mcp`,
    metadataUrl: `${base}/.well-known/oauth-protected-resource`,
    authorizationEndpoint: `${base}/oauth/authorize`,
    tokenEndpoint: `${base}/api/oauth/token`,
    registrationEndpoint: `${base}/api/oauth/register`,
    revocationEndpoint: `${base}/api/oauth/revoke`,
  };
}

export function protectedResourceMetadata(endpoints: OAuthEndpoints) {
  return {
    resource: endpoints.resource,
    authorization_servers: [endpoints.issuer],
    scopes_supported: [OAUTH_SCOPE],
    bearer_methods_supported: ["header"],
    resource_documentation: `${endpoints.issuer}/mcp`,
  };
}

export function authorizationServerMetadata(endpoints: OAuthEndpoints) {
  return {
    issuer: endpoints.issuer,
    authorization_endpoint: endpoints.authorizationEndpoint,
    token_endpoint: endpoints.tokenEndpoint,
    registration_endpoint: endpoints.registrationEndpoint,
    revocation_endpoint: endpoints.revocationEndpoint,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic", "client_secret_post"],
    scopes_supported: [OAUTH_SCOPE],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
  };
}

export function wwwAuthenticate(metadataUrl: string, extra?: { error?: string; description?: string }): string {
  const parts = [
    `resource_metadata="${metadataUrl}"`,
    `scope="${OAUTH_SCOPE}"`,
  ];
  if (extra?.error) parts.push(`error="${extra.error}"`);
  if (extra?.description) parts.push(`error_description="${extra.description.replace(/"/g, "'")}"`);
  return `Bearer ${parts.join(", ")}`;
}

export function sameResource(candidate: string, expected: string): boolean {
  try {
    const left = new URL(candidate);
    const right = new URL(expected);
    if (left.hash || right.hash) return false;
    return left.protocol.toLowerCase() === right.protocol.toLowerCase()
      && left.host.toLowerCase() === right.host.toLowerCase()
      && left.pathname.replace(/\/+$/, "") === right.pathname.replace(/\/+$/, "")
      && left.search === right.search;
  } catch {
    return false;
  }
}
