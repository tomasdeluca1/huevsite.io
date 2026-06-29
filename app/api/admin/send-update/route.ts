import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { ProductUpdateEmail } from "@/components/emails/ProductUpdateEmail";
import { buildUnsubscribeUrl } from "@/lib/email-unsubscribe";
import { listAllAuthUsers } from "@/lib/list-auth-users";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
// Sending to the whole base (~250) at ~100ms/email would exceed the default
// function timeout and cut off mid-send. 60s gives margin for one full pass.
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const UNSUB_MARKER = "__UNSUB_URL__";

// The recent batch of features being announced. Edit this list before sending.
// Current campaign: the Builders Hunt launch (2026-06-29).
const FEATURES = [
  {
    emoji: "🚀",
    title: "Builders Hunt",
    blurb: "Un feed semanal de lanzamientos: mostrá tu proyecto, la comunidad lo vota ▲, y cada semana arranca de cero. Lanzá lo que estás construyendo.",
    slug: "lanzamos-builders-hunt-el-feed-semanal-de-lanzamientos",
  },
  {
    emoji: "🧭",
    title: "Descubrimiento unificado",
    blurb: "Builders Hunt, Explorar y Ranking ahora son una sola red conectada — descubrí builders y proyectos en un solo lugar.",
    slug: "lanzamos-builders-hunt-el-feed-semanal-de-lanzamientos",
  },
  {
    emoji: "📦",
    title: "Proyectos: de la idea al lanzado",
    blurb: "Trackeá el ciclo de tus proyectos (idea → en construcción → lanzado) y agregalos pegando la URL: se autocompletan solos.",
    slug: "proyectos-de-la-idea-al-lanzado-y-agregalos-pegando-la-url",
  },
  {
    emoji: "⚡",
    title: "Ranking por commits",
    blurb: "El leaderboard ahora también mide quién más codea, con vistas por año y por mes.",
    slug: "rankea-por-commits-el-leaderboard-ahora-mide-quien-codea",
  },
  {
    emoji: "🏆",
    title: "Badges para tu portfolio",
    blurb: "¿Ganaste Builder de la Semana o lanzaste un proyecto? Ahora tenés un badge embebible para tu web o producto.",
    slug: "lanzamos-builders-hunt-el-feed-semanal-de-lanzamientos",
  },
];

/**
 * GET /api/admin/send-update — one-time product update announcement email.
 *  - secret=<ADMIN_SECRET>  required
 *  - preview=1              render + count recipients, send nothing
 *  - test_email=<addr>      send only to this address
 * Sends to all users with a published profile, minus those who unsubscribed.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const preview = searchParams.get("preview") === "1";
    const testEmail = searchParams.get("test_email");
    // Catch-up support: start_page=2 skips the first 50 auth users (already sent).
    const startPage = Math.max(1, parseInt(searchParams.get("start_page") || "1", 10) || 1);

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const features = FEATURES.map((f) => ({
      emoji: f.emoji,
      title: f.title,
      blurb: f.blurb,
      href: `${SITE_URL}/blog/${f.slug}`,
    }));

    const htmlTemplate = await render(
      React.createElement(ProductUpdateEmail, { features, unsubscribeUrl: UNSUB_MARKER })
    );

    const subject = "🚀 Llegó Builders Hunt — lanzá tu proyecto y que la comunidad vote";
    const from = process.env.EMAIL_FROM || "hi@huevsite.studio";

    if (preview) {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const authUsers = await listAllAuthUsers(supabase, startPage);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, community_digest_unsubscribed")
        .not("username", "is", null);
      const profMap = new Map((profs || []).map((p) => [p.id, p]));
      const eligible = authUsers.filter((u) => {
        const p = profMap.get(u.id);
        return u.email && p && !p.community_digest_unsubscribed;
      });
      return NextResponse.json({ preview: true, startPage, authUsers: authUsers.length, eligibleRecipients: eligible.length, subject, features });
    }

    if (testEmail) {
      const html = htmlTemplate.replaceAll(UNSUB_MARKER, buildUnsubscribeUrl("test"));
      await resend.emails.send({ from, to: testEmail, subject, html });
      return NextResponse.json({ success: true, test: true, sentTo: testEmail });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, community_digest_unsubscribed")
      .not("username", "is", null);
    const profMap = new Map((profs || []).map((p) => [p.id, p]));

    const authUsers = await listAllAuthUsers(supabase, startPage);

    let emailsSent = 0;
    const errors: string[] = [];
    for (const u of authUsers) {
      if (!u.email) continue;
      const p = profMap.get(u.id);
      if (!p) continue;
      if (p.community_digest_unsubscribed) continue;
      const html = htmlTemplate.replaceAll(UNSUB_MARKER, buildUnsubscribeUrl(u.id));
      try {
        await resend.emails.send({ from, to: u.email, subject, html });
        emailsSent++;
        await new Promise((r) => setTimeout(r, 100));
      } catch (err: any) {
        errors.push(`${u.email}: ${err?.message}`);
      }
    }

    return NextResponse.json({ success: true, emailsSent, errors });
  } catch (error: any) {
    console.error("[send-update] error:", error);
    return NextResponse.json({ error: error?.message || "Algo salió mal." }, { status: 500 });
  }
}
