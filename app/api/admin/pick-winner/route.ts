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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    // Simple auth check via environment variable
    if (!secret || secret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const week = getCurrentWeek();
    const supabase = await createClient();

    // 1. Get the showcase winner for this week if one already exists
    const { data: existingWinner } = await supabase
      .from("showcase_winners")
      .select("id")
      .eq("week", week)
      .maybeSingle();

    if (existingWinner) {
      return NextResponse.json({ error: "Winner already picked for this week" }, { status: 400 });
    }

    // 2. Count nominations
    const { data: nominations, error: nomError } = await supabase
      .from("showcase_nominations")
      .select("user_id")
      .eq("week", week);

    if (nomError) {
      return NextResponse.json({ error: nomError.message }, { status: 500 });
    }

    if (!nominations || nominations.length === 0) {
      return NextResponse.json({ message: "No nominations found for this week." }, { status: 200 });
    }

    // Tally up the votes
    const votes: Record<string, number> = {};
    for (const nom of nominations) {
      votes[nom.user_id] = (votes[nom.user_id] || 0) + 1;
    }

    // Find the max voted user
    let winnerId = null;
    let maxVotes = 0;
    for (const [userId, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        winnerId = userId;
      }
    }

    if (!winnerId) {
      return NextResponse.json({ message: "No winner could be determined" }, { status: 400 });
    }

    // 3. Insert the winner
    const { error: winError } = await supabase
      .from("showcase_winners")
      .insert({
        user_id: winnerId,
        week: week,
      });

    if (winError) {
      return NextResponse.json({ error: winError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      winnerId: winnerId, 
      votes: maxVotes,
      week: week 
    }, { status: 200 });

  } catch (error) {
    console.error("Pick winner error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
