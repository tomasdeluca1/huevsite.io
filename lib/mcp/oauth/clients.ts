import { isIP } from "net";
import { lookup } from "dns/promises";
import { isRegisterableRedirect } from "@/lib/mcp/oauth/redirect";

export type ClientMetadata = {
  clientId: string;
  clientName: string;
  clientUri: string | null;
  logoUri: string | null;
  redirectUris: string[];
  tokenEndpointAuthMethod: "none" | "client_secret_basic" | "client_secret_post";
  source: "dcr" | "cimd";
};

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./,
];

export function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) return true;
  if (ip.includes(":")) return false;
  return PRIVATE_V4.some((pattern) => pattern.test(ip));
}

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80);
  return name || null;
}

export function parseRegistration(body: unknown): { ok: true; client: Omit<ClientMetadata, "clientId" | "source"> } | { ok: false; error: string; description: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_client_metadata", description: "El registro tiene que ser un JSON." };
  }
  const record = body as Record<string, unknown>;
  const clientName = cleanName(record.client_name) || "App";
  const redirects = Array.isArray(record.redirect_uris) ? record.redirect_uris : [];
  if (redirects.length < 1 || redirects.length > 16 || redirects.some((item) => typeof item !== "string" || !isRegisterableRedirect(item))) {
    return { ok: false, error: "invalid_redirect_uri", description: "Las redirect URI tienen que ser https, loopback o el scheme de la app." };
  }
  const method = record.token_endpoint_auth_method;
  const authMethod = method === undefined || method === "none"
    ? "none"
    : method === "client_secret_basic" || method === "client_secret_post"
      ? method
      : null;
  if (!authMethod) {
    return { ok: false, error: "invalid_client_metadata", description: "token_endpoint_auth_method no está soportado." };
  }
  const clientUri = typeof record.client_uri === "string" && isRegisterableRedirect(record.client_uri) ? record.client_uri : null;
  const logoUri = typeof record.logo_uri === "string" && record.logo_uri.startsWith("https://") ? record.logo_uri.slice(0, 500) : null;
  return {
    ok: true,
    client: {
      clientName,
      clientUri,
      logoUri,
      redirectUris: redirects as string[],
      tokenEndpointAuthMethod: authMethod,
    },
  };
}

export function parseClientMetadataDocument(clientId: string, body: unknown): { ok: true; client: ClientMetadata } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_client" };
  const record = body as Record<string, unknown>;
  if (record.client_id !== clientId) return { ok: false, error: "invalid_client" };
  const clientName = cleanName(record.client_name);
  const redirects = Array.isArray(record.redirect_uris) ? record.redirect_uris.filter((item): item is string => typeof item === "string") : [];
  if (!clientName || redirects.length < 1 || redirects.some((item) => !isRegisterableRedirect(item))) {
    return { ok: false, error: "invalid_client" };
  }
  const method = record.token_endpoint_auth_method;
  if (method && method !== "none") return { ok: false, error: "invalid_client" };
  return {
    ok: true,
    client: {
      clientId,
      clientName,
      clientUri: typeof record.client_uri === "string" ? record.client_uri.slice(0, 500) : null,
      logoUri: typeof record.logo_uri === "string" && record.logo_uri.startsWith("https://") ? record.logo_uri.slice(0, 500) : null,
      redirectUris: redirects,
      tokenEndpointAuthMethod: "none",
      source: "cimd",
    },
  };
}

export function isMetadataClientId(clientId: string): boolean {
  try {
    const url = new URL(clientId);
    return url.protocol === "https:" && !!url.pathname && url.pathname !== "/" && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

export async function fetchClientMetadata(
  clientId: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ ok: true; client: ClientMetadata } | { ok: false; error: string }> {
  if (!isMetadataClientId(clientId)) return { ok: false, error: "invalid_client" };
  const url = new URL(clientId);
  if (isIP(url.hostname) && isPrivateAddress(url.hostname)) return { ok: false, error: "invalid_client" };
  try {
    const records = await lookup(url.hostname, { all: true });
    if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
      return { ok: false, error: "invalid_client" };
    }
  } catch {
    return { ok: false, error: "invalid_client" };
  }
  let response: Response;
  try {
    response = await fetchImpl(url.toString(), {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      headers: { accept: "application/json" },
    });
  } catch {
    return { ok: false, error: "invalid_client" };
  }
  if (!response.ok) return { ok: false, error: "invalid_client" };
  const text = await response.text();
  if (text.length > 64_000) return { ok: false, error: "invalid_client" };
  try {
    return parseClientMetadataDocument(clientId, JSON.parse(text));
  } catch {
    return { ok: false, error: "invalid_client" };
  }
}
