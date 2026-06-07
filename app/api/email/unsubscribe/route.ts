import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { verifyUnsubscribe } from "@/lib/email-unsubscribe";

export const dynamic = "force-dynamic";

function htmlPage(title: string, message: string, status: number) {
  const body = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{background:#050505;color:#fff;font-family:system-ui,-apple-system,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{max-width:440px;text-align:center;border:1px solid #1a1a1a;border-radius:16px;padding:40px}h1{font-size:22px;letter-spacing:-.03em;margin:0 0 12px}.logo{font-weight:900;letter-spacing:-.05em;margin-bottom:24px;font-size:20px}.logo span{color:#C8FF00}a{color:#C8FF00;text-decoration:none;font-weight:700}p{color:#a1a1aa;line-height:1.6;margin:8px 0}</style></head><body><div class="card"><div class="logo">HUEV<span>SITE</span>.IO</div><h1>${title}</h1><p>${message}</p><p><a href="https://huevsite.io">Volver a huevsite.io →</a></p></div></body></html>`;
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// GET /api/email/unsubscribe?u=<userId>&sig=<hmac>
// One-click opt-out from the weekly community digest email. No login required.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("u") || "";
  const sig = searchParams.get("sig") || "";

  if (!verifyUnsubscribe(userId, sig)) {
    return htmlPage(
      "Link inválido",
      "Este link de baja no es válido. Si querés dejar de recibir el resumen semanal, respondé cualquiera de nuestros emails y lo resolvemos.",
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
      .eq("id", userId);
    if (error) throw error;
  } catch (e) {
    console.error("[unsubscribe] error:", e);
    return htmlPage("Ups", "No pudimos procesar la baja ahora mismo. Reintentá en un momento.", 500);
  }

  return htmlPage(
    "Listo, te diste de baja",
    "No vas a recibir más el resumen semanal de la comunidad. Si fue sin querer, escribinos y lo revertimos.",
    200
  );
}
