import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { getAllFaqs } from "@/lib/faq-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const faqs = await getAllFaqs();
  return NextResponse.json({ faqs });
}

export async function POST(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
  if (!question || !answer) {
    return NextResponse.json({ error: "Pregunta y respuesta son requeridas." }, { status: 400 });
  }

  // New FAQ goes to the bottom by default.
  const { data: last } = await supabase
    .from("faqs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order =
    typeof body?.sort_order === "number" ? body.sort_order : ((last?.sort_order ?? 0) + 10);

  const { data, error } = await supabase
    .from("faqs")
    .insert({ question, answer, sort_order, published: body?.published !== false })
    .select("id, question, answer, sort_order, published")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "No se pudo crear." }, { status: 500 });
  }
  return NextResponse.json(data);
}
