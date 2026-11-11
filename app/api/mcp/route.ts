import { handleMcpHttp } from "@/lib/mcp/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Remote MCP (Streamable HTTP, stateless). Auth goes in Authorization: Bearer and is either a
// personal access token (hvst_) or an OAuth 2.1 access token (hvsa_) issued by /api/oauth/*.
async function respond(request: Request) {
  return handleMcpHttp(request);
}

export { respond as GET, respond as POST, respond as DELETE, respond as OPTIONS };
