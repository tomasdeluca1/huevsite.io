import { endpointsFromRequest, protectedResourceMetadata } from "@/lib/mcp/oauth/metadata";

export const dynamic = "force-dynamic";

function json(body: unknown) {
  return Response.json(body, {
    headers: {
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
}

export function GET(request: Request) {
  return json(protectedResourceMetadata(endpointsFromRequest(request)));
}
