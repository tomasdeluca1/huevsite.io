import { revokePresentedToken } from "@/lib/mcp/oauth/flow";
import { oauthError, oauthJson, readOauthBody } from "@/lib/mcp/oauth/http-helpers";
import { createSupabaseOAuthStore } from "@/lib/mcp/oauth/supabase";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return oauthJson({ ok: true }, 204);
}

export async function POST(request: Request) {
  const params = await readOauthBody(request);
  const token = params.get("token");
  if (!token) return oauthError("invalid_request", "Falta token.");
  try {
    await revokePresentedToken(createSupabaseOAuthStore(), token, new Date());
  } catch (error) {
    console.error("[oauth] revoke", error instanceof Error ? error.message : "error");
  }
  return new Response(null, { status: 200, headers: { "cache-control": "no-store" } });
}
