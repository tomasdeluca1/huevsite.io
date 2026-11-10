import { handleMcpHttp } from "@/lib/mcp/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Remote MCP (Streamable HTTP, stateless). Auth is a personal access token
// in Authorization: Bearer. OAuth is not implemented: clients that can only
// do the MCP OAuth dance need a follow-up authorization server.
async function respond(request: Request) {
  return handleMcpHttp(request);
}

export { respond as GET, respond as POST, respond as DELETE, respond as OPTIONS };
