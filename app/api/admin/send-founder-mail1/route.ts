import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import {
  FounderMail1Email,
  FOUNDER_MAIL1_NAME_MARKER,
  FOUNDER_MAIL1_SUBJECT,
  FOUNDER_MAIL1_UNSUB_MARKER,
  fillFounderMail1Html,
  founderMail1PreviewText,
} from "@/components/emails/FounderMail1Email";
import { buildUnsubscribeUrl } from "@/lib/email-unsubscribe";
import {
  buildOwnerMatch,
  founderMail1Name,
  founderMail1SkipReason,
  type FounderMail1AuthUser,
  type FounderMail1Profile,
  type FounderMail1SkipReason,
} from "@/lib/founder-mail1-audience";
import { getFounderSeats } from "@/lib/founder-seats";
import { listAllAuthUsers } from "@/lib/list-auth-users";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";
// Full-base send: a few hundred recipients × (100ms throttle + Resend) fits in 300s.
export const maxDuration = 300;

const SENT_KEY = "founder_nov26_mail1_sent";
const THROTTLE_MS = 100;
const FROM_DISPLAY_NAME = "Tomás de huevsite";
const REPLY_TO = "tomidelu@huevsite.com";

// Display name is fixed. The address is FOUNDER_MAIL_FROM_ADDRESS, then EMAIL_FROM,
// then hi@huevsite.studio (the domain Resend has verified). A value that already
// includes "Name <addr>" contributes only the address.
function founderFromHeader(): string {
  const raw = (
    process.env.FOUNDER_MAIL_FROM_ADDRESS ||
    process.env.EMAIL_FROM ||
    "hi@huevsite.studio"
  ).trim();
  const bracketed = raw.match(/<([^<>]+)>/);
  const address = (bracketed ? bracketed[1] : raw).trim();
  return `${FROM_DISPLAY_NAME} <${address}>`;
}

