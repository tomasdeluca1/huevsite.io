import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { STORY_VIDEO_BUCKET } from "@/lib/story-video";

export const dynamic = "force-dynamic";

// DELETE — admin removes the story video for an interview.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

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

  if (interview.story_video_path) {
    const { error: removeError } = await supabase.storage
      .from(STORY_VIDEO_BUCKET)
      .remove([interview.story_video_path]);
    if (removeError) {
      console.error("Admin video storage remove error:", removeError);
    }
  }

  const { error: updateError } = await supabase
    .from("builder_interviews")
    .update({
      story_video_path: null,
      story_video_uploaded_at: null,
      story_video_size_bytes: null,
      story_video_mime_type: null,
      story_video_is_public: false,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
