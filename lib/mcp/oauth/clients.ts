import { isIP } from "net";
import https from "https";
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

// Todo lo que no es una dirección pública ruteable: privadas, loopback, link-local (ahí vive
// el metadata de la nube), CGNAT, benchmarking, documentación, multicast y reservadas.
const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./,
  /^192\.0\.[02]\./,
  /^198\.1[89]\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  /^(22[4-9]|2[3-5]\d)\./,
];

function mappedIpv4(ip: string): string | null {
  if (!ip.startsWith("::ffff:")) return null;
  const rest = ip.slice("::ffff:".length);
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(rest)) return rest;
  const hex = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!hex) return null;
  const hi = parseInt(hex[1], 16);
  const lo = parseInt(hex[2], 16);
  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
}

export function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  const v4 = mappedIpv4(ip);
  if (v4) return isPrivateAddress(v4);
  if (ip.includes(":")) {
    if (isIP(ip) !== 6) return true;
    // Sin especificar y loopback, en cualquiera de sus formas.
    if (/^[0:]+1?$/.test(ip)) return true;
    // IPv4 embebida (compatible, NAT64, 6to4, Teredo): apunta a una v4 que no validamos acá.
    if (ip.startsWith("::") && ip.includes(".")) return true;
    if (ip.startsWith("64:ff9b:") || ip.startsWith("2002:") || /^2001:0{0,4}:/.test(ip)) return true;
    // fc00::/7 privadas, fe80::/10 link-local, fec0::/10 site-local, ff00::/8 multicast.
    return /^(f[cd]|fe[89a-f]|ff)/.test(ip);
  }
  if (isIP(ip) !== 4) return true;
  return PRIVATE_V4.some((pattern) => pattern.test(ip));
}

// client_uri sólo https: si alguna vez se muestra como link, no puede traer javascript: ni
// un scheme de app.
function httpsUri(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
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
  const clientUri = httpsUri(record.client_uri);
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
      clientUri: httpsUri(record.client_uri),
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

export type MetadataResponse = { status: number; body: string };
export type MetadataTransport = (url: URL, address: { address: string; family: number }) => Promise<MetadataResponse | null>;
type Resolver = (hostname: string) => Promise<Array<{ address: string; family: number }>>;

const MAX_METADATA_BYTES = 64_000;
const METADATA_TIMEOUT_MS = 5000;

/**
 * GET con la conexión clavada a la dirección que ya se validó. Con `fetch` el nombre se resuelve
 * de nuevo al conectar, y un DNS que cambia la respuesta entre el chequeo y el pedido (rebinding)
 * termina pegándole a la red interna. Además corta el cuerpo a los 64 KB mientras llega.
 */
export const pinnedGet: MetadataTransport = (url, address) =>
  new Promise((resolve) => {
    let settled = false;
    const finish = (value: MetadataResponse | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      resolve(value);
    };
    const request = https.request(
      {
        protocol: "https:",
        hostname: url.hostname.replace(/^\[|\]$/g, ""),
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: { accept: "application/json", "user-agent": "huevsite-oauth/1.0" },
        servername: isIP(url.hostname.replace(/^\[|\]$/g, "")) ? undefined : url.hostname,
        agent: false,
        lookup: ((_hostname: string, options: { all?: boolean }, callback: (...args: unknown[]) => void) => {
          if (options && options.all) callback(null, [address]);
          else callback(null, address.address, address.family);
        }) as never,
      },
      (response) => {
        const status = response.statusCode || 0;
        if (status !== 200) {
          response.resume();
          request.destroy();
          finish(null);
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_METADATA_BYTES) {
            request.destroy();
            finish(null);
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => finish({ status, body: Buffer.concat(chunks).toString("utf8") }));
        response.on("error", () => finish(null));
      }
    );
    const deadline = setTimeout(() => {
      request.destroy();
      finish(null);
    }, METADATA_TIMEOUT_MS);
    request.on("error", () => finish(null));
    request.end();
  });

const systemResolver: Resolver = (hostname) => lookup(hostname, { all: true });

export async function fetchClientMetadata(
  clientId: string,
  deps: { resolve?: Resolver; transport?: MetadataTransport } = {}
): Promise<{ ok: true; client: ClientMetadata } | { ok: false; error: string }> {
  if (!isMetadataClientId(clientId)) return { ok: false, error: "invalid_client" };
  const url = new URL(clientId);
  if (url.port && url.port !== "443") return { ok: false, error: "invalid_client" };
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let target: { address: string; family: number };
  if (isIP(host)) {
    if (isPrivateAddress(host)) return { ok: false, error: "invalid_client" };
    target = { address: host, family: isIP(host) };
  } else {
    try {
      const records = await (deps.resolve || systemResolver)(host);
      // Si cualquiera de las respuestas es interna se rechaza todo: no se elige "la buena".
      if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
        return { ok: false, error: "invalid_client" };
      }
      target = records[0];
    } catch {
      return { ok: false, error: "invalid_client" };
    }
  }
  let response: MetadataResponse | null;
  try {
    response = await (deps.transport || pinnedGet)(url, target);
  } catch {
    return { ok: false, error: "invalid_client" };
  }
  if (!response || response.status !== 200 || response.body.length > MAX_METADATA_BYTES) {
    return { ok: false, error: "invalid_client" };
  }
  try {
    return parseClientMetadataDocument(clientId, JSON.parse(response.body));
  } catch {
    return { ok: false, error: "invalid_client" };
  }
}
