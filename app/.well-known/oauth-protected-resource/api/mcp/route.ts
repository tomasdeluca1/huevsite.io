import { endpointsFromRequest, protectedResourceMetadata } from "@/lib/mcp/oauth/metadata";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return Response.json(protectedResourceMetadata(endpointsFromRequest(request)), {
    headers: {
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
}
