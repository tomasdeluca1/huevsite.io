import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isJingleChoice } from "@/lib/jingles";

export const dynamic = "force-dynamic";

// PostgREST / Postgres signal that the table hasn't been migrated yet.
function isMissingTable(error: any) {
  return (
    error &&
    (error.code === "42P01" ||
      error.code === "PGRST205" ||
      /relation .* does not exist|could not find the table/i.test(error.message || ""))
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ myVote: null });

    const svc = createServiceRoleClient();
    const { data, error } = await svc
      .from("jingle_votes")
      .select("choice")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error && !isMissingTable(error)) {
      console.error("jingle-vote GET error:", error);
    }
    return NextResponse.json({ myVote: (data as any)?.choice ?? null });
  } catch {
    return NextResponse.json({ myVote: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const choice = body?.choice;
    if (!isJingleChoice(choice)) {
      return NextResponse.json({ error: "Opción inválida." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Necesitás iniciar sesión para votar." }, { status: 401 });
    }

    const svc = createServiceRoleClient();
    const { error } = await svc
      .from("jingle_votes")
      .upsert(
        { user_id: user.id, choice, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json(
          { error: "La votación todavía no está habilitada (migración pendiente)." },
          { status: 409 }
        );
      }
      console.error("jingle-vote POST error:", error);
      return NextResponse.json({ error: "No se pudo guardar tu voto." }, { status: 500 });
    }

    return NextResponse.json({ myVote: choice });
  } catch (e: any) {
    console.error("jingle-vote POST unexpected:", e?.message);
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
