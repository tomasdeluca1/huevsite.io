import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { generateInterviewContent } from "@/lib/openrouter";
import { createTypefullyDraft, getTypefullyDraftUrl } from "@/lib/typefully";

export const dynamic = "force-dynamic";

// Re-runs AI content generation for an interview that ALREADY has the
// builder's submitted answers. Recovers rows parked at `status: "submitted"`
// with a `generation_error` (e.g. a retired OpenRouter model slug).
//
// Mirrors the success path of the public submit route
// (app/api/builder-interview/[token]/route.ts) but reads answers from the
// stored row instead of the request body. Kept self-contained on purpose:
// the public form is untested and must not be coupled to admin tooling.
// The multi-winner joint-carousel pass is intentionally skipped here — it's
// non-fatal and the solo carousel prompt from generation is fine for a manual
// retry. Auth supports both an admin session and `?secret=ADMIN_SECRET`.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const { data: iv, error: loadErr } = await supabase
    .from("builder_interviews")
    .select("*")
    .eq("id", id)
    .single();

  if (loadErr || !iv) {
    return NextResponse.json({ error: "Entrevista no encontrada." }, { status: 404 });
  }

  // Need the builder's real answers to regenerate from — auto-synthesized
  // winner rows (created by the cron without a submitted form) have these null.
  if (!iv.intro_who_are_you && !iv.projects_main_project) {
    return NextResponse.json(
      { error: "Esta entrevista no tiene respuestas del builder para regenerar." },
      { status: 400 }
    );
  }

  // Resolve the builder profile (for blog authorship) and the canonical blog
  // URL BEFORE generation, so the model puts the REAL link in the CTAs instead
  // of hallucinating one. Slug is aligned with the cron + submit route.
  const { data: builderProfile } = await supabase
    .from("profiles")
    .select("id, name, username, image")
    .eq("username", iv.builder_username)
    .maybeSingle();

  let weekLabel: string | undefined;
  if (builderProfile?.id) {
    const { data: win } = await supabase
      .from("showcase_winners")
      .select("week")
      .eq("user_id", builderProfile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    weekLabel = win?.week || undefined;
  }
  const slugWeek = (weekLabel || "").toLowerCase();
  const slug = slugWeek
    ? `builder-de-la-semana-${iv.builder_username}-${slugWeek}`
    : `builder-de-la-semana-${iv.builder_username}`;
  const blogUrl = `https://huevsite.io/blog/${slug}`;

  // Mark in-flight + clear the previous error.
  await supabase
    .from("builder_interviews")
    .update({ status: "generating", generation_error: null })
    .eq("id", id);

  // 1. Generate content from the stored answers.
  let generated;
  try {
    generated = await generateInterviewContent({
      builderName: iv.builder_name,
      builderUsername: iv.builder_username,
      introWhoAreYou: iv.intro_who_are_you || "",
      introOriginStory: iv.intro_origin_story || "",
      introBuildInPublic: iv.intro_build_in_public || "",
      projectsMainProject: iv.projects_main_project || "",
      projectsProblemSolved: iv.projects_problem_solved || "",
      projectsStack: iv.projects_stack || "",
      projectsBiggestChallenge: iv.projects_biggest_challenge || "",
      projectsUsersTraction: iv.projects_users_traction || "",
      projectsLinks: iv.projects_links || "",
      quickfireTool: iv.quickfire_tool || "",
      quickfireInspiration: iv.quickfire_inspiration || "",
      quickfireAdvice: iv.quickfire_advice || "",
      quickfireWhatsNext: iv.quickfire_whats_next || "",
      quickfireWhereToFind: iv.quickfire_where_to_find || "",
      blogUrl,
    });
  } catch (aiError: any) {
    await supabase
      .from("builder_interviews")
      .update({ status: "submitted", generation_error: aiError.message })
      .eq("id", id);
    return NextResponse.json(
      { error: `Falló la generación: ${aiError.message}` },
      { status: 502 }
    );
  }

  // 2. Save generated content.
  await supabase
    .from("builder_interviews")
    .update({
      generated_blog_markdown: generated.blogMarkdown,
      generated_linkedin_post: generated.linkedinPost,
      generated_twitter_post: generated.twitterPost,
      generated_instagram_caption: generated.instagramCaption,
      generated_instagram_carousel_prompt: generated.instagramCarouselPrompt,
      generated_instagram_story_prompt: generated.instagramStoryPrompt,
    })
    .eq("id", id);

  // 3. Blog authorship fields — the post is authored by the builder, not huevsite.
  const authorName = builderProfile?.name || iv.builder_name || iv.builder_username;
  const authorUsername = builderProfile?.username || iv.builder_username;
  const authorAvatarUrl =
    builderProfile?.image || `https://huevsite.io/api/og/${authorUsername}`;

  const blogTags = Array.from(
    new Set([...(generated.blogTags || []), "builder-de-la-semana"])
  );

  // 4. Upsert the blog_post: prefer the already-linked row, then a slug match,
  //    else insert. Always is_published=false so the admin still reviews it.
  let targetBlogId: string | null = iv.blog_post_id || null;
  if (!targetBlogId) {
    const { data: bySlug } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    targetBlogId = bySlug?.id || null;
  }

  let blogPostId: string | null = null;
  if (targetBlogId) {
    const { error: updErr } = await supabase
      .from("blog_posts")
      .update({
        title: generated.blogTitle,
        excerpt: generated.blogExcerpt,
        content: generated.blogMarkdown,
        tags: blogTags,
        author_name: authorName,
        author_username: authorUsername,
        author_avatar_url: authorAvatarUrl,
        is_published: false,
        interview_id: iv.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetBlogId);
    if (!updErr) blogPostId = targetBlogId;
  } else {
    const { data: inserted } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title: generated.blogTitle,
        excerpt: generated.blogExcerpt,
        content: generated.blogMarkdown,
        date: new Date().toISOString().split("T")[0],
        tags: blogTags,
        author_name: authorName,
        author_username: authorUsername,
        author_avatar_url: authorAvatarUrl,
        is_published: false,
        interview_id: iv.id,
      })
      .select("id")
      .single();
    blogPostId = inserted?.id ?? null;
  }

  if (blogPostId) {
    await supabase
      .from("builder_interviews")
      .update({ blog_post_id: blogPostId })
      .eq("id", iv.id);
  }

  // 5. Typefully drafts (best-effort — never block the regen on these).
  let xDraftId: number | null = null;
  let xDraftUrl: string | null = null;
  let liDraftId: number | null = null;
  let liDraftUrl: string | null = null;
  try {
    const x = await createTypefullyDraft(generated.twitterPost);
    xDraftId = x.id;
    xDraftUrl = getTypefullyDraftUrl(x.id);
  } catch (e) {
    console.error("Typefully X draft error:", e);
  }
  try {
    const li = await createTypefullyDraft(generated.linkedinPost);
    liDraftId = li.id;
    liDraftUrl = getTypefullyDraftUrl(li.id);
  } catch (e) {
    console.error("Typefully LinkedIn draft error:", e);
  }

  // 6. Finalize: status ready + draft refs + error cleared.
  await supabase
    .from("builder_interviews")
    .update({
      status: "ready",
      generation_error: null,
      typefully_x_draft_id: xDraftId?.toString(),
      typefully_x_draft_url: xDraftUrl,
      typefully_linkedin_draft_id: liDraftId?.toString(),
      typefully_linkedin_draft_url: liDraftUrl,
    })
    .eq("id", iv.id);

  return NextResponse.json({
    success: true,
    status: "ready",
    blogPostId,
    typefully_x_draft_url: xDraftUrl,
    typefully_linkedin_draft_url: liDraftUrl,
  });
}
