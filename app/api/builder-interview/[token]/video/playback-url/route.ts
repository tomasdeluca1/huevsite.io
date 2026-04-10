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

// 1 hour — refreshed each time the page loads.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

// GET — signed playback URL so the builder can watch their own video on the
// review page.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getServiceRoleClient();

  const { data: interview, error: queryError } = await supabase
    .from("builder_interviews")
    .select("id, story_video_path, story_video_mime_type")
    .eq("token", token)
    .maybeSingle();

  if (queryError) {
    console.error("Video playback-url query error:", queryError);
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  if (!interview) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!interview.story_video_path) {
    return NextResponse.json({ error: "no_video" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(STORY_VIDEO_BUCKET)
    .createSignedUrl(interview.story_video_path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    console.error("Signed playback URL error:", signError);
    return NextResponse.json(
      { error: "No se pudo generar el link de playback." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: signed.signedUrl,
    mimeType: interview.story_video_mime_type,
  });
}
