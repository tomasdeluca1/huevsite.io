import { BRAND } from "@/lib/brand";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unsubscribeFromBeehiiv } from "@/lib/beehiiv";
import { identityFromParts, verifyUnsubscribe } from "@/lib/email-unsubscribe";

export const dynamic = "force-dynamic";

function htmlPage(title: string, message: string, status: number) {
  const body = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{background:${BRAND.color.bg};color:#fff;font-family:system-ui,-apple-system,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{max-width:440px;text-align:center;border:1px solid ${BRAND.color.border};border-radius:16px;padding:40px}h1{font-size:22px;letter-spacing:-.03em;margin:0 0 12px}.logo{display:block;margin:0 auto 24px;width:150px;height:auto}a{color:${BRAND.color.accent};text-decoration:none;font-weight:700}p{color:${BRAND.color.textMuted};line-height:1.6;margin:8px 0}</style></head><body><div class="card"><img src="/logo-huevsite.png" alt="huevsite.io" width="150" class="logo"><h1>${title}</h1><p>${message}</p><p><a href="https://huevsite.io">Volver a huevsite.io →</a></p></div></body></html>`;
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// GET  /api/email/unsubscribe?token=<userId>.<hmac>
//      (legacy links: ?u=<userId>&sig=<hmac>)
// POST same URL, no login. Mailbox one-click (RFC 8058) posts
// `List-Unsubscribe=One-Click`. The signature stays in the query.
// Either method opts the person out and GET shows the confirmation page.
async function readIdentity(request: NextRequest): Promise<{ userId: string; sig: string } | null> {
  const { searchParams } = new URL(request.url);
  let token = searchParams.get("token") || "";
  let userId = searchParams.get("u") || "";
  let sig = searchParams.get("sig") || "";
  if (request.method === "POST" && (!token || !userId || !sig)) {
    const text = await request.text().catch(() => "");
    const body = new URLSearchParams(text);
    token = token || body.get("token") || "";
    userId = userId || body.get("u") || "";
    sig = sig || body.get("sig") || "";
  }
  return identityFromParts({ token, userId, sig });
}

async function syncBeehiiv(supabase: any, userId: string) {
  try {
    let email: string | null = null;
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
    email = profile?.email || null;
    if (!email) {
      const { data } = await supabase.auth.admin.getUserById(userId);
      email = data?.user?.email || null;
    }
    if (!email) {
      console.warn("[unsubscribe] no email on file, beehiiv sync skipped");
      return;
    }
    const result = await unsubscribeFromBeehiiv(email);
    if (!result.ok) {
      console.warn("[unsubscribe] beehiiv:", result.error);
    }
  } catch (err) {
    console.error("[unsubscribe] beehiiv threw:", err);
  }
}

async function handleUnsubscribe(request: NextRequest) {
  const identity = await readIdentity(request);

  if (!identity || !verifyUnsubscribe(identity.userId, identity.sig)) {
    return htmlPage(
      "Link inválido",
      "Este link de baja no es válido. Si querés dejar de recibir los avisos, respondé cualquiera de nuestros emails y lo resolvemos.",
      400
    );
  }

  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase
      .from("profiles")
      .update({ community_digest_unsubscribed: true })
      .eq("id", identity.userId);
    if (error) throw error;

    const { error: newsError } = await supabase
      .from("profiles")
      .update({ newsletter_subscribed: false })
      .eq("id", identity.userId);
    if (newsError) {
      console.warn("[unsubscribe] newsletter flag:", newsError.message);
    }

    await syncBeehiiv(supabase, identity.userId);
  } catch (e) {
    console.error("[unsubscribe] error:", e);
    return htmlPage("Ups", "No pudimos procesar la baja ahora mismo. Reintentá en un momento.", 500);
  }

  return htmlPage(
    "Listo, te diste de baja",
    "No vas a recibir más los avisos de la comunidad: resúmenes, campañas y novedades. Si fue sin querer, escribinos y lo revertimos.",
    200
  );
}

export async function GET(request: NextRequest) {
  return handleUnsubscribe(request);
}

export async function POST(request: NextRequest) {
  return handleUnsubscribe(request);
}
