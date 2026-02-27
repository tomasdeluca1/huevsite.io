import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getCurrentWeek(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const week = getCurrentWeek();

    const [nominationRes, allMyNominations] = await Promise.all([
      supabase
        .from("showcase_nominations")
        .select("id")
        .eq("user_id", userId)
        .eq("nominated_by", user.id)
        .eq("week", week)
        .maybeSingle(),
      supabase
        .from("showcase_nominations")
        .select(`
          user_id,
          user:profiles (
            username, name
          )
        `)
        .eq("nominated_by", user.id)
        .eq("week", week)
    ]);

    if (nominationRes.error || allMyNominations.error) {
      return NextResponse.json({ error: (nominationRes.error?.message || allMyNominations.error?.message) }, { status: 500 });
    }

    const myNomination = allMyNominations.data?.[0] || null;

    return NextResponse.json({ 
      hasNominated: !!nominationRes.data, 
      remaining: myNomination ? 0 : 1,
      nominatedUser: myNomination ? {
        username: (myNomination.user as any)?.username,
        name: (myNomination.user as any)?.name
      } : null
    }, { status: 200 });
  } catch (error) {
    console.error("Nominate status error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}

// POST /api/social/showcase/nominate — nominar un builder para el showcase
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { userId, override } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: "No podés nominarte a vos mismo." }, { status: 400 });
    }

    const week = getCurrentWeek();

    // Check count first - limit to 1 per week
    const { count } = await supabase
      .from("showcase_nominations")
      .select("*", { count: "exact", head: true })
      .eq("nominated_by", user.id)
      .eq("week", week);

    if ((count || 0) >= 1) {
      if (!override) {
        // Find who they actually nominated
        const { data: existing } = await supabase
          .from("showcase_nominations")
          .select("user:profiles!user_id(username, name)")
          .eq("nominated_by", user.id)
          .eq("week", week)
          .single();

        return NextResponse.json({ 
          error: "Solo podés nominar a una persona por semana.",
          nominatedUser: existing ? {
            username: (existing.user as any)?.username,
            name: (existing.user as any)?.name
          } : null
        }, { status: 409 });
      }
      
      // If override, delete the previous nomination for this week
      await supabase
        .from("showcase_nominations")
        .delete()
        .eq("nominated_by", user.id)
        .eq("week", week);
    }

    const { error: insertError } = await supabase.from("showcase_nominations").insert({
      user_id: userId,
      nominated_by: user.id,
      week: week,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Ya nominaste a este builder esta semana." }, { status: 409 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Registrar actividad de "new_nomination"
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (targetProfile) {
      await supabase.from("activities").insert({
        user_id: user.id,
        type: "new_nomination",
        data: { targetUsername: targetProfile.username },
      });
    }

    return NextResponse.json({ success: true, week, remaining: 0 });
  } catch (error) {
    console.error("Nominate error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const week = getCurrentWeek();

    const { error } = await supabase
      .from("showcase_nominations")
      .delete()
      .eq("user_id", userId)
      .eq("nominated_by", user.id)
      .eq("week", week);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Un-nominate error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
