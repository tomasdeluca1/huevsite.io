import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { FREE_TRIAL_EMAIL_COPY, FreeTrialEmailStage } from "@/lib/free-trial-campaign";
import { sendRenderedEmail } from "@/lib/email";
import { TrialLifecycleEmail } from "@/components/emails/TrialLifecycleEmail";

export const dynamic = "force-dynamic";

const STAGES: FreeTrialEmailStage[] = ["launch", "welcome", "activation", "expiring", "expired", "last_chance"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  if (!await getAdminClient(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const to = searchParams.get("to") || "huevsite.studio@gmail.com";
  const results: { stage: string; success: boolean; error?: string }[] = [];

  for (const stage of STAGES) {
    const copy = FREE_TRIAL_EMAIL_COPY[stage];
    try {
      await sendRenderedEmail({
        to,
        subject: `[TEST] ${copy.subject}`,
        react: React.createElement(TrialLifecycleEmail, {
          eyebrow: copy.eyebrow,
          title: copy.title,
          body: copy.body,
          cta: copy.cta,
          ctaHref: copy.ctaHref,
          previewText: copy.preview,
        }),
      });
      results.push({ stage, success: true });
    } catch (err: any) {
      results.push({ stage, success: false, error: err.message });
    }
    await sleep(2000);
  }

  return NextResponse.json({ success: true, to, results });
}
