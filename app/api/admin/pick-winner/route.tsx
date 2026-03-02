import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { getWeekString } from "@/lib/showcase-service";
import { WinnerEmail } from "@/components/emails/WinnerEmail";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// Para obtener la semana anterior (útil si el cron corre apenas empieza la nueva)
function getPreviousWeek(): string {
  const prev = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return getWeekString(prev);
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const requestedWeek = searchParams.get("week");

    // Check auth via Vercel CRON_SECRET or ADMIN_SECRET
    const authHeader = request.headers.get("authorization");
    const isValidCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isValidAdmin = secret && secret === process.env.ADMIN_SECRET;

    if (!isValidCron && !isValidAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Si el cron corre el Domingo (nuevo ciclo para el usuario), 
    // probablemente quiere cerrar la semana que pasó.
    const week = requestedWeek || getPreviousWeek();
    
    // Use standard authenticated client
    const supabase = createClient();

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

    // 3. Obtener datos de los ganadores (email, nombre)
    const { data: winnerProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, name, email")
      .in("id", winnerIds);

    if (profileError || !winnerProfiles || winnerProfiles.length === 0) {
      return NextResponse.json({ error: "No se encontró el perfil de los ganadores." }, { status: 404 });
    }

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

    // 5. Enviar Email con Resend a todos los ganadores
    for (const winnerProfile of winnerProfiles) {
      if (winnerProfile.email) {
        try {
          await resend.emails.send({
            from: 'hi@huevsite.studio',
            to: winnerProfile.email,
            subject: '🏆 ¡Sos el builder de la semana en Huevsite!',
            react: <WinnerEmail 
              name={winnerProfile.name || winnerProfile.username} 
              username={winnerProfile.username} 
              week={week} 
            />,
          });
          console.log(`Email enviado a ${winnerProfile.email}`);
        } catch (emailErr) {
          console.error("Error enviando email:", emailErr);
          // No fallamos el request si falla el email
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      winners: winnerProfiles.map(w => w.username), 
      week: week,
      votes: maxVotes
    }, { status: 200 });

  } catch (error) {
    console.error("Pick winner error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
