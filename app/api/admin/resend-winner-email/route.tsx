import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { WinnerEmail } from "@/components/emails/WinnerEmail";
import React from "react";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");
        const week = searchParams.get("week");

        if (!secret || secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!week) {
            return NextResponse.json({ error: "El parámetro ?week= es requerido (ej: 2026-W10)" }, { status: 400 });
        }

        const adminClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Buscar los ganadores de esa semana
        const { data: winners, error: winnersError } = await adminClient
            .from("showcase_winners")
            .select("user_id")
            .eq("week", week);

        if (winnersError) {
            return NextResponse.json({ error: winnersError.message }, { status: 500 });
        }

        if (!winners || winners.length === 0) {
            return NextResponse.json({ error: `No hay ganadores registrados para la semana ${week}` }, { status: 404 });
        }

        const winnerIds = winners.map(w => w.user_id);

        // Obtener perfiles
        const { data: profiles, error: profilesError } = await adminClient
            .from("profiles")
            .select("id, username, name")
            .in("id", winnerIds);

        if (profilesError || !profiles || profiles.length === 0) {
            return NextResponse.json({ error: "No se encontraron perfiles de los ganadores" }, { status: 404 });
        }

        const emailResults: { username: string; email?: string; sent: boolean; error?: string }[] = [];

        for (const profile of profiles) {
            try {
                const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(profile.id);

                if (authError || !authUser?.user?.email) {
                    emailResults.push({ username: profile.username, sent: false, error: authError?.message || "Sin email en auth.users" });
                    continue;
                }

                const userEmail = authUser.user.email;

                const html = await render(
                    React.createElement(WinnerEmail, {
                        name: profile.name || profile.username,
                        username: profile.username,
                        week: week,
                    })
                );

                await resend.emails.send({
                    from: "hi@huevsite.studio",
                    to: userEmail,
                    subject: "🏆 ¡Sos el builder de la semana en Huevsite!",
                    html,
                });

                console.log(`✅ Email enviado a ${userEmail} (${profile.username})`);
                emailResults.push({ username: profile.username, email: userEmail, sent: true });
            } catch (err: any) {
                console.error(`❌ Error enviando email a ${profile.username}:`, err);
                emailResults.push({ username: profile.username, sent: false, error: err?.message });
            }
        }

        return NextResponse.json({
            success: true,
            week,
            results: emailResults,
        });
    } catch (error) {
        console.error("Resend winner email error:", error);
        return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
    }
}
