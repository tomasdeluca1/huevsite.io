import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.question === "string") updates.question = body.question.trim();
  if (typeof body.answer === "string") updates.answer = body.answer.trim();
  if (typeof body.sort_order === "number") updates.sort_order = body.sort_order;
  if (typeof body.published === "boolean") updates.published = body.published;

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "Sin cambios." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("faqs")
    .update(updates)
    .eq("id", id)
    .select("id, question, answer, sort_order, published")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "No encontrada." }, { status: error ? 500 : 404 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