// Constructed on send. `new Resend()` throws when the key is missing, and preview
// must still render with no key and no send.
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/**
 * GET /api/admin/send-founder-mail1 — Mail 1 · Lanzamiento.
 * Manual only. There is no cron.
 *  - secret=<ADMIN_SECRET>   required
 *  - preview=1                render + recipient count + live seats, send nothing
 *  - test_email=<addr>        send only to this address; does not set the sent flag
 *  - force=1                  retry a full send after the sent flag is set
 *  - start_page=N             catch-up: skip the first N-1 pages of 50 auth users
 * Refuses when getFounderSeats() cannot count, or when remaining is 0
 * (the price is USD 129 then, and this copy would be wrong).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const preview = searchParams.get("preview") === "1";
    const testEmail = (searchParams.get("test_email") || "").trim();
    const force = searchParams.get("force") === "1";
    const startPage = Math.max(1, parseInt(searchParams.get("start_page") || "1", 10) || 1);

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seats = await getFounderSeats();
    if (seats.remaining < 0) {
      return NextResponse.json(
        { error: "Could not compute live founder seats — refusing to send a scarcity claim blind." },
        { status: 500 }
      );
    }
    if (seats.remaining === 0) {
      return NextResponse.json(
        { error: "0 seats remaining — Founder is USD 129 now, so this copy would be wrong. Refusing to send." },
        { status: 400 }
      );
    }

    const htmlTemplate = await render(
      React.createElement(FounderMail1Email, {
        remaining: seats.remaining,
        name: FOUNDER_MAIL1_NAME_MARKER,
        unsubscribeUrl: FOUNDER_MAIL1_UNSUB_MARKER,
      })
    );
    if (/badge/i.test(htmlTemplate)) {
      return NextResponse.json(
        { error: "Mail 1 render contains badge wording. Refusing to send." },
        { status: 500 }
      );
    }

    const subject = FOUNDER_MAIL1_SUBJECT;
    const from = founderFromHeader();

    if (preview) {
      const supabase = createServiceRoleClient();
      const audience = await loadAudience(supabase, startPage);
      const { data: flag, error: flagError } = await supabase
        .from("site_settings")
        .select("key")
        .eq("key", SENT_KEY)
        .maybeSingle();
      const sampleHtml = fillFounderMail1Html(htmlTemplate, {
        name: "",
        unsubscribeUrl: buildUnsubscribeUrl("preview"),
      });
      return NextResponse.json({
        preview: true,
        sends: false,
        startPage,
        seats,
        subject,
        from,
        replyTo: REPLY_TO,
        previewText: founderMail1PreviewText(seats.remaining),
        authUsers: audience.authUsers.length,
        eligibleRecipients: audience.eligible.length,
        excluded: audience.excluded,
        alreadySent: flagError ? null : !!flag,
        html: sampleHtml,
      });
    }

    if (testEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
        return NextResponse.json({ error: "test_email is not an email address" }, { status: 400 });
      }
      const resend = getResend();
      if (!resend) {
        return NextResponse.json({ error: "RESEND_API_KEY is not set" }, { status: 500 });
      }
      // One address, looked up on its own. Never the base, never the sent flag.
      const supabase = createServiceRoleClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("email", testEmail)
        .maybeSingle();
      const html = fillFounderMail1Html(htmlTemplate, {
        name: (profile?.name || "").trim(),
        unsubscribeUrl: buildUnsubscribeUrl("test"),
      });
      const sent = await resend.emails.send({
        from,
        replyTo: REPLY_TO,
        to: testEmail,
        subject,
        html,
        headers: listUnsubscribeHeaders(buildUnsubscribeUrl("test")),
      });
      if (sent.error) {
        return NextResponse.json({ error: sent.error.message }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        test: true,
        sentTo: testEmail,
        seats,
        flagSet: false,
      });
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ error: "RESEND_API_KEY is not set" }, { status: 500 });
    }

    const supabase = createServiceRoleClient();
    const { data: existing, error: readError } = await supabase
      .from("site_settings")
      .select("key")
      .eq("key", SENT_KEY)
      .maybeSingle();
    if (readError) {
      return NextResponse.json(
        { error: "site_settings unreachable — refusing to send without a double-send guard" },
        { status: 500 }
      );
    }
    if (existing && !force) {
      return NextResponse.json({ skipped: true, reason: "already_sent" });
    }

    // Resolve the list before the flag, so a failed read can be retried without force.
    // The flag goes in before the first Resend call: a mid-send crash must not leave
    // a second blast one click away. Retry that case with force=1 (and start_page).
    const audience = await loadAudience(supabase, startPage);
    const { error: writeError } = await supabase
      .from("site_settings")
      .upsert({ key: SENT_KEY, value: new Date().toISOString() }, { onConflict: "key" });
    if (writeError) {
      return NextResponse.json(
        { error: "could not set the sent flag — refusing to send without a double-send guard" },
        { status: 500 }
      );
    }
    let emailsSent = 0;
    const errors: string[] = [];
    for (const recipient of audience.eligible) {
      const unsubscribeUrl = buildUnsubscribeUrl(recipient.id);
      const html = fillFounderMail1Html(htmlTemplate, {
        name: recipient.name,
        unsubscribeUrl,
      });
      try {
        const sent = await resend.emails.send({
          from,
          replyTo: REPLY_TO,
          to: recipient.email,
          subject,
          html,
          headers: listUnsubscribeHeaders(unsubscribeUrl),
        });
        if (sent.error) throw new Error(sent.error.message);
        emailsSent++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "send failed";
        errors.push(`${recipient.email}: ${message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      seats,
      startPage,
      eligibleRecipients: audience.eligible.length,
      errors,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Algo salió mal.";
    console.error("[send-founder-mail1] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function listUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

async function listProfiles(supabase: ReturnType<typeof createServiceRoleClient>): Promise<FounderMail1Profile[]> {
  const rows: FounderMail1Profile[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, name, email, community_digest_unsubscribed, is_lifetime, subscription_tier")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = (data || []) as FounderMail1Profile[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

async function loadAudience(supabase: ReturnType<typeof createServiceRoleClient>, startPage: number) {
  const profiles = await listProfiles(supabase);
  const profMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const owner = buildOwnerMatch({
    adminEmails: process.env.ADMIN_EMAILS ?? "",
    adminUsername: process.env.ADMIN_USERNAME ?? "",
    profiles,
  });
  const authUsers = (await listAllAuthUsers(supabase, startPage)) as FounderMail1AuthUser[];
  const excluded: Record<FounderMail1SkipReason, number> = {
    no_email: 0,
    owner: 0,
    unsubscribed: 0,
    lifetime: 0,
    pro: 0,
  };
  const eligible: { id: string; email: string; name: string }[] = [];
  for (const user of authUsers) {
    const profile = profMap.get(user.id);
    const reason = founderMail1SkipReason(user, profile, owner);
    if (reason) {
      excluded[reason] += 1;
      continue;
    }
    eligible.push({
      id: user.id,
      email: user.email!.trim(),
      name: founderMail1Name(user, profile),
    });
  }
  return { authUsers, eligible, excluded };
}
