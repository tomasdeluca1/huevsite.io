import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
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

    const { data, error } = await supabase
      .from("showcase_nominations")
      .select("id")
      .eq("user_id", userId)
      .eq("nominated_by", user.id)
      .eq("week", week)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ hasNominated: !!data }, { status: 200 });
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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: "No podés nominarte a vos mismo." }, { status: 400 });
    }

    const week = getCurrentWeek();

    const { error } = await supabase.from("showcase_nominations").insert({
      user_id: userId,
      nominated_by: user.id,
      week,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ya nominaste a alguien esta semana." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, week });
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
