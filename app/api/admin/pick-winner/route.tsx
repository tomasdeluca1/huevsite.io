import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { getWeekString, getCurrentWeek } from "@/lib/showcase-service";
import { postBuilderOfTheWeek } from "@/lib/twitter";
import { postBuilderOfTheWeekLinkedIn } from "@/lib/linkedin";
import { resolveXHandles } from "@/lib/twitter-utils";
import {
  processWinnerForWeek,
  regenerateJointCarouselForWeek,
  type ProcessResult,
} from "@/lib/bdls-content-pipeline";

export const dynamic = "force-dynamic";

// The "week to close" is the ISO week that just ended in Argentina time.
// - If the cron fires Sunday 23:00 ART (= Mon 02:00 UTC), today's argDay is
//   Sun (0); the week ends today, so close the current ISO week.
// - If it fires Monday early (any time before next Saturday in ART),
//   yesterday is part of the just-closed week, so use yesterday's ISO week.
// This is robust to clock drift and to manual reruns hours after the cron
// time, which is what bit us when the W17 pick fired at 07:36 UTC.
function getWeekToClose(): string {
  const argNow = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const argDay = argNow.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  if (argDay === 0) {
    return getCurrentWeek();
  }
  return getWeekString(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

async function handlePickWinner(request: NextRequest) {
  try {
    const supabase = await getAdminClient(request);
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedWeek = searchParams.get("week");
    const force = searchParams.get("force") === "1";

    const computedWeek = getWeekToClose();
    const week = requestedWeek || computedWeek;

    // Guard against premature picks. Picking a week that hasn't ended yet
    // (= the current ISO week, or any future week) closes the voting window
    // before users have actually had time to nominate, and freezes the
    // tally to whatever was in the table when the call ran. That's exactly
    // how W17 ended up locked to a single early nomination on Apr 20 even
    // though the week ran through Apr 26. Require ?force=1 to override.
    const currentWeek = getCurrentWeek();
    if (week >= currentWeek && !force) {
      return NextResponse.json(
        {
          error: `La semana ${week} todavía está en curso. Esperá al cierre o usá ?force=1 para forzar.`,
          currentWeek,
        },
        { status: 400 }
      );
    }

    // 1. Verificar si ya hay ganador para esa semana
    const { data: existingWinner } = await supabase
      .from("showcase_winners")
      .select("id")
      .eq("week", week)
      .maybeSingle();

    if (existingWinner) {
      return NextResponse.json({ error: `El ganador de la semana ${week} ya fue elegido.` }, { status: 400 });
    }

    // 2. Contar nominaciones de esa semana
    const { data: nominations, error: nomError } = await supabase
      .from("showcase_nominations")
      .select("user_id")
      .eq("week", week);

    if (nomError) {
      return NextResponse.json({ error: nomError.message }, { status: 500 });
    }

    if (!nominations || nominations.length === 0) {
      return NextResponse.json({ message: `No hay nominaciones para la semana ${week}.` }, { status: 200 });
    }

    // Tally up the votes
    const votes: Record<string, number> = {};
    for (const nom of nominations) {
      votes[nom.user_id] = (votes[nom.user_id] || 0) + 1;
    }

    // Find the max voted user(s)
    let maxVotes = 0;
    for (const count of Object.values(votes)) {
      if (count > maxVotes) maxVotes = count;
    }

    const winnerIds = Object.keys(votes).filter(id => votes[id] === maxVotes);

    if (winnerIds.length === 0) {
      return NextResponse.json({ message: "No se pudo determinar un ganador." }, { status: 400 });
    }

    // 3. Obtener datos de los ganadores desde profiles (sin email, que solo está en auth.users)
    const { data: winnerProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, name")
      .in("id", winnerIds);

    if (profileError || !winnerProfiles || winnerProfiles.length === 0) {
      return NextResponse.json({ error: "No se encontró el perfil de los ganadores." }, { status: 404 });
    }

    // Getting top nominees for Twitter
    const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    const topNomineeIds = sortedVotes.slice(0, 5).map(([id]) => id);
    const { data: topNomineeProfiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", topNomineeIds);
    
    const finalistsForTweet = sortedVotes.slice(0, 5).map(([id, count]) => {
      const p = topNomineeProfiles?.find(tp => tp.id === id);
      return { username: p?.username || "unknown", count };
    }).filter(f => f.username !== "unknown");

    // 4. Ejecutar función RPC que realiza todas las inserciones/borrados DB de forma segura
    const { error: rpcError } = await supabase.rpc('admin_pick_winner', {
      p_week: week,
      p_winner_ids: winnerIds,
      p_secret: process.env.ADMIN_SECRET
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    // 5. Para cada winner: armar blog draft + interview row + email + drafts
    //    de Typefully a través del pipeline compartido. El pipeline reusa
    //    el form previo del builder si está dentro de los últimos 60 días,
    //    o sintetiza desde su perfil/blocks si no.
    const fullProfileSelect = "id, username, name, tagline, location, github_handle, image";
    const { data: enrichedProfiles } = await supabase
      .from("profiles")
      .select(fullProfileSelect)
      .in("id", winnerIds);

    const results: ProcessResult[] = [];
    for (const winnerProfile of (enrichedProfiles || winnerProfiles)) {
      try {
        const r = await processWinnerForWeek(supabase, {
          profile: winnerProfile as any,
          week,
          sendEmail: true,
        });
        results.push(r);
        console.log(`✅ Pipeline OK ${winnerProfile.username} (${r.source})`);
      } catch (err: any) {
        console.error(`❌ Pipeline error ${winnerProfile.username}:`, err);
        results.push({
          username: winnerProfile.username,
          blogPostId: null,
          interviewId: null,
          formUrl: null,
          source: "synthesized",
          emailSent: false,
          emailError: err?.message || String(err),
        });
      }
    }

    // Multi-winner: regenerar el carrusel JOINT una sola vez después de
    // armar todos los individuales.
    if (winnerProfiles.length >= 2) {
      try {
        await regenerateJointCarouselForWeek(supabase, week);
      } catch (e) {
        console.error("Joint carousel regen error (non-fatal):", e);
      }
    }

    // 6. Publicar en X (Twitter)
    try {
      const allUsernames = [...winnerProfiles.map(w => w.username), ...finalistsForTweet.map(f => f.username)];
      const mentionsMap = await resolveXHandles(allUsernames);

      for (const winnerProfile of winnerProfiles) {
        console.log(`Publicando en X para ${winnerProfile.username}...`);
        const winnerMention = mentionsMap[winnerProfile.username];
        
        // We filter out the winner from the finalists for the "Top 3 was" list
        const otherFinalists = finalistsForTweet
          .filter(f => f.username !== winnerProfile.username)
          .map(f => ({
            // Plain username fallback — @ is reserved for real X handles.
            mention: mentionsMap[f.username] || f.username,
            count: f.count
          }));

        await postBuilderOfTheWeek(winnerMention, week, winnerProfile.name || winnerProfile.username, otherFinalists, winnerProfile.username);
        console.log(`✅ Tweet enviado para ${winnerProfile.username}`);

        // Mismo anuncio en la página de LinkedIn de huevsite.io (no-fatal).
        try {
          await postBuilderOfTheWeekLinkedIn(
            { name: winnerProfile.name || winnerProfile.username, username: winnerProfile.username },
            week,
            finalistsForTweet
              .filter(f => f.username !== winnerProfile.username)
              .map(f => ({ name: f.username, count: f.count }))
          );
          console.log(`✅ LinkedIn post enviado para ${winnerProfile.username}`);
        } catch (liErr) {
          console.error("❌ Error publicando en LinkedIn:", liErr);
        }
      }
    } catch (twitterErr: any) {
      console.error("❌ Error publicando en X:", twitterErr);
      // No fallamos toda la request si falla Twitter
    }

    return NextResponse.json({
      success: true,
      winners: winnerProfiles.map(w => w.username),
      week,
      votes: maxVotes,
      results,
    }, { status: 200 });

  } catch (error) {
    console.error("Pick winner error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}

// Vercel Cron Jobs use GET – this is the main entry point
export async function GET(request: NextRequest) {
  return handlePickWinner(request);
}

// Manual admin calls can use POST
export async function POST(request: NextRequest) {
  return handlePickWinner(request);
}
