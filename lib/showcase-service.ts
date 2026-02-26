import { createClient } from "@/lib/supabase/server";

function getWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getCurrentWeek(): string {
  return getWeekString(new Date());
}

export async function getShowcaseData(requestedWeek?: string | null) {
  const currentWeek = requestedWeek || getCurrentWeek();

  try {
    const supabase = await createClient();

    // Winner: Intentar buscar por week específica, si no, traer la week del más reciente
    let targetWeek = requestedWeek;

    if (!targetWeek) {
      const { data: latestWinner } = await supabase
        .from("showcase_winners")
        .select("week")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (latestWinner) {
        targetWeek = latestWinner.week;
      }
    }

    let winners: any[] = [];
    if (targetWeek) {
      const { data: winnerData, error: winnerError } = await supabase
        .from("showcase_winners")
        .select(`
          week,
          user:profiles!showcase_winners_user_id_fkey (
            id, username, name, image, accent_color, tagline,
            blocks:blocks (*)
          )
        `)
        .eq("week", targetWeek);

      if (winnerError) {
        console.error("Winner query error:", winnerError);
      } else if (winnerData) {
        winners = winnerData;
      }
    }

    // Top 5 nominados de la semana ACTUAL
    const { data: nominations, error: nomError } = await supabase
      .from("showcase_nominations")
      .select(`
        user_id,
        user:profiles!showcase_nominations_user_id_fkey (
          id, username, name, image, accent_color
        )
      `)
      .eq("week", currentWeek);

    if (nomError) {
      console.error("Nominations query error:", nomError);
    }

    // Contar nominaciones por usuario
    const counts = (nominations ?? []).reduce<Record<string, { count: number; user: any }>>((acc, n: any) => {
      if (!acc[n.user_id]) acc[n.user_id] = { count: 0, user: n.user };
      acc[n.user_id].count++;
      return acc;
    }, {});

    const finalists = Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([userId, data]) => ({ userId, count: data.count, user: data.user }));

    return { 
      week: currentWeek, 
      winners: winners, 
      finalists 
    };
  } catch (error) {
    console.error("Showcase service error:", error);
    return { week: currentWeek, winners: [], finalists: [] };
  }
}
