import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { postBuilderOfTheWeek } from "@/lib/twitter";
import { resolveXHandles } from "@/lib/twitter-utils";

export const dynamic = "force-dynamic";

// POST /api/admin/showcase-winner — alternar winner de la semana
export async function POST(request: NextRequest) {
  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { userId, week } = await request.json();

    if (!userId || !week) {
      return NextResponse.json({ error: "userId y week son requeridos." }, { status: 400 });
    }

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

      // Publicar en X (Twitter)
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, name")
          .eq("id", userId)
          .single();
        
        if (profile) {
          // Obtener otros nominados para el tweet
          const { data: nominations } = await supabase
            .from("showcase_nominations")
            .select(`
              user_id,
              user:profiles!showcase_nominations_user_id_fkey (username)
            `)
            .eq("week", week);
          
          const counts = (nominations ?? []).reduce<Record<string, { count: number; username: string }>>((acc, n: any) => {
            if (n.user_id === userId) return acc;
            if (!acc[n.user_id]) acc[n.user_id] = { count: 0, username: n.user?.username || "unknown" };
            acc[n.user_id].count++;
            return acc;
          }, {});

          const finalists = Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

          const allUsernames = [profile.username, ...finalists.map(f => f.username)];
          const mentionsMap = await resolveXHandles(allUsernames);

          const winnerMention = mentionsMap[profile.username];
          const finalistsWithMentions = finalists.map(f => ({
            mention: mentionsMap[f.username] || `@${f.username}`,
            count: f.count
          }));

          await postBuilderOfTheWeek(winnerMention, week, profile.name || undefined, finalistsWithMentions);
        }
      } catch (twitterErr) {
        console.error("Error publicando en X:", twitterErr);
      }

      return NextResponse.json({ success: true, action: 'added', winner: data });
    }
  } catch (error: any) {
    console.error("Set showcase winner error:", error);
    return NextResponse.json({ error: error.message || "Algo salió mal." }, { status: 500 });
  }
}

// DELETE /api/admin/showcase-winner — limpiar todos los winners de una semana
export async function DELETE(request: NextRequest) {
  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week requerida" }, { status: 400 });

  await supabase.from("showcase_winners").delete().eq("week", week);
  return NextResponse.json({ success: true });
}

