import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { getWeekString } from "@/lib/showcase-service";
import { WinnerEmail } from "@/components/emails/WinnerEmail";
import React from "react";
import { postBuilderOfTheWeek } from "@/lib/twitter";
import { resolveXHandles } from "@/lib/twitter-utils";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// Para obtener la semana anterior (útil si el cron corre apenas empieza la nueva)
function getPreviousWeek(): string {
  // Si corre el Lunes a la madrugada, "ayer" siempre es parte de la semana que queremos cerrar.
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return getWeekString(yesterday);
}

async function isAdmin(request: NextRequest, secret: string | null) {
  // 1. Check for Cron/Admin secrets first (for automated jobs)
  const authHeader = request.headers.get("authorization");
  
  // Vercel Crons send "Bearer <token>"
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    console.log("Authenticated via CRON_SECRET");
    return true;
  }
  
  if (secret && secret === process.env.ADMIN_SECRET) {
    console.log("Authenticated via ADMIN_SECRET query param");
    return true;
  }

  // 2. Check for User session (for manual trigger)
  // We use the service role client here to check the profile, to avoid cookie issues in some environments
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // For manual triggers, we might still have a session if called from the same browser
  // But usually this will be called via curl or cron
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profile?.username === 'huevsite') {
      console.log("Authenticated via user session:", profile.username);
      return true;
    }
  }

  console.warn("Authentication failed for pick-winner cron", { 
    hasAuthHeader: !!authHeader, 
    hasSecret: !!secret 
  });
  return false;
}

async function handlePickWinner(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const requestedWeek = searchParams.get("week");

    if (!await isAdmin(request, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Si el cron corre el Domingo (nuevo ciclo para el usuario),
    // probablemente quiere cerrar la semana que pasó.
    const week = requestedWeek || getPreviousWeek();

    // Use service role client to bypass RLS
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // 5. Obtener emails desde auth.users usando service role (NO están en profiles)
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const emailResults: { username: string; sent: boolean; error?: string }[] = [];

    for (const winnerProfile of winnerProfiles) {
      try {
        console.log(`Buscando email para ${winnerProfile.username}...`);
        const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(winnerProfile.id);

        if (authError || !authUser?.user?.email) {
          console.error(`No se encontró email para ${winnerProfile.username}:`, authError?.message);
          emailResults.push({ username: winnerProfile.username, sent: false, error: authError?.message || "Sin email en auth.users" });
          continue;
        }

        const userEmail = authUser.user.email;

        const html = await render(
          React.createElement(WinnerEmail, {
            name: winnerProfile.name || winnerProfile.username,
            username: winnerProfile.username,
            week,
          })
        );

        await resend.emails.send({
          from: 'hi@huevsite.studio',
          to: userEmail,
          subject: '🏆 ¡Sos el builder de la semana en Huevsite!',
          html,
        });

        console.log(`✅ Email enviado a ${userEmail} (${winnerProfile.username})`);
        emailResults.push({ username: winnerProfile.username, sent: true });
      } catch (emailErr: any) {
        console.error(`❌ Error enviando email a ${winnerProfile.username}:`, emailErr);
        emailResults.push({ username: winnerProfile.username, sent: false, error: emailErr?.message });
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
            mention: mentionsMap[f.username] || `@${f.username}`,
            count: f.count
          }));

        await postBuilderOfTheWeek(winnerMention, week, winnerProfile.name || winnerProfile.username, otherFinalists);
        console.log(`✅ Tweet enviado para ${winnerProfile.username}`);
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
      emails: emailResults,
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
