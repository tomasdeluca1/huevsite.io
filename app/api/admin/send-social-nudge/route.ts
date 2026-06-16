import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { ConnectSocialsEmail } from "@/components/emails/ConnectSocialsEmail";
import { buildUnsubscribeUrl } from "@/lib/email-unsubscribe";
import { listAllAuthUsers } from "@/lib/list-auth-users";

export const dynamic = "force-dynamic";
// El envío recorre cientos de usuarios con delay entre cada send; sin esto la
// función corta a la mitad. Mandar siempre por lotes acotados con only_page.
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const UNSUB_MARKER = "__UNSUB_URL__";
const NAME_MARKER = "__FIRST_NAME__";

const SITE = "https://huevsite.io";
// umami captura los utm_* en el pageview del dashboard.
const CTA_HREF = `${SITE}/dashboard?utm_source=email&utm_medium=email&utm_campaign=conecta-redes`;

function greeting(name: string | null | undefined, username: string | null | undefined): string {
  const first = (name || "").trim().split(/\s+/)[0];
  if (first) return first;
  if (username) return `@${username}`;
  return "che";
}

// ¿El user tiene al menos un link social NO vacío? (un bloque social puede
// existir vacío, así que no alcanza con que exista el bloque).
function hasRealSocials(data: any): boolean {
  const links = data?.links;
  if (!Array.isArray(links)) return false;
  return links.some(
    (l: any) => (l?.url || "").trim() !== "" || (l?.handle || "").trim() !== ""
  );
}

/**
 * GET /api/admin/send-social-nudge — comunicado a quienes NO tienen redes
 * conectadas, invitándolos a agregarlas.
 *  - secret=<ADMIN_SECRET>  requerido
 *  - preview=1              renderiza + cuenta destinatarios, no manda nada
 *  - test_email=<addr>      manda solo a esa dirección
 *  - only_page=N            procesa SOLO esa página de 50 auth users (lote seguro)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const preview = searchParams.get("preview") === "1";
    const testEmail = searchParams.get("test_email");
    const onlyPageParam = searchParams.get("only_page");
    const onlyPage = onlyPageParam ? Math.max(1, parseInt(onlyPageParam, 10) || 1) : null;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const getAuthUsers = async () => {
      if (onlyPage !== null) {
        const { data, error } = await supabase.auth.admin.listUsers({ page: onlyPage, perPage: 50 });
        if (error) throw error;
        return data?.users || [];
      }
      return listAllAuthUsers(supabase, 1);
    };

    // Set de user_ids que YA tienen al menos una red conectada (no vacía).
    const { data: socialBlocks } = await supabase
      .from("blocks")
      .select("user_id, data")
      .eq("type", "social");
    const hasSocials = new Set(
      (socialBlocks || []).filter((b) => hasRealSocials(b.data)).map((b) => b.user_id)
    );

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, name, community_digest_unsubscribed")
      .not("username", "is", null);
    const profMap = new Map((profs || []).map((p) => [p.id, p]));

    // Elegible = tiene perfil con username, no dado de baja, y SIN redes.
    const isEligible = (u: any) => {
      const p = profMap.get(u.id);
      return u.email && p && !p.community_digest_unsubscribed && !hasSocials.has(u.id);
    };

    const htmlTemplate = await render(
      React.createElement(ConnectSocialsEmail, {
        firstName: NAME_MARKER,
        ctaHref: CTA_HREF,
        unsubscribeUrl: UNSUB_MARKER,
      })
    );

    const subject = "🔗 Te falta conectar tus redes en huevsite";
    const from = "hi@huevsite.studio";

    if (preview) {
      const authUsers = await getAuthUsers();
      const eligible = authUsers.filter(isEligible);
      return NextResponse.json({
        preview: true,
        onlyPage,
        usersWithSocials: hasSocials.size,
        authUsers: authUsers.length,
        eligibleRecipients: eligible.length,
        subject,
        ctaHref: CTA_HREF,
      });
    }

    if (testEmail) {
      const html = htmlTemplate
        .replaceAll(NAME_MARKER, "builder")
        .replaceAll(UNSUB_MARKER, buildUnsubscribeUrl("test"));
      await resend.emails.send({ from, to: testEmail, subject, html });
      return NextResponse.json({ success: true, test: true, sentTo: testEmail });
    }

    const authUsers = await getAuthUsers();

    let emailsSent = 0;
    const errors: string[] = [];
    for (const u of authUsers) {
      if (!isEligible(u)) continue;
      const p = profMap.get(u.id);
      const html = htmlTemplate
        .replaceAll(NAME_MARKER, greeting(p?.name, p?.username))
        .replaceAll(UNSUB_MARKER, buildUnsubscribeUrl(u.id));
      try {
        await resend.emails.send({ from, to: u.email, subject, html });
        emailsSent++;
        await new Promise((r) => setTimeout(r, 100));
      } catch (err: any) {
        errors.push(`${u.email}: ${err?.message}`);
      }
    }

    return NextResponse.json({ success: true, onlyPage, processed: authUsers.length, emailsSent, errors });
  } catch (error: any) {
    console.error("[send-social-nudge] error:", error);
    return NextResponse.json({ error: error?.message || "Algo salió mal." }, { status: 500 });
  }
}
