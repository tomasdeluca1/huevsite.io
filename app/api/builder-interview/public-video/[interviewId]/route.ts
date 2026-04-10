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

// 1 hour — short enough to limit leak blast radius, long enough for a blog
// visit. Video tags follow redirects and re-request on seek, so TTL refresh
// happens naturally via client page loads.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

// GET — public playback URL for a story video, ONLY if the admin has flipped
// story_video_is_public = true. Used to embed videos in the blog.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  const { interviewId } = await params;
  const supabase = getServiceRoleClient();

  const { data: interview, error } = await supabase
    .from("builder_interviews")
    .select("story_video_path, story_video_mime_type, story_video_is_public")
    .eq("id", interviewId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!interview?.story_video_path || !interview.story_video_is_public) {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(STORY_VIDEO_BUCKET)
    .createSignedUrl(interview.story_video_path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    console.error("Public video signed URL error:", signError);
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
