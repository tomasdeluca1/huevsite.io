import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { sendRenderedEmail } from "@/lib/email";
import { BuilderInvitationEmail } from "@/components/emails/BuilderInvitationEmail";
import crypto from "crypto";
import React from "react";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json({ error: "username es requerido." }, { status: 400 });
    }


    // Look up builder profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, name, email, image")
      .eq("username", username)
      .single();

    if (!profile) {
      return NextResponse.json({ error: `Builder @${username} no encontrado.` }, { status: 404 });
    }

    // Get builder email from auth
    let builderEmail = profile.email;
    if (!builderEmail) {
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
      builderEmail = user?.email ?? null;
    }

    if (!builderEmail) {
      return NextResponse.json({ error: `Builder @${username} no tiene email.` }, { status: 400 });
    }

    // Check for existing active invitation
    const { data: existing } = await supabase
      .from("builder_interviews")
      .select("id, status")
      .eq("builder_username", username)
      .in("status", ["invited", "submitted", "generating", "ready"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe una entrevista activa para @${username} (status: ${existing.status}).` },
        { status: 409 }
      );
    }

    // Generate token and create invitation
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: interview, error } = await supabase
      .from("builder_interviews")
      .insert({
        token,
        builder_username: profile.username,
        builder_email: builderEmail,
        builder_name: profile.name || profile.username,
        expires_at: expiresAt,
        status: "invited",
      })
      .select()
      .single();

    if (error) throw error;

    // Send invitation email
    const formUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/builder-de-la-semana/${token}`;
    await sendRenderedEmail({
      to: builderEmail,
      subject: "🏆 Fuiste elegido como Builder de la Semana en huevsite.io",
      react: React.createElement(BuilderInvitationEmail, {
        name: profile.name || profile.username,
        username: profile.username,
        formUrl,
      }),
    });

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        username: profile.username,
        email: builderEmail,
        formUrl,
      },
    });
  } catch (error: any) {
    console.error("Invite builder error:", error);
    return NextResponse.json({ error: error.message || "Algo salió mal." }, { status: 500 });
  }
}
