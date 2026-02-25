import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/social/endorsements?toId=xxx — obtener endorsements de un perfil
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const toId = searchParams.get("toId");

  if (!toId) {
    return NextResponse.json({ error: "toId requerido" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("endorsements")
      .select(`
        id,
        skill,
        comment,
        visible,
        created_at,
        from:profiles!endorsements_from_id_fkey (
          id,
          username,
          name,
          image,
          accent_color
        )
      `)
      .eq("to_id", toId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ endorsements: data ?? [] });
  } catch (error) {
    console.error("Get endorsements error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}

// POST /api/social/endorsements — crear endorsement
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { toId, skill, comment } = await request.json();

    if (!toId || !skill) {
      return NextResponse.json({ error: "toId y skill son requeridos" }, { status: 400 });
    }

    if (toId === user.id) {
      return NextResponse.json({ error: "No podés endorsarte a vos mismo." }, { status: 400 });
    }

    if (comment && comment.length > 140) {
      return NextResponse.json({ error: "El comentario no puede superar 140 caracteres." }, { status: 400 });
    }

    // Verificar que el usuario sigue al perfil o tienen GitHub en común
    // (Para MVP verificamos solo que el from esté logueado — simplificamos el check de "follow o colaboración")
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", toId)
      .maybeSingle();

    if (!follow) {
      return NextResponse.json(
        { error: "Solo podés endorsar a builders que seguís." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("endorsements")
      .insert({ from_id: user.id, to_id: toId, skill, comment: comment || null })
      .select(`
        id,
        skill,
        comment,
        visible,
        created_at,
        from:profiles!endorsements_from_id_fkey (
          id,
          username,
          name,
          image,
          accent_color
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ya endorsaste esta skill a este builder." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, endorsement: data });
  } catch (error) {
    console.error("Create endorsement error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id, skill, comment, visible } = await request.json();

    const { data, error } = await supabase
      .from("endorsements")
      .update({ 
        ...(skill && { skill }), 
        ...(comment !== undefined && { comment: comment || null }),
        ...(visible !== undefined && { visible })
      })
      .eq("id", id)
      .select(`
        id,
        skill,
        comment,
        visible,
        created_at,
        from:profiles!endorsements_from_id_fkey (
          id,
          username,
          name,
          image,
          accent_color
        )
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, endorsement: data });
  } catch (error) {
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const { error } = await supabase
      .from("endorsements")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
