import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTestimonial, upsertTestimonial } from "@/lib/testimonial-service";
import { scoreService } from "@/lib/score-service";

// +50 al builder score por dejar un testimonio (no rechazado). El RPC lo
// considera; recalculamos acá para que el puntaje se refleje al instante.
const TESTIMONIAL_SCORE_BONUS = 50;

export const dynamic = "force-dynamic";

// GET own testimonial (for the /testimonio prefill + status).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ testimonial: null }, { status: 401 });

  const testimonial = await getUserTestimonial(user.id);
  return NextResponse.json({ testimonial });
}

// POST/upsert the logged-in user's testimonial (resets to pending).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Iniciá sesión para dejar tu testimonio." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const quote = typeof body?.quote === "string" ? body.quote : "";

  const result = await upsertTestimonial(user.id, quote);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Recalcular score para reflejar el +50 al instante (no bloqueante).
  await scoreService.recomputeScore(user.id).catch(() => {});

  return NextResponse.json({ ok: true, status: "pending", scoreBonus: TESTIMONIAL_SCORE_BONUS });
}
