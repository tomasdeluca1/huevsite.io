import { parseRegistration } from "@/lib/mcp/oauth/clients";
import { randomClientId } from "@/lib/mcp/oauth/crypto";
import { issuedClient, newClientSecret, oauthError, oauthJson, registrationAllowed } from "@/lib/mcp/oauth/http-helpers";
import { createSupabaseOAuthStore } from "@/lib/mcp/oauth/supabase";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return oauthJson({ ok: true }, 204);
}

export async function POST(request: Request) {
  if (!(await registrationAllowed(request))) {
    return oauthError("slow_down", "Demasiados registros. Esperá un toque.", 429);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return oauthError("invalid_client_metadata", "El registro tiene que ser un JSON.");
  }
  const parsed = parseRegistration(body);
  if (!parsed.ok) return oauthError(parsed.error, parsed.description);
  const secret = parsed.client.tokenEndpointAuthMethod === "none" ? null : newClientSecret();
  const client = {
    ...parsed.client,
    clientId: randomClientId(),
    source: "dcr" as const,
    clientSecretHash: secret?.hash || null,
  };
  try {
    await createSupabaseOAuthStore().saveClient(client);
  } catch (error) {
    console.error("[oauth] register", error instanceof Error ? error.message : "error");
    return oauthError("server_error", "No se pudo registrar el cliente.", 500);
  }
  return oauthJson(issuedClient(client, secret?.raw || null), 201);
}
