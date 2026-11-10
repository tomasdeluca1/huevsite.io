import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseOAuthStore } from "@/lib/mcp/oauth/supabase";

export const dynamic = "force-dynamic";

async function userId() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  return user?.id || null;
}

export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const connections = await createSupabaseOAuthStore().listConnections(id);
    return NextResponse.json({ connections });
  } catch (error) {
    console.error("[oauth] connections", error instanceof Error ? error.message : "error");
    return NextResponse.json({ connections: [] });
  }
}

export async function DELETE(request: NextRequest) {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const clientId = request.nextUrl.searchParams.get("client_id") || "";
  if (!clientId || clientId.length > 500) {
    return NextResponse.json({ error: "Falta la app." }, { status: 400 });
  }
  try {
    await createSupabaseOAuthStore().revokeClient(id, clientId, new Date());
  } catch (error) {
    console.error("[oauth] disconnect", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo desconectar." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
