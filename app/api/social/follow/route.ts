import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreService } from "@/lib/score-service";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";

const followLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

export const dynamic = "force-dynamic";

// POST /api/social/follow — seguir usuario
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Rate limit: 30 follow actions per minute per user
    const rl = followLimiter.check(30, getIdentifier(request, user.id));
    if (!rl.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Esperá un momento." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      );
    }

    const { followingId } = await request.json();

    if (!followingId) {
      return NextResponse.json({ error: "followingId requerido" }, { status: 400 });
    }

    if (followingId === user.id) {
      return NextResponse.json({ error: "No podés seguirte a vos mismo." }, { status: 400 });
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: followingId,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ya seguís a este usuario." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Registrar actividad de "new_follow"
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", followingId)
      .single();

    if (targetProfile) {
      await supabase.from("activities").insert({
        user_id: user.id,
        type: "new_follow",
        data: { targetUsername: targetProfile.username },
      });
      // Recalcular score del que recibió el follow
      await scoreService.recomputeScore(followingId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}

// DELETE /api/social/follow — dejar de seguir
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { followingId } = await request.json();

    if (!followingId) {
      return NextResponse.json({ error: "followingId requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Recalcular score tras unfollow
    await scoreService.recomputeScore(followingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
