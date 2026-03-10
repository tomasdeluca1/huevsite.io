import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(url, key);
}

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  return profile?.username === 'huevsite';
}

// POST /api/admin/showcase-winner — alternar winner de la semana
export async function POST(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { userId, week } = await request.json();

    if (!userId || !week) {
      return NextResponse.json({ error: "userId y week son requeridos." }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Ver si ya es winner
    const { data: existing } = await supabase
      .from("showcase_winners")
      .select("*")
      .eq("user_id", userId)
      .eq("week", week)
      .maybeSingle();

    if (existing) {
      // Si ya existe, lo quitamos
      await supabase.from("showcase_winners").delete().eq("user_id", userId).eq("week", week);
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Si no existe, lo agregamos
      const { data, error } = await supabase
        .from("showcase_winners")
        .insert({ user_id: userId, week })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, action: 'added', winner: data });
    }
  } catch (error: any) {
    console.error("Set showcase winner error:", error);
    return NextResponse.json({ error: error.message || "Algo salió mal." }, { status: 500 });
  }
}

// DELETE /api/admin/showcase-winner — limpiar todos los winners de una semana
export async function DELETE(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week requerida" }, { status: 400 });

  const supabase = getServiceRoleClient();
  await supabase.from("showcase_winners").delete().eq("week", week);
  return NextResponse.json({ success: true });
}

