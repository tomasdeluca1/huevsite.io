import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { getWeekString } from "@/lib/showcase-service";
import { WinnerEmail } from "@/components/emails/WinnerEmail";
import React from "react";
import { postBuilderOfTheWeek } from "@/lib/twitter";
import { resolveXHandles } from "@/lib/twitter-utils";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// Para obtener la semana anterior (útil si el cron corre apenas empieza la nueva)
function getPreviousWeek(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return getWeekString(yesterday);
}

async function handlePickWinner(request: NextRequest) {
  try {
    const supabase = await getAdminClient(request);
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedWeek = searchParams.get("week");

    // Si el cron corre el Domingo (nuevo ciclo para el usuario),
    // probablemente quiere cerrar la semana que pasó.
    const week = requestedWeek || getPreviousWeek();

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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io";
    const emailResults: { username: string; sent: boolean; formUrl?: string; error?: string }[] = [];

    for (const winnerProfile of winnerProfiles) {
      try {
        console.log(`Buscando email para ${winnerProfile.username}...`);
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(winnerProfile.id);

        if (authError || !authUser?.user?.email) {
          console.error(`No se encontró email para ${winnerProfile.username}:`, authError?.message);
          emailResults.push({ username: winnerProfile.username, sent: false, error: authError?.message || "Sin email en auth.users" });
          continue;
        }

        const userEmail = authUser.user.email;

        // Auto-create builder interview invitation (skip if one already exists)
        let formUrl: string | undefined;
        const { data: existingInterview } = await supabase
          .from("builder_interviews")
          .select("id, token, status")
          .eq("builder_username", winnerProfile.username)
          .in("status", ["invited", "submitted", "generating", "ready"])
          .maybeSingle();

        if (existingInterview) {
          formUrl = `${siteUrl}/builder-de-la-semana/${existingInterview.token}`;
          console.log(`Interview ya existe para ${winnerProfile.username}, reutilizando token`);
        } else {
          const token = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          const { error: interviewErr } = await supabase
            .from("builder_interviews")
            .insert({
              token,
              builder_username: winnerProfile.username,
              builder_email: userEmail,
              builder_name: winnerProfile.name || winnerProfile.username,
              expires_at: expiresAt,
              status: "invited",
            });

          if (interviewErr) {
            console.error(`Error creando interview para ${winnerProfile.username}:`, interviewErr);
          } else {
            formUrl = `${siteUrl}/builder-de-la-semana/${token}`;
            console.log(`✅ Interview creada para ${winnerProfile.username}`);
          }
        }

        const html = await render(
          React.createElement(WinnerEmail, {
            name: winnerProfile.name || winnerProfile.username,
            username: winnerProfile.username,
            week,
            formUrl,
          })
        );

        await resend.emails.send({
          from: 'hi@huevsite.studio',
          to: userEmail,
          subject: '🏆 ¡Sos el builder de la semana en Huevsite!',
          html,
        });

        console.log(`✅ Email enviado a ${userEmail} (${winnerProfile.username})`);
        emailResults.push({ username: winnerProfile.username, sent: true, formUrl });
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
