import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const { data: interview } = await supabase
    .from("builder_interviews")
    .select("id, blog_post_id, status")
    .eq("id", id)
    .single();

  if (!interview) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }

  if (interview.status !== "ready") {
    return NextResponse.json(
      { error: `No se puede publicar en status "${interview.status}".` },
      { status: 400 }
    );
  }

  if (!interview.blog_post_id) {
    return NextResponse.json({ error: "No hay blog post asociado." }, { status: 400 });
  }

  // Publish the blog post
  const { error: blogError } = await supabase
    .from("blog_posts")
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", interview.blog_post_id);

  if (blogError) throw blogError;

  // Update interview status
  const { error: interviewError } = await supabase
    .from("builder_interviews")
    .update({ status: "published" })
    .eq("id", interview.id);

  if (interviewError) throw interviewError;

  return NextResponse.json({ success: true, action: "published" });
}
