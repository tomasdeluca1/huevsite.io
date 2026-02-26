
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
  return createClient(url, key);
}

// POST /api/admin/showcase-winner — establecer winner de la semana
// Protegido por header admin-secret
export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get("x-admin-secret");

  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { userId, week } = await request.json();

    if (!userId || !week) {
      return NextResponse.json({ error: "userId y week son requeridos." }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Eliminar winner existente de esa semana si hubiera
    await supabase.from("showcase_winners").delete().eq("week", week);

    // Insertar nuevo winner
    const { data, error } = await supabase
      .from("showcase_winners")
      .insert({ user_id: userId, week })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, winner: data });
  } catch (error) {
    console.error("Set showcase winner error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
