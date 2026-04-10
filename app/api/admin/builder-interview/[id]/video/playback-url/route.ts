import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { STORY_VIDEO_BUCKET } from "@/lib/story-video";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  return profile?.username === "tomi_delu";
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceRoleClient();

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
