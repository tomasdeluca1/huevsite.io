import React from "react";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_TRIAL_DAYS, FREE_TRIAL_EMAIL_COPY } from "@/lib/free-trial-campaign";
import { hasPaidProBadge } from "@/lib/pro-access";
import { sendRenderedEmail } from "@/lib/email";
import { TrialLifecycleEmail } from "@/components/emails/TrialLifecycleEmail";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, name, image, github_handle, tagline, subscription_tier, pro_since, referral_reward_expires_at, free_trial_claimed_at, is_profile_verified")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    if (profile.free_trial_claimed_at) {
      return NextResponse.json({ error: "La prueba gratis ya fue usada en esta cuenta." }, { status: 409 });
    }

    if (hasPaidProBadge(profile)) {
      return NextResponse.json({ error: "Tu cuenta ya tiene acceso Pro." }, { status: 409 });
    }

    const isCompleteEnough = Boolean(profile.name && profile.image && profile.github_handle && profile.tagline);
    if (!profile.is_profile_verified && !isCompleteEnough) {
      return NextResponse.json({
        error: "Completá mejor tu perfil antes de activar la prueba gratis.",
      }, { status: 400 });
    }

    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + FREE_TRIAL_DAYS);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        free_trial_claimed_at: now.toISOString(),
        free_trial_started_at: now.toISOString(),
        free_trial_ends_at: endsAt.toISOString(),
        free_trial_last_insights_viewed_at: null,
        free_trial_welcome_email_sent_at: now.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "No se pudo activar la prueba gratis." }, { status: 500 });
    }

    if (profile.email || user.email) {
      const copy = FREE_TRIAL_EMAIL_COPY.welcome;
      await sendRenderedEmail({
        to: profile.email || user.email!,
        subject: copy.subject,
        react: React.createElement(TrialLifecycleEmail, {
          eyebrow: copy.eyebrow,
          title: copy.title,
          body: copy.body,
          cta: copy.cta,
          ctaHref: copy.ctaHref,
          previewText: copy.preview,
        }),
      }).catch((err) => {
        console.error("Free trial welcome email error:", err);
      });
    }

    return NextResponse.json({
      success: true,
      trialEndsAt: endsAt.toISOString(),
      message: "Tu prueba gratis de 14 días ya está activa.",
    });
  } catch (error: any) {
    console.error("Free trial claim error:", error);
    return NextResponse.json({ error: error.message || "No se pudo activar la prueba gratis." }, { status: 500 });
  }
}
