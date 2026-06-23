import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { WinnerEmail } from "@/components/emails/WinnerEmail";
import React from "react";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const adminClient = await getAdminClient(request);
        if (!adminClient) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const week = searchParams.get("week");

        if (!week) {
            return NextResponse.json({ error: "El parámetro ?week= es requerido (ej: 2026-W10)" }, { status: 400 });
        }

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

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io";
        const emailResults: { username: string; email?: string; sent: boolean; formUrl?: string; error?: string }[] = [];

        for (const profile of profiles) {
            try {
                const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(profile.id);

                if (authError || !authUser?.user?.email) {
                    emailResults.push({ username: profile.username, sent: false, error: authError?.message || "Sin email en auth.users" });
                    continue;
                }

                const userEmail = authUser.user.email;

                // Create or reuse interview invitation
                let formUrl: string | undefined;
                const { data: existingInterview } = await adminClient
                    .from("builder_interviews")
                    .select("id, token, status")
                    .eq("builder_username", profile.username)
                    .in("status", ["invited", "submitted", "generating", "ready"])
                    .maybeSingle();

                if (existingInterview) {
                    formUrl = `${siteUrl}/builder-de-la-semana/${existingInterview.token}`;
                } else {
                    const token = crypto.randomBytes(32).toString("hex");
                    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                    const { error: interviewErr } = await adminClient
                        .from("builder_interviews")
                        .insert({
                            token,
                            builder_username: profile.username,
                            builder_email: userEmail,
                            builder_name: profile.name || profile.username,
                            expires_at: expiresAt,
                            status: "invited",
                        });

                    if (!interviewErr) {
                        formUrl = `${siteUrl}/builder-de-la-semana/${token}`;
                    }
                }

                const html = await render(
                    React.createElement(WinnerEmail, {
                        name: profile.name || profile.username,
                        username: profile.username,
                        week: week,
                        formUrl,
                    })
                );

                await resend.emails.send({
                    from: process.env.EMAIL_FROM || "hi@huevsite.studio",
                    to: userEmail,
                    subject: "🏆 ¡Sos el builder de la semana en Huevsite!",
                    html,
                });

                console.log(`✅ Email enviado a ${userEmail} (${profile.username})`);
                emailResults.push({ username: profile.username, email: userEmail, sent: true, formUrl });
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
