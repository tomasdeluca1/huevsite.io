import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("builder_interviews")
    .select("id, builder_username, builder_name, builder_email, status, invited_at, submitted_at, typefully_x_draft_url, typefully_linkedin_draft_url, generation_error, builder_approved_at, builder_feedback, story_video_path, story_video_is_public")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
