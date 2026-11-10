import { createHash } from "node:crypto";
import { SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/sdk/types.js";

/**
 * Server card (SEP-2127) y catálogo de dominio.
 * La card describe identidad y transporte. Las tools y los prompts se listan
 * en runtime, no acá.
 *
 * `name` es el identificador reverse-DNS que pide el schema (tiene que llevar
 * una barra). El nombre que ve el cliente al conectar sigue siendo "huevsite",
 * igual que `title` y que `serverInfo.name`.
 */
export const MCP_CARD_NAME = "io.huevsite/huevsite";
export const MCP_CARD_VERSION = "1.0.0";
export const MCP_CARD_DESCRIPTION =
  "Actualiza tu perfil público de huevsite: bio, proyectos, avances y lanzamientos.";

const CARD_SCHEMA = "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json";

export function mcpServerCard(origin: string) {
  const base = origin.replace(/\/$/, "");
  return {
    $schema: CARD_SCHEMA,
    name: MCP_CARD_NAME,
    version: MCP_CARD_VERSION,
    title: "huevsite",
    description: MCP_CARD_DESCRIPTION,
    websiteUrl: `${base}/mcp`,
    repository: {
      url: "https://github.com/tomasdeluca1/huevsite.io",
      source: "github",
    },
    icons: [
      { src: `${base}/icons/icon-512.png`, mimeType: "image/png", sizes: ["512x512"] },
      { src: `${base}/icons/icon-192.png`, mimeType: "image/png", sizes: ["192x192"] },
    ],
    remotes: [
      {
        type: "streamable-http" as const,
        url: `${base}/api/mcp`,
        supportedProtocolVersions: [...SUPPORTED_PROTOCOL_VERSIONS],
      },
    ],
    _meta: {
      "io.huevsite/docs": `${base}/mcp`,
      "io.huevsite/auth": "oauth",
    },
  };
}

export function aiCatalog(origin: string) {
  const base = origin.replace(/\/$/, "");
  return {
    specVersion: "1.0",
    entries: [
      {
        identifier: "urn:air:huevsite.io:mcp:huevsite",
        type: "application/mcp-server-card+json",
        url: `${base}/api/mcp/server-card`,
      },
    ],
  };
}

const SHARED_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "Content-Type, If-None-Match, Accept",
  "access-control-expose-headers": "ETag",
  "cache-control": "public, max-age=3600",
};

function etagMatches(header: string | null, etag: string) {
  if (!header) return false;
  return header.split(",").some((part) => {
    const token = part.trim();
    return token === etag || token === `W/${etag}`;
  });
}

export function discoveryResponse(body: unknown, request: Request, contentType: string) {
  const payload = JSON.stringify(body);
  const etag = `"${createHash("sha256").update(payload).digest("hex").slice(0, 32)}"`;
  const origin = new URL(request.url).origin;
  const headers: Record<string, string> = {
    ...SHARED_HEADERS,
    etag,
    "content-type": `${contentType}; charset=utf-8`,
    link: `<${origin}/mcp>; rel="help"`,
  };
  if (etagMatches(request.headers.get("if-none-match"), etag)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(payload, { status: 200, headers });
}

export function discoveryOptions() {
  return new Response(null, { status: 204, headers: SHARED_HEADERS });
}
