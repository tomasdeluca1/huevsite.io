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

const resend = new Resend(process.env.RESEND_API_KEY);
const UNSUB_MARKER = "__UNSUB_URL__";

// The recent batch of features being announced. Edit this list before sending.
const FEATURES = [
  {
    emoji: "🐙",
    title: "Tu GitHub, con números de verdad",
    blurb: "Stars, repos y followers reales, heatmap de contribuciones de verdad y un contador de commits navegable mes a mes.",
    slug: "tu-github-con-numeros-de-verdad",
  },
  {
    emoji: "🏆",
    title: "Leaderboard de Builders",
    blurb: "El ranking público de los builders más activos de LATAM. Subí tu builder score y escalá posiciones.",
    slug: "leaderboard-de-builders-el-ranking-de-quien-construye",
  },
  {
    emoji: "🎯",
    title: "Quests en vivo",
    blurb: "Un panel de misiones que te dice exactamente qué hacer para subir tu score y desbloquear badges, paso a paso.",
    slug: "quests-en-vivo-misiones-para-potenciar-tu-board",
  },
  {
    emoji: "🔓",
    title: "Compartí y sumá +3 bloques",
    blurb: "Tuiteás mencionando a huevsite, verificamos el posteo y desbloqueás 3 bloques extra. Una sola vez, gratis.",
    slug: "comparti-y-suma-3-bloques-extra",
  },
  {
    emoji: "📨",
    title: "Resumen semanal de comunidad",
    blurb: "Todos los viernes: quién más subió puntos, los proyectos nuevos y la última novedad. En X y en tu inbox.",
    slug: "resumen-semanal-de-comunidad-todos-los-viernes",
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

    const subject = "🥚 Novedades en huevsite: GitHub real, leaderboard, quests y más";
    const from = "hi@huevsite.studio";

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
