import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTestimonial, upsertTestimonial } from "@/lib/testimonial-service";

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
  return NextResponse.json({ ok: true, status: "pending" });
}
