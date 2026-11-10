import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("mcp_access_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[mcp] revoke", error.message);
    return NextResponse.json({ error: "No se pudo revocar el token." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Token no encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
