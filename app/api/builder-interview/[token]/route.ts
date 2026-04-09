import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateInterviewContent } from "@/lib/openrouter";
import { createTypefullyDraft, getTypefullyDraftUrl } from "@/lib/typefully";
import { sendRenderedEmail } from "@/lib/email";
import { InterviewNotificationEmail } from "@/components/emails/InterviewNotificationEmail";
import React from "react";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — fetch interview data for form page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getServiceRoleClient();

  const { data: interview } = await supabase
    .from("builder_interviews")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!interview) {
    return NextResponse.json({ error: "Entrevista no encontrada." }, { status: 404 });
  }

  if (new Date(interview.expires_at) < new Date()) {
    await supabase
      .from("builder_interviews")
      .update({ status: "expired" })
      .eq("id", interview.id);
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  if (interview.status !== "invited") {
    return NextResponse.json({
      error: "already_submitted",
      status: interview.status,
    }, { status: 409 });
  }

  return NextResponse.json({
    builderName: interview.builder_name,
    builderUsername: interview.builder_username,
  });
}

// POST — submit form responses + trigger AI generation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getServiceRoleClient();

  const { data: interview } = await supabase
    .from("builder_interviews")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!interview) {
    return NextResponse.json({ error: "Entrevista no encontrada." }, { status: 404 });
  }

  if (interview.status !== "invited") {
    return NextResponse.json({ error: "Ya fue enviada." }, { status: 409 });
  }

  if (new Date(interview.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expirado." }, { status: 410 });
  }

  try {
    const body = await request.json();

    // Save responses and set status to generating
    await supabase
      .from("builder_interviews")
      .update({
        submitted_at: new Date().toISOString(),
        status: "generating",
        intro_who_are_you: body.intro_who_are_you,
        intro_origin_story: body.intro_origin_story,
        intro_build_in_public: body.intro_build_in_public,
        projects_main_project: body.projects_main_project,
        projects_problem_solved: body.projects_problem_solved,
        projects_stack: body.projects_stack,
        projects_biggest_challenge: body.projects_biggest_challenge,
        projects_users_traction: body.projects_users_traction,
        projects_links: body.projects_links,
        quickfire_tool: body.quickfire_tool,
        quickfire_inspiration: body.quickfire_inspiration,
        quickfire_advice: body.quickfire_advice,
        quickfire_whats_next: body.quickfire_whats_next,
        quickfire_where_to_find: body.quickfire_where_to_find,
      })
      .eq("id", interview.id);

    // Generate content with AI
    let generated;
    try {
      generated = await generateInterviewContent({
        builderName: interview.builder_name,
        builderUsername: interview.builder_username,
        introWhoAreYou: body.intro_who_are_you || "",
        introOriginStory: body.intro_origin_story || "",
        introBuildInPublic: body.intro_build_in_public || "",
        projectsMainProject: body.projects_main_project || "",
        projectsProblemSolved: body.projects_problem_solved || "",
        projectsStack: body.projects_stack || "",
        projectsBiggestChallenge: body.projects_biggest_challenge || "",
        projectsUsersTraction: body.projects_users_traction || "",
        projectsLinks: body.projects_links || "",
        quickfireTool: body.quickfire_tool || "",
        quickfireInspiration: body.quickfire_inspiration || "",
        quickfireAdvice: body.quickfire_advice || "",
        quickfireWhatsNext: body.quickfire_whats_next || "",
        quickfireWhereToFind: body.quickfire_where_to_find || "",
      });
    } catch (aiError: any) {
      await supabase
        .from("builder_interviews")
        .update({ status: "submitted", generation_error: aiError.message })
        .eq("id", interview.id);
      // Still return success — admin can regenerate later
      return NextResponse.json({ success: true, aiError: true });
    }

    // Save generated content
    await supabase
      .from("builder_interviews")
      .update({
        generated_blog_markdown: generated.blogMarkdown,
        generated_linkedin_post: generated.linkedinPost,
        generated_twitter_post: generated.twitterPost,
        generated_instagram_caption: generated.instagramCaption,
        generated_instagram_carousel: generated.instagramCarousel,
      })
      .eq("id", interview.id);

    // Create blog post (unpublished)
    const slug = `builder-de-la-semana-${interview.builder_username}`;
    const { data: blogPost } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title: generated.blogTitle,
        excerpt: generated.blogExcerpt,
        content: generated.blogMarkdown,
        date: new Date().toISOString().split("T")[0],
        tags: generated.blogTags,
        author_name: "Tomas Deluca",
        author_username: "tomi_delu",
        author_avatar_url:
          "https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/4dt5yx2f1qs-1771790082443.jpg",
        is_published: false,
        interview_id: interview.id,
      })
      .select("id")
      .single();

    if (blogPost) {
      await supabase
        .from("builder_interviews")
        .update({ blog_post_id: blogPost.id })
        .eq("id", interview.id);
    }

    // Create Typefully drafts
    let xDraftId: number | null = null;
    let xDraftUrl: string | null = null;
    let linkedinDraftId: number | null = null;
    let linkedinDraftUrl: string | null = null;

    try {
      const xDraft = await createTypefullyDraft(generated.twitterPost);
      xDraftId = xDraft.id;
      xDraftUrl = getTypefullyDraftUrl(xDraft.id);
    } catch (e) {
      console.error("Typefully X draft error:", e);
    }

    try {
      const liDraft = await createTypefullyDraft(generated.linkedinPost);
      linkedinDraftId = liDraft.id;
      linkedinDraftUrl = getTypefullyDraftUrl(liDraft.id);
    } catch (e) {
      console.error("Typefully LinkedIn draft error:", e);
    }

    // Update interview with draft refs and final status
    await supabase
      .from("builder_interviews")
      .update({
        status: "ready",
        typefully_x_draft_id: xDraftId?.toString(),
        typefully_x_draft_url: xDraftUrl,
        typefully_linkedin_draft_id: linkedinDraftId?.toString(),
        typefully_linkedin_draft_url: linkedinDraftUrl,
      })
      .eq("id", interview.id);

    // Notify admin
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io";
      await sendRenderedEmail({
        to: "tomasdelucaa@gmail.com",
        subject: `🎙️ ${interview.builder_name} completó la entrevista Builder de la Semana`,
        react: React.createElement(InterviewNotificationEmail, {
          builderName: interview.builder_name,
          builderUsername: interview.builder_username,
          blogTitle: generated.blogTitle,
          blogExcerpt: generated.blogExcerpt,
          xDraftUrl,
          linkedinDraftUrl,
          adminUrl: `${siteUrl}/admin`,
        }),
      });

      await supabase
        .from("builder_interviews")
        .update({ admin_notified_at: new Date().toISOString() })
        .eq("id", interview.id);
    } catch (e) {
      console.error("Admin notification email error:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Submit interview error:", error);
    return NextResponse.json({ error: error.message || "Algo salió mal." }, { status: 500 });
  }
}
