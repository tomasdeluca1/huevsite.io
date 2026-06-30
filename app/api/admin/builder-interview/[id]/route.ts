import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("builder_interviews")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }

  return NextResponse.json(data);
}

const EDITABLE_FIELDS = [
  "generated_blog_markdown",
  "generated_twitter_post",
  "generated_linkedin_post",
  "generated_instagram_caption",
  "generated_instagram_carousel_prompt",
  "generated_instagram_story_prompt",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  // Whitelist fields — ignore anything not in EDITABLE_FIELDS
  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      updates[field] = body[field as EditableField];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin cambios." }, { status: 400 });
  }

  // Validate prompt fields if present (must be string or null)
  for (const field of [
    "generated_instagram_carousel_prompt",
    "generated_instagram_story_prompt",
  ] as const) {
    if (field in updates) {
      const v = updates[field];
      if (v !== null && typeof v !== "string") {
        return NextResponse.json(
          { error: `${field} debe ser texto.` },
          { status: 400 }
        );
      }
    }
  }

  // Fetch current state to get blog_post_id if blog content is being edited
  const { data: current } = await supabase
    .from("builder_interviews")
    .select("id, blog_post_id")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }

  // Update interview row
  const { data: updated, error: updateError } = await supabase
    .from("builder_interviews")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? "Error al actualizar." },
      { status: 500 }
    );
  }

  // If blog markdown changed and there's a linked blog_post, sync it
  if ("generated_blog_markdown" in updates && current.blog_post_id) {
    const { error: blogError } = await supabase
      .from("blog_posts")
      .update({ content: updates.generated_blog_markdown })
      .eq("id", current.blog_post_id);

    if (blogError) {
      return NextResponse.json(
        {
          error: `Interview guardada pero blog_post no sincronizó: ${blogError.message}`,
          partial: true,
          data: updated,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(updated);
}

/**
 * DELETE — remove a draft interview + its linked blog post. Guarded: refuses
 * to delete a PUBLISHED blog post (unpublish it first), so live content can't
 * be wiped by accident. Used by the "Eliminar borrador" button in the admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const { data: iv } = await supabase
    .from("builder_interviews")
    .select("id, blog_post_id")
    .eq("id", id)
    .single();
  if (!iv) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }

  if (iv.blog_post_id) {
    const { data: post } = await supabase
      .from("blog_posts")
      .select("is_published")
      .eq("id", iv.blog_post_id)
      .maybeSingle();
    if (post?.is_published) {
      return NextResponse.json(
        { error: "El blog está publicado. Despublicalo antes de borrar." },
        { status: 400 }
      );
    }
    await supabase.from("blog_posts").delete().eq("id", iv.blog_post_id);
  }

  const { error } = await supabase.from("builder_interviews").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
