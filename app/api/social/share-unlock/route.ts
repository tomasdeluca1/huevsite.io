import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/social/share-unlock
// Confiamos en el usuario (MVP pragmático — no verificamos Twitter API)
// Solo se puede usar una vez por usuario (twitter_share_unlocked = true)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { tweetUrl } = await request.json().catch(() => ({ tweetUrl: null }));

    if (!tweetUrl || (!tweetUrl.includes("twitter.com/") && !tweetUrl.includes("x.com/"))) {
      return NextResponse.json({ error: "El link provisto no es de un tweet de Twitter/X válido." }, { status: 400 });
    }

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("twitter_share_unlocked, extra_blocks_from_share, subscription_tier")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    // Solo usuarios free y que no hayan usado el share antes
    if (profile.twitter_share_unlocked) {
      return NextResponse.json(
        { error: "Ya usaste el desbloqueo por tweet anteriormente." },
        { status: 400 }
      );
    }

    // Actualizar: +3 bloques, marcar como usado
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        twitter_share_unlocked: true,
        extra_blocks_from_share: (profile.extra_blocks_from_share || 0) + 3,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error unlocking share:", updateError);
      return NextResponse.json({ error: "Error al desbloquear." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      extraBlocks: (profile.extra_blocks_from_share || 0) + 3,
    });
  } catch (error) {
    console.error("Share unlock error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
