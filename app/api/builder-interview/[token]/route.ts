import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateInterviewContent,
  generateJointCarouselPrompt,
  type JointCarouselBuilder,
} from "@/lib/openrouter";
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

  // Allow re-editing while the interview is still in `invited` (cold
  // open) or `ready` (cron-armed draft — builder can upgrade the AI
  // content with their own words). Block once the admin has approved
  // and `published` it; reopening would let the builder rewrite a
  // post that's already live.
  if (interview.status !== "invited" && interview.status !== "ready") {
    return NextResponse.json({
      error: "already_submitted",
      status: interview.status,
    }, { status: 409 });
  }

  return NextResponse.json({
    builderName: interview.builder_name,
    builderUsername: interview.builder_username,
    // Pre-populate the form with the answers we already have on file.
    // Empty/null fields → fresh inputs. Cron auto-synthesized values
    // → builder edits over them. Their previous form within the reuse
    // window → builder edits the old answers.
    prefill: {
      intro_who_are_you: interview.intro_who_are_you || "",
      intro_origin_story: interview.intro_origin_story || "",
      intro_build_in_public: interview.intro_build_in_public || "",
      projects_main_project: interview.projects_main_project || "",
      projects_problem_solved: interview.projects_problem_solved || "",
      projects_stack: interview.projects_stack || "",
      projects_biggest_challenge: interview.projects_biggest_challenge || "",
      projects_users_traction: interview.projects_users_traction || "",
      projects_links: interview.projects_links || "",
      quickfire_tool: interview.quickfire_tool || "",
      quickfire_inspiration: interview.quickfire_inspiration || "",
      quickfire_advice: interview.quickfire_advice || "",
      quickfire_whats_next: interview.quickfire_whats_next || "",
      quickfire_where_to_find: interview.quickfire_where_to_find || "",
    },
    isUpgradingDraft: interview.status === "ready" && !!interview.blog_post_id,
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

  // Same gate as GET — accept submits while `invited` (initial flow)
  // or `ready` (builder upgrading the cron-armed draft). Anything past
  // `published` stays locked.
  if (interview.status !== "invited" && interview.status !== "ready") {
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

    // Detect co-winners of the same week so the generated content can
    // cross-reference them. We find the builder's showcase_winners row first
    // (to know which week they won), then pull the other winners for that
    // same week (excluding the current one).
    let coWinners: Array<{ name: string; username: string }> = [];
    let weekLabel: string | undefined;
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", interview.builder_username)
        .maybeSingle();

      if (profileRow?.id) {
        const { data: winRow } = await supabase
          .from("showcase_winners")
          .select("week")
          .eq("user_id", profileRow.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (winRow?.week) {
          weekLabel = winRow.week;
          const { data: siblings } = await supabase
            .from("showcase_winners")
            .select("user_id, profiles:profiles!showcase_winners_user_id_fkey(name, username)")
            .eq("week", winRow.week)
            .neq("user_id", profileRow.id);

          coWinners = (siblings || [])
            .map((s: any) => s.profiles)
            .filter(Boolean)
            .map((p: any) => ({ name: p.name || p.username, username: p.username }));
        }
      }
    } catch (e) {
      console.error("Co-winner lookup error (non-fatal):", e);
    }

    // Slug aligned with the cron pipeline so a builder upgrading a cron-armed
    // draft regenerates THE SAME blog post (instead of duplicating). The week
    // suffix also makes future repeat winners safe (each pick gets its own
    // slug). Computed BEFORE generation so the AI puts the real blog URL in the
    // LinkedIn/Twitter CTAs instead of hallucinating one.
    const slugWeek = (weekLabel || "").toLowerCase();
    const slug = slugWeek
      ? `builder-de-la-semana-${interview.builder_username}-${slugWeek}`
      : `builder-de-la-semana-${interview.builder_username}`;
    const blogUrl = `https://huevsite.io/blog/${slug}`;

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
        coWinners,
        weekLabel,
        blogUrl,
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
        generated_instagram_carousel_prompt: generated.instagramCarouselPrompt,
        generated_instagram_story_prompt: generated.instagramStoryPrompt,
      })
      .eq("id", interview.id);

    // Multi-winner week: if all co-winners (including current) have now
    // submitted their forms, regenerate ONE joint carousel prompt using
    // every builder's content and write it to all of their interview rows.
    // The story prompt stays individual on each row. If a co-winner never
    // submits, the others keep their solo prompt until admin triggers a
    // manual regen.
    if (coWinners.length > 0 && weekLabel) {
      try {
        const { data: weekWinners } = await supabase
          .from("showcase_winners")
          .select("user_id, profiles:profiles!showcase_winners_user_id_fkey(username, name)")
          .eq("week", weekLabel);

        const usernames = (weekWinners || [])
          .map((w: any) => w.profiles?.username)
          .filter(Boolean) as string[];

        if (usernames.length >= 2) {
          const { data: weekInterviews } = await supabase
            .from("builder_interviews")
            .select(
              "id, status, builder_name, builder_username, intro_who_are_you, projects_main_project, projects_problem_solved, projects_stack"
            )
            .in("builder_username", usernames)
            .in("status", ["submitted", "generating", "ready", "published"]);

          // Treat the row we just touched as "submitted" too — it's still
          // in `generating` status at this point because we update to
          // `ready` further down.
          const submittedUsernames = new Set(
            (weekInterviews || []).map((i: any) => i.builder_username)
          );
          submittedUsernames.add(interview.builder_username);

          const allSubmitted = usernames.every((u) =>
            submittedUsernames.has(u)
          );

          if (allSubmitted && (weekInterviews || []).length > 0) {
            // Build the JointCarouselBuilder list. The current interview's
            // form fields are in `body` (not yet refetched), so include them
            // explicitly to avoid a race with the update we just issued.
            const others = (weekInterviews || [])
              .filter((i: any) => i.builder_username !== interview.builder_username)
              .map(
                (i: any): JointCarouselBuilder => ({
                  name: i.builder_name || i.builder_username,
                  username: i.builder_username,
                  introWhoAreYou: i.intro_who_are_you || "",
                  projectsMainProject: i.projects_main_project || "",
                  projectsProblemSolved: i.projects_problem_solved || "",
                  projectsStack: i.projects_stack || "",
                })
              );
            const current: JointCarouselBuilder = {
              name: interview.builder_name || interview.builder_username,
              username: interview.builder_username,
              introWhoAreYou: body.intro_who_are_you || "",
              projectsMainProject: body.projects_main_project || "",
              projectsProblemSolved: body.projects_problem_solved || "",
              projectsStack: body.projects_stack || "",
            };
            const allBuilders = [current, ...others];

            const jointPrompt = await generateJointCarouselPrompt(
              allBuilders,
              weekLabel
            );

            const interviewIds = [
              interview.id,
              ...(weekInterviews || [])
                .filter((i: any) => i.builder_username !== interview.builder_username)
                .map((i: any) => i.id),
            ];

            await supabase
              .from("builder_interviews")
              .update({ generated_instagram_carousel_prompt: jointPrompt })
              .in("id", interviewIds);
          }
        }
      } catch (jointErr) {
        console.error("Joint carousel generation error (non-fatal):", jointErr);
      }
    }

    // Fetch the builder's real profile so the blog post is authored by THEM,
    // not by "Equipo Huevsite". Each BDLS post should link back to the
    // builder's huevsite profile (the "author" card is what readers click).
    const { data: builderProfile } = await supabase
      .from("profiles")
      .select("name, username, image")
      .eq("username", interview.builder_username)
      .maybeSingle();

    const authorName = builderProfile?.name || interview.builder_name || interview.builder_username;
    const authorUsername = builderProfile?.username || interview.builder_username;
    const authorAvatarUrl =
      builderProfile?.image ||
      `https://huevsite.io/api/og/${authorUsername}`;

    // Ensure the "builder-de-la-semana" tag is always present so the blog
    // listing can badge/filter these posts reliably.
    const blogTags = Array.from(new Set([...(generated.blogTags || []), "builder-de-la-semana"]));

    // `slug` is computed before generation (above) so the blog URL could be
    // passed to the AI; reused here for the blog row resolution.

    // Resolve the target blog row: prefer the one already linked from
    // the interview (set by the cron), then fall back to slug match.
    let targetBlogId: string | null = interview.blog_post_id || null;
    if (!targetBlogId) {
      const { data: bySlug } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      targetBlogId = bySlug?.id || null;
    }

    let blogPost: { id: string } | null = null;
    if (targetBlogId) {
      // Builder is upgrading a draft we (or the cron) already armed.
      // Update in place; keep is_published=false so the admin still
      // gets to review the regenerated copy.
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
          interview_id: interview.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetBlogId);
      if (!updErr) blogPost = { id: targetBlogId };
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
          interview_id: interview.id,
        })
        .select("id")
        .single();
      blogPost = inserted ?? null;
    }

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
        to: process.env.NOTIFY_EMAIL || "",
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
