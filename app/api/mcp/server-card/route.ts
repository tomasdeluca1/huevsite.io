import { endpointsFromRequest } from "@/lib/mcp/oauth/metadata";
import { discoveryOptions, discoveryResponse, mcpServerCard } from "@/lib/mcp/discovery";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { issuer } = endpointsFromRequest(request);
  return discoveryResponse(mcpServerCard(issuer), request, "application/mcp-server-card+json");
}

export function OPTIONS() {
  return discoveryOptions();
}
