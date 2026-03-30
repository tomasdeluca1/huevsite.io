import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { FREE_TRIAL_EMAIL_COPY } from "@/lib/free-trial-campaign";
import { sendRenderedEmail } from "@/lib/email";
import { TrialLifecycleEmail } from "@/components/emails/TrialLifecycleEmail";
import { hasPaidProBadge } from "@/lib/pro-access";

export const dynamic = "force-dynamic";

type TrialProfileRow = {
  id: string;
  email: string | null;
  subscription_tier: string | null;
  pro_since: string | null;
  referral_reward_expires_at: string | null;
  free_trial_claimed_at: string | null;
  free_trial_started_at: string | null;
  free_trial_ends_at: string | null;
  free_trial_last_insights_viewed_at: string | null;
  free_trial_launch_email_sent_at: string | null;
  free_trial_activation_email_sent_at: string | null;
  free_trial_expiring_email_sent_at: string | null;
  free_trial_expired_email_sent_at: string | null;
  free_trial_last_chance_email_sent_at: string | null;
};

async function sendStageEmail(profile: TrialProfileRow, stage: keyof typeof FREE_TRIAL_EMAIL_COPY) {
  if (!profile.email) return false;

  const copy = FREE_TRIAL_EMAIL_COPY[stage];
  await sendRenderedEmail({
    to: profile.email,
    subject: copy.subject,
    react: React.createElement(TrialLifecycleEmail, {
      eyebrow: copy.eyebrow,
      title: copy.title,
      body: copy.body,
      cta: copy.cta,
      ctaHref: copy.ctaHref,
      previewText: copy.preview,
    }),
  });

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    const isCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isAdminSecret = secret && secret === process.env.ADMIN_SECRET;

    if (!isCron && !isAdminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, subscription_tier, pro_since, referral_reward_expires_at, free_trial_claimed_at, free_trial_started_at, free_trial_ends_at, free_trial_last_insights_viewed_at, free_trial_launch_email_sent_at, free_trial_activation_email_sent_at, free_trial_expiring_email_sent_at, free_trial_expired_email_sent_at, free_trial_last_chance_email_sent_at")
      .or("free_trial_claimed_at.not.is.null,free_trial_launch_email_sent_at.is.null");

    if (error) throw error;

    let launchEmails = 0;
    let activationEmails = 0;
    let expiringEmails = 0;
    let expiredEmails = 0;
    let lastChanceEmails = 0;
    let emailsSentThisRun = 0;

    const delayBetweenEmails = () =>
      emailsSentThisRun > 0
        ? new Promise((r) => setTimeout(r, 1500))
        : Promise.resolve();

    for (const profile of (profiles || []) as TrialProfileRow[]) {
      if (!profile.email) continue;
      if (hasPaidProBadge(profile)) continue;

      const endsAt = profile.free_trial_ends_at ? new Date(profile.free_trial_ends_at) : null;
      const startedAt = profile.free_trial_started_at ? new Date(profile.free_trial_started_at) : null;

      if (!profile.free_trial_claimed_at && !profile.free_trial_launch_email_sent_at) {
        await delayBetweenEmails();
        const sent = await sendStageEmail(profile, "launch").catch((err) => {
          console.error("Free trial launch email error:", err);
          return false;
        });
        if (sent) {
          launchEmails += 1;
          emailsSentThisRun += 1;
          await supabase.from("profiles").update({ free_trial_launch_email_sent_at: now.toISOString() }).eq("id", profile.id);
        }
        continue;
      }

      if (!endsAt || !startedAt) continue;

      const elapsedDays = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilExpiry = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (elapsedDays >= 3 && !profile.free_trial_activation_email_sent_at && now < endsAt) {
        await delayBetweenEmails();
        const sent = await sendStageEmail(profile, "activation").catch((err) => {
          console.error("Free trial activation email error:", err);
          return false;
        });
        if (sent) {
          activationEmails += 1;
          emailsSentThisRun += 1;
          await supabase.from("profiles").update({ free_trial_activation_email_sent_at: now.toISOString() }).eq("id", profile.id);
        }
      }

      if (daysUntilExpiry <= 2 && now < endsAt && !profile.free_trial_expiring_email_sent_at) {
        await delayBetweenEmails();
        const sent = await sendStageEmail(profile, "expiring").catch((err) => {
          console.error("Free trial expiring email error:", err);
          return false;
        });
        if (sent) {
          expiringEmails += 1;
          emailsSentThisRun += 1;
          await supabase.from("profiles").update({ free_trial_expiring_email_sent_at: now.toISOString() }).eq("id", profile.id);
        }
      }

      if (now >= endsAt && !profile.free_trial_expired_email_sent_at) {
        await delayBetweenEmails();
        const sent = await sendStageEmail(profile, "expired").catch((err) => {
          console.error("Free trial expired email error:", err);
          return false;
        });
        if (sent) {
          expiredEmails += 1;
          emailsSentThisRun += 1;
          await supabase.from("profiles").update({ free_trial_expired_email_sent_at: now.toISOString() }).eq("id", profile.id);
        }
      }

      if (now.getTime() - endsAt.getTime() >= 24 * 60 * 60 * 1000 && !profile.free_trial_last_chance_email_sent_at) {
        await delayBetweenEmails();
        const sent = await sendStageEmail(profile, "last_chance").catch((err) => {
          console.error("Free trial last chance email error:", err);
          return false;
        });
        if (sent) {
          lastChanceEmails += 1;
          emailsSentThisRun += 1;
          await supabase.from("profiles").update({ free_trial_last_chance_email_sent_at: now.toISOString() }).eq("id", profile.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      launchEmails,
      activationEmails,
      expiringEmails,
      expiredEmails,
      lastChanceEmails,
    });
  } catch (error: any) {
    console.error("Free trial lifecycle cron error:", error);
    return NextResponse.json({ error: error.message || "Algo salió mal." }, { status: 500 });
  }
}
