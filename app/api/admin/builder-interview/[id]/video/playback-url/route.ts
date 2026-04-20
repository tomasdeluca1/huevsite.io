import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { STORY_VIDEO_BUCKET } from "@/lib/story-video";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const { data: interview, error } = await supabase
    .from("builder_interviews")
    .select("story_video_path, story_video_mime_type")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!interview?.story_video_path) {
    return NextResponse.json({ error: "no_video" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(STORY_VIDEO_BUCKET)
    .createSignedUrl(interview.story_video_path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    console.error("Admin video playback signed URL error:", signError);
    return NextResponse.json(
      { error: "No se pudo generar el link." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: signed.signedUrl,
    mimeType: interview.story_video_mime_type,
  });
}
