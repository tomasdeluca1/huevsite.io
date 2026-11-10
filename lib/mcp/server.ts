import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { MCP_TOOLS } from "@/lib/mcp/tools";
import type { McpStore } from "@/lib/mcp/types";

const SAFE_META_KEYS = new Set(["project_id", "block_id", "force", "confirm", "set_description", "week", "status", "country"]);

export function auditMeta(args: unknown): Record<string, unknown> {
  if (!args || typeof args !== "object" || Array.isArray(args)) return {};
  const meta: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args as Record<string, unknown>)) {
    if (SAFE_META_KEYS.has(key) && (typeof value === "string" || typeof value === "boolean")) {
      meta[key] = value;
    }
  }
  meta.keys = Object.keys(args as Record<string, unknown>).filter((key) => key !== "note");
  return meta;
}

export function buildMcpServer(input: {
  userId: string;
  store: McpStore;
  audit: (tool: string, ok: boolean, errorCode: string | null, meta: Record<string, unknown>) => Promise<void>;
}) {
  const server = new McpServer(
    { name: "huevsite", version: "1.0.0" },
    {
      instructions:
        "Este servidor solo lee y edita el perfil de la persona dueña del token. No puede ver ni cambiar perfiles ajenos, ni mandar mails, ni publicar en redes.",
    }
  );

  for (const tool of MCP_TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args: unknown) => {
        const meta = auditMeta(args);
        try {
          const outcome = await tool.handler(input.store, input.userId, args ?? {});
          await input.audit(tool.name, outcome.ok, outcome.ok ? null : outcome.error, meta);
          if (!outcome.ok) {
            return {
              isError: true,
              content: [{ type: "text" as const, text: JSON.stringify({ error: outcome.error, message: outcome.message }) }],
            };
          }
          return { content: [{ type: "text" as const, text: JSON.stringify(outcome.data) }] };
        } catch (error) {
          console.error("[mcp]", tool.name, error instanceof Error ? error.message : "error");
          await input.audit(tool.name, false, "server", meta);
          return {
            isError: true,
            content: [{ type: "text" as const, text: JSON.stringify({ error: "server", message: "No se pudo completar la acción." }) }],
          };
        }
      }
    );
  }

  return server;
}

export async function dispatchMcp(request: Request, input: {
  userId: string;
  store: McpStore;
  audit: (tool: string, ok: boolean, errorCode: string | null, meta: Record<string, unknown>) => Promise<void>;
}): Promise<Response> {
  const server = buildMcpServer(input);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close().catch(() => undefined);
  }
}
