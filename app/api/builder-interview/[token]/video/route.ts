import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { STORY_VIDEO_BUCKET } from "@/lib/story-video";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// DELETE — builder removes their own video via the review page.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getServiceRoleClient();

  const { data: interview, error: queryError } = await supabase
    .from("builder_interviews")
    .select("id, story_video_path")
    .eq("token", token)
    .maybeSingle();

  if (queryError) {
    console.error("Video DELETE query error:", queryError);
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
      console.error("Video storage remove error:", removeError);
      // Don't fail the request — still clear the DB reference.
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
    .eq("id", interview.id);

  if (updateError) {
    console.error("Video DELETE update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
