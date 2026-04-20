import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// POST — admin toggles story_video_is_public.
// Body: { isPublic: boolean }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body.isPublic !== "boolean") {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }


  const { data: interview, error: queryError } = await supabase
    .from("builder_interviews")
    .select("id, story_video_path")
    .eq("id", id)
    .maybeSingle();

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  if (!interview) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!interview.story_video_path && body.isPublic) {
    return NextResponse.json(
      { error: "No hay video para marcar como público." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("builder_interviews")
    .update({ story_video_is_public: body.isPublic })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, isPublic: body.isPublic });
}
