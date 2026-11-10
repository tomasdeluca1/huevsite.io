import { GET as cardGet, OPTIONS as cardOptions } from "@/app/api/mcp/server-card/route";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return cardGet(request);
}

export function OPTIONS() {
  return cardOptions();
}
