import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildLemonCheckoutUrl } from "@/lib/lemon-checkout-url";
import { attributionFromSearchParams } from "@/lib/checkout-attribution";

export const dynamic = "force-dynamic";

// Redirige al checkout actual de Pro ($9/mes) con la identidad del comprador
// (checkout[custom][user_id] + checkout[email]) para que el webhook mapee el
// pago de forma determinística. Antes este route creaba un checkout vía API
// contra el variant viejo de $5 — quedaba inconsistente con el resto del sitio.
async function handler(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const attribution = attributionFromSearchParams(req.nextUrl.searchParams);
  return NextResponse.redirect(buildLemonCheckoutUrl(user.id, user.email, undefined, attribution), {
    status: 302,
  });
}

export { handler as GET, handler as POST };
