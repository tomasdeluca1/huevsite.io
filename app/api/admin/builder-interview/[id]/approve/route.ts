import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceRoleClient();

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
