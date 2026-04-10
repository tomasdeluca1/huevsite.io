import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  STORY_VIDEO_BUCKET,
  STORY_VIDEO_MAX_BYTES,
  isAllowedStoryVideoMime,
  pathBelongsToInterview,
} from "@/lib/story-video";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST — called by the client after a successful upload via signed URL.
// Body: { path: string, mimeType: string, sizeBytes: number }
// Validates the path matches this interview, verifies the object exists and
// is within limits, then persists the reference on builder_interviews.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.path !== "string" ||
    typeof body.mimeType !== "string" ||
    typeof body.sizeBytes !== "number"
  ) {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (!isAllowedStoryVideoMime(body.mimeType)) {
    return NextResponse.json(
      { error: "Formato no permitido." },
      { status: 400 }
    );
  }

  if (body.sizeBytes <= 0 || body.sizeBytes > STORY_VIDEO_MAX_BYTES) {
    return NextResponse.json(
      { error: "Tamaño fuera de rango." },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();

  const { data: interview, error: queryError } = await supabase
    .from("builder_interviews")
    .select("id, story_video_path")
    .eq("token", token)
    .maybeSingle();

  if (queryError) {
    console.error("Video complete query error:", queryError);
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  if (!interview) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Path must belong to THIS interview — prevents path-spoofing after the
  // signed upload URL is returned to the client.
  if (!pathBelongsToInterview(body.path, interview.id)) {
    return NextResponse.json(
      { error: "Path inválido." },
      { status: 403 }
    );
  }

  // Verify the object actually exists in storage and matches reported size.
  // Supabase list() returns metadata for files in a prefix; we look up by name.
  const prefix = `${interview.id}/`;
  const filename = body.path.slice(prefix.length);
  const { data: listed, error: listError } = await supabase.storage
    .from(STORY_VIDEO_BUCKET)
    .list(interview.id, { search: filename });

  if (listError) {
    console.error("Video complete list error:", listError);
    return NextResponse.json(
      { error: "No pudimos verificar el upload." },
      { status: 500 }
    );
  }

  const uploaded = listed?.find((f) => f.name === filename);
  if (!uploaded) {
    return NextResponse.json(
      { error: "El archivo no se encontró en storage." },
      { status: 404 }
    );
  }

  // Sanity check size — if the client lies, believe storage metadata.
  const actualSize =
    (uploaded.metadata as { size?: number } | null)?.size ?? body.sizeBytes;

  if (actualSize > STORY_VIDEO_MAX_BYTES) {
    // Over limit — delete and reject.
    await supabase.storage.from(STORY_VIDEO_BUCKET).remove([body.path]);
    return NextResponse.json(
      { error: "El archivo excede el límite de tamaño." },
      { status: 413 }
    );
  }

  // Delete any previous video for this interview (cleanup on replace).
  if (
    interview.story_video_path &&
    interview.story_video_path !== body.path
  ) {
    await supabase.storage
      .from(STORY_VIDEO_BUCKET)
      .remove([interview.story_video_path]);
  }

  const { error: updateError } = await supabase
    .from("builder_interviews")
    .update({
      story_video_path: body.path,
      story_video_uploaded_at: new Date().toISOString(),
      story_video_size_bytes: actualSize,
      story_video_mime_type: body.mimeType,
      // A new upload resets the public flag — admin must opt in again.
      story_video_is_public: false,
    })
    .eq("id", interview.id);

  if (updateError) {
    console.error("Video complete update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
