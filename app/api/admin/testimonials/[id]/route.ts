import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "approved", "rejected"] as const;

// PATCH: moderate a testimonial — set status and/or featured.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("status" in body) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    updates.status = body.status;
    // A rejected testimonial can't stay featured.
    if (body.status !== "approved") updates.featured = false;
  }

  if ("featured" in body) {
    if (typeof body.featured !== "boolean") {
      return NextResponse.json({ error: "featured debe ser boolean." }, { status: 400 });
    }
    updates.featured = body.featured;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "Sin cambios." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("testimonials")
    .update(updates)
    .eq("id", id)
    .select("id, status, featured")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "No encontrada." },
      { status: error ? 500 : 404 }
    );
  }

  return NextResponse.json(data);
}
