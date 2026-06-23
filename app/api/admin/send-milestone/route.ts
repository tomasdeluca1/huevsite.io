import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { Community200Email } from "@/components/emails/Community200Email";
import { buildUnsubscribeUrl } from "@/lib/email-unsubscribe";
import { listAllAuthUsers } from "@/lib/list-auth-users";

export const dynamic = "force-dynamic";
// El envío recorre cientos de usuarios con delay entre cada send; sin esto la
// función corta a la mitad (default del plan ~10-15s) y, como no hay dedup,
// re-enviar duplicaría. 60s da margen holgado por lote de start_page (50 users).
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const UNSUB_MARKER = "__UNSUB_URL__";
const NAME_MARKER = "__FIRST_NAME__";

// Los CTAs siempre apuntan a prod (el dominio canónico), igual que ProductUpdateEmail.
// Así el email es correcto aunque la ruta se ejecute en local (donde SITE_URL es localhost).
const SITE = "https://huevsite.io";
// UTMs por campaña: umami los captura en el pageview de /precios y /testimonio,
// y /precios los arrastra hasta el checkout de Lemon Squeezy (atribución de venta).
const UTM_BASE = "utm_source=email&utm_medium=email&utm_campaign=somos-200";
const PRO_HREF = `${SITE}/precios?${UTM_BASE}&utm_content=pro`;
const TESTIMONIAL_HREF = `${SITE}/testimonio?${UTM_BASE}&utm_content=testimonio`;

// Saludo personalizado: primer nombre, si no el @username, si no algo cálido.
function greeting(name: string | null | undefined, username: string | null | undefined): string {
  const first = (name || "").trim().split(/\s+/)[0];
  if (first) return first;
  if (username) return `@${username}`;
  return "che";
}

/**
 * GET /api/admin/send-milestone — comunicado de hito "somos N huevsites".
 *  - secret=<ADMIN_SECRET>  requerido
 *  - preview=1              renderiza + cuenta destinatarios, no manda nada
 *  - test_email=<addr>      manda solo a esa dirección
 *  - start_page=2           saltea los primeros 50 auth users (catch-up)
 * Manda a todos los usuarios con perfil publicado, menos los dados de baja.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const preview = searchParams.get("preview") === "1";
    const testEmail = searchParams.get("test_email");
    const startPage = Math.max(1, parseInt(searchParams.get("start_page") || "1", 10) || 1);
    // only_page=N procesa SOLO esa página de 50 auth users (no de N al final como
    // start_page). Es el modo seguro de envío por lotes acotados: cada llamada
    // toca una franja distinta de 50, sin solape y sin riesgo de timeout.
    const onlyPageParam = searchParams.get("only_page");
    const onlyPage = onlyPageParam ? Math.max(1, parseInt(onlyPageParam, 10) || 1) : null;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Trae los auth users a procesar: una sola página (only_page) o todas desde startPage.
    const getAuthUsers = async () => {
      if (onlyPage !== null) {
        const { data, error } = await supabase.auth.admin.listUsers({ page: onlyPage, perPage: 50 });
        if (error) throw error;
        return data?.users || [];
      }
      return listAllAuthUsers(supabase, startPage);
    };

    // Conteo en vivo de huevsites publicados (truthful al momento del envío).
    const { count: liveCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("username", "is", null);
    const memberCount = liveCount || 200;

    // Render una sola vez con marcadores; se reemplazan por usuario.
    const htmlTemplate = await render(
      React.createElement(Community200Email, {
        memberCount,
        firstName: NAME_MARKER,
        proHref: PRO_HREF,
        testimonialHref: TESTIMONIAL_HREF,
        unsubscribeUrl: UNSUB_MARKER,
      })
    );

    const subject = `🥚 Somos ${memberCount} huevsites — gracias por estar`;
    const from = process.env.EMAIL_FROM || "hi@huevsite.studio";

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, name, community_digest_unsubscribed")
      .not("username", "is", null);
    const profMap = new Map((profs || []).map((p) => [p.id, p]));

    if (preview) {
      const authUsers = await getAuthUsers();
      const eligible = authUsers.filter((u: any) => {
        const p = profMap.get(u.id);
        return u.email && p && !p.community_digest_unsubscribed;
      });
      return NextResponse.json({
        preview: true,
        startPage,
        onlyPage,
        memberCount,
        authUsers: authUsers.length,
        eligibleRecipients: eligible.length,
        subject,
        proHref: PRO_HREF,
        testimonialHref: TESTIMONIAL_HREF,
      });
    }

    if (testEmail) {
      const html = htmlTemplate
        .replaceAll(NAME_MARKER, "builder")
        .replaceAll(UNSUB_MARKER, buildUnsubscribeUrl("test"));
      await resend.emails.send({ from, to: testEmail, subject, html });
      return NextResponse.json({ success: true, test: true, sentTo: testEmail, memberCount });
    }

    const authUsers = await getAuthUsers();

    let emailsSent = 0;
    const errors: string[] = [];
    for (const u of authUsers) {
      if (!u.email) continue;
      const p = profMap.get(u.id);
      if (!p) continue;
      if (p.community_digest_unsubscribed) continue;
      const html = htmlTemplate
        .replaceAll(NAME_MARKER, greeting(p.name, p.username))
        .replaceAll(UNSUB_MARKER, buildUnsubscribeUrl(u.id));
      try {
        await resend.emails.send({ from, to: u.email, subject, html });
        emailsSent++;
        await new Promise((r) => setTimeout(r, 100));
      } catch (err: any) {
        errors.push(`${u.email}: ${err?.message}`);
      }
    }

    return NextResponse.json({ success: true, onlyPage, startPage, processed: authUsers.length, emailsSent, errors, memberCount });
  } catch (error: any) {
    console.error("[send-milestone] error:", error);
    return NextResponse.json({ error: error?.message || "Algo salió mal." }, { status: 500 });
  }
}
