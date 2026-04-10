import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  STORY_VIDEO_BUCKET,
  STORY_VIDEO_MAX_BYTES,
  isAllowedStoryVideoMime,
  buildStoryVideoPath,
} from "@/lib/story-video";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Statuses where the builder is allowed to upload. Same set as the review page
// so they match: as long as the interview is not expired, they can upload.
const UPLOADABLE_STATUSES = new Set([
  "submitted",
  "generating",
  "ready",
  "published",
]);

// POST — generate a signed upload URL for the builder to PUT their video.
// Body: { mimeType: string, sizeBytes: number }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.mimeType !== "string" ||
    typeof body.sizeBytes !== "number"
  ) {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (!isAllowedStoryVideoMime(body.mimeType)) {
    return NextResponse.json(
      {
        error:
          "Este formato no nos sirve. Grabá desde la cámara del celular y probá de nuevo.",
      },
      { status: 400 }
    );
  }

  if (body.sizeBytes <= 0 || body.sizeBytes > STORY_VIDEO_MAX_BYTES) {
    return NextResponse.json(
      {
        error:
          "El video es muy pesado. Probá grabando con menos calidad o recortando un poco.",
      },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();

  const { data: interview, error: queryError } = await supabase
    .from("builder_interviews")
    .select("id, status")
    .eq("token", token)
    .maybeSingle();

  if (queryError) {
    console.error("Video upload-url query error:", queryError);
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  if (!interview) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!UPLOADABLE_STATUSES.has(interview.status)) {
    return NextResponse.json(
      { error: "not_ready", status: interview.status },
      { status: 409 }
    );
  }

  const path = buildStoryVideoPath(interview.id, body.mimeType);

  const { data: signed, error: signError } = await supabase.storage
    .from(STORY_VIDEO_BUCKET)
    .createSignedUploadUrl(path);

  if (signError || !signed) {
    console.error("Signed upload URL error:", signError);
    return NextResponse.json(
      { error: "No se pudo preparar el upload." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    path: signed.path,
    token: signed.token,
    signedUrl: signed.signedUrl,
  });
}
