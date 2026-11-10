import { endpointsFromRequest } from "@/lib/mcp/oauth/metadata";
import { aiCatalog, discoveryOptions, discoveryResponse } from "@/lib/mcp/discovery";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { issuer } = endpointsFromRequest(request);
  return discoveryResponse(aiCatalog(issuer), request, "application/ai-catalog+json");
}

export function OPTIONS() {
  return discoveryOptions();
}
