import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { getAllTestimonialsForAdmin } from "@/lib/testimonial-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const testimonials = await getAllTestimonialsForAdmin();
  return NextResponse.json({ testimonials });
}
