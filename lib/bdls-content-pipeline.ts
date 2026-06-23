import React from "react";
import crypto from "crypto";
import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  generateInterviewContent,
  generateJointCarouselPrompt,
  type JointCarouselBuilder,
} from "@/lib/openrouter";
import { createTypefullyDraft, getTypefullyDraftUrl } from "@/lib/typefully";
import { WinnerEmail } from "@/components/emails/WinnerEmail";
import { sendRenderedEmail } from "@/lib/email";
import { InterviewNotificationEmail } from "@/components/emails/InterviewNotificationEmail";

// Shared content pipeline used by:
//   - /api/admin/pick-winner (Mon 03:00 UTC cron)
//   - /api/admin/auto-bdls-from-profile (manual fallback)
//
// Concentrates the "generate blog draft + interview row + email + tweet
// drafts" flow so all entry points produce the same shape, and so the
// reuse-form-from-last-60d logic isn't reimplemented in two places.

const REUSE_DAYS = 60;
const resend = new Resend(process.env.RESEND_API_KEY);

export type WinnerProfile = {
  id: string;
  username: string;
  name: string | null;
  tagline?: string | null;
  location?: string | null;
  github_handle?: string | null;
  image?: string | null;
};

export type ProcessSource = "reused" | "synthesized" | "existing";

export type ProcessResult = {
  username: string;
  blogPostId: string | null;
  interviewId: string | null;
  /** Public URL of the interview form for this winner (only present
   *  when a fresh interview row was just created — re-runs and the
   *  idempotent path don't need to re-issue the link). */
  formUrl: string | null;
  source: ProcessSource;
  emailSent: boolean;
  emailError?: string | null;
};

type InterviewAnswers = {
  builderName: string;
  builderUsername: string;
  introWhoAreYou: string;
  introOriginStory: string;
  introBuildInPublic: string;
  projectsMainProject: string;
  projectsProblemSolved: string;
  projectsStack: string;
  projectsBiggestChallenge: string;
  projectsUsersTraction: string;
  projectsLinks: string;
  quickfireTool: string;
  quickfireInspiration: string;
  quickfireAdvice: string;
  quickfireWhatsNext: string;
  quickfireWhereToFind: string;
};

function pickStr(...vals: any[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function blocksByType(blocks: any[], type: string): any[] {
  return blocks.filter((b) => b.type === type);
}

// Synthesize the answers the builder would have written, but derived
// from what's already on their public huevsite. Used when there's no
// recent interview to reuse.
export function synthesizeAnswersFromProfile(
  profile: WinnerProfile,
  blocks: any[]
): InterviewAnswers {
  const hero = blocksByType(blocks, "hero")[0]?.data || {};
  const projects = blocksByType(blocks, "project").map((b) => b.data || {});
  const building = blocksByType(blocks, "building")[0]?.data || {};
  const stack = blocksByType(blocks, "stack")[0]?.data || {};
  const social = blocksByType(blocks, "social")[0]?.data || {};
  const writing = blocksByType(blocks, "writing")[0]?.data || {};
  const achievements = blocksByType(blocks, "achievement").map((b) => b.data || {});

  const introWhoAreYou = [
    pickStr(hero.name, profile.name, profile.username),
    pickStr(hero.tagline, profile.tagline),
    pickStr(hero.location, profile.location),
    pickStr(hero.description),
  ]
    .filter(Boolean)
    .join(". ");

  const introOriginStory = [
    pickStr(hero.description),
    achievements
      .map((a: any) => pickStr(a.title, a.description))
      .filter(Boolean)
      .join(" / "),
  ]
    .filter(Boolean)
    .join("\n");

  const introBuildInPublic = pickStr(
    building.description,
    "Construye sus productos en público y comparte avances en huevsite y redes."
  );

  const mainProject = projects[0] || building;
  const projectsMainProject = pickStr(
    mainProject.title,
    mainProject.project,
    mainProject.name
  );
  const projectsProblemSolved = pickStr(
    mainProject.description,
    mainProject.metrics,
    mainProject.tagline
  );

  const stackItems = Array.isArray(stack.items) ? stack.items.join(", ") : "";
  const projectsStack = pickStr(
    stackItems,
    Array.isArray(mainProject.stack) ? mainProject.stack.join(", ") : "",
    profile.github_handle ? `Stack visible en GitHub @${profile.github_handle}` : ""
  );

  const projectsBiggestChallenge = pickStr(
    achievements[0]?.description,
    "Los desafíos típicos de un builder solo: foco, distribución, y mantener el ritmo."
  );

  const projectsUsersTraction = pickStr(
    mainProject.metrics,
    achievements
      .map((a: any) => pickStr(a.title))
      .filter(Boolean)
      .slice(0, 2)
      .join(" · ")
  );

  const projectsLinks = projects
    .map((p: any) => {
      const t = pickStr(p.title, p.name);
      const l = pickStr(p.link, p.url);
      return l ? `${t}: ${l}` : t;
    })
    .filter(Boolean)
    .join("\n");

  const socialLinks = Array.isArray(social.links) ? social.links : [];
  const twitter = socialLinks.find((l: any) => l.platform === "twitter");
  const quickfireWhereToFind = [
    `huevsite.io/${profile.username}`,
    twitter?.url || (twitter?.handle ? `https://x.com/${twitter.handle}` : ""),
    profile.github_handle ? `github.com/${profile.github_handle}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const writingPosts = Array.isArray(writing.posts) ? writing.posts : [];
  const quickfireWhatsNext = pickStr(
    building.project,
    building.description,
    writingPosts[0]?.title,
    "Seguir buildeando con foco y compartiendo el proceso."
  );

  return {
    builderName: pickStr(hero.name, profile.name, profile.username),
    builderUsername: profile.username,
    introWhoAreYou: introWhoAreYou || `${profile.username} es un builder de huevsite.`,
    introOriginStory: introOriginStory || introWhoAreYou,
    introBuildInPublic,
    projectsMainProject:
      projectsMainProject || `El proyecto principal de ${profile.username}`,
    projectsProblemSolved:
      projectsProblemSolved || "Resuelve un problema concreto de su comunidad de builders.",
    projectsStack: projectsStack || "Stack moderno de web development.",
    projectsBiggestChallenge,
    projectsUsersTraction:
      projectsUsersTraction ||
      "Ya tiene primeros usuarios y avances visibles en huevsite.",
    projectsLinks: projectsLinks || `huevsite.io/${profile.username}`,
    quickfireTool: pickStr(stackItems.split(",")[0], "Su editor + un buen flujo de tipado"),
    quickfireInspiration: "La comunidad de builders argentinos.",
    quickfireAdvice: pickStr(
      hero.description,
      "Buildeá lo más chico que sirva, mostralo, y escuchá."
    ),
    quickfireWhatsNext,
    quickfireWhereToFind,
  };
}

// Look for a previous interview where this builder actually wrote real
// answers, within the configurable reuse window. We only consider rows
// that have `intro_who_are_you` populated — auto-generated rows from
// this same pipeline have it null (we leave the interview-form fields
// null because we never asked the human those questions), so they don't
// count as "reusable form data" for the next time this builder wins.
async function findReusableInterview(
  supabase: any,
  username: string,
  days = REUSE_DAYS
): Promise<InterviewAnswers | null> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("builder_interviews")
    .select(
      "intro_who_are_you, intro_origin_story, intro_build_in_public, projects_main_project, projects_problem_solved, projects_stack, projects_biggest_challenge, projects_users_traction, projects_links, quickfire_tool, quickfire_inspiration, quickfire_advice, quickfire_whats_next, quickfire_where_to_find, builder_name, builder_username, submitted_at"
    )
    .eq("builder_username", username)
    .not("intro_who_are_you", "is", null)
    .gte("submitted_at", cutoff)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    builderName: data.builder_name || data.builder_username,
    builderUsername: data.builder_username,
    introWhoAreYou: data.intro_who_are_you || "",
    introOriginStory: data.intro_origin_story || "",
    introBuildInPublic: data.intro_build_in_public || "",
    projectsMainProject: data.projects_main_project || "",
    projectsProblemSolved: data.projects_problem_solved || "",
    projectsStack: data.projects_stack || "",
    projectsBiggestChallenge: data.projects_biggest_challenge || "",
    projectsUsersTraction: data.projects_users_traction || "",
    projectsLinks: data.projects_links || "",
    quickfireTool: data.quickfire_tool || "",
    quickfireInspiration: data.quickfire_inspiration || "",
    quickfireAdvice: data.quickfire_advice || "",
    quickfireWhatsNext: data.quickfire_whats_next || "",
    quickfireWhereToFind: data.quickfire_where_to_find || "",
  };
}

async function ensureWinnerRow(supabase: any, userId: string, week: string) {
  const { data: existing } = await supabase
    .from("showcase_winners")
    .select("id")
    .eq("user_id", userId)
    .eq("week", week)
    .maybeSingle();
  if (existing) return false;
  const { error } = await supabase.from("showcase_winners").insert({ user_id: userId, week });
  if (error) throw new Error(`No pude insertar el winner: ${error.message}`);
  return true;
}

async function getCoWinners(supabase: any, week: string, excludeUserId: string) {
  const { data } = await supabase
    .from("showcase_winners")
    .select("user_id, profiles:profiles!showcase_winners_user_id_fkey(name, username)")
    .eq("week", week)
    .neq("user_id", excludeUserId);
  return (data || [])
    .map((s: any) => s.profiles)
    .filter(Boolean)
    .map((p: any) => ({ name: p.name || p.username, username: p.username }));
}

async function sendWinnerEmail(
  supabase: any,
  profile: WinnerProfile,
  week: string,
  formUrl?: string
): Promise<{ sent: boolean; error?: string | null }> {
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    const builderEmail = authUser?.user?.email;
    if (!builderEmail) return { sent: false, error: "No email on auth.users" };
    const html = await render(
      React.createElement(WinnerEmail, {
        name: profile.name || profile.username,
        username: profile.username,
        week,
        // Optional: passes a link to the interview form. The cron-armed
        // draft is already there; the form lets the builder upgrade it
        // with their own words. Omitted on idempotent re-runs since the
        // draft already exists.
        formUrl,
      })
    );
    await resend.emails.send({
      from: "hi@huevsite.studio",
      to: builderEmail,
      subject: "🏆 ¡Sos el builder de la semana en Huevsite!",
      html,
    });
    return { sent: true, error: null };
  } catch (e: any) {
    return { sent: false, error: e?.message || String(e) };
  }
}

export type ProcessOpts = {
  profile: WinnerProfile;
  week: string;
  sendEmail?: boolean;
  regenerate?: boolean;
  forceSynthesize?: boolean;
};

export async function processWinnerForWeek(
  supabase: any,
  opts: ProcessOpts
): Promise<ProcessResult> {
  const { profile, week, sendEmail = true, regenerate = false, forceSynthesize = false } = opts;

  // Make sure the winner row exists before we generate anything that
  // depends on co-winner detection.
  await ensureWinnerRow(supabase, profile.id, week);

  const slug = `builder-de-la-semana-${profile.username}-${week.toLowerCase()}`;
  const { data: existingBlogPost } = await supabase
    .from("blog_posts")
    .select("id, slug, is_published")
    .eq("slug", slug)
    .maybeSingle();

  // Idempotent path: same builder + same week, already armed → just
  // confirm the email got sent and exit. No new form link issued.
  if (existingBlogPost && !regenerate) {
    let emailSent = false;
    let emailError: string | null = null;
    if (sendEmail) {
      const r = await sendWinnerEmail(supabase, profile, week);
      emailSent = r.sent;
      emailError = r.error ?? null;
    }
    return {
      username: profile.username,
      blogPostId: existingBlogPost.id,
      interviewId: null,
      formUrl: null,
      source: "existing",
      emailSent,
      emailError,
    };
  }

  // Decide source: reuse vs synthesize.
  let answers: InterviewAnswers | null = null;
  let source: ProcessSource = "synthesized";
  if (!forceSynthesize) {
    answers = await findReusableInterview(supabase, profile.username);
    if (answers) source = "reused";
  }
  if (!answers) {
    const { data: blocks } = await supabase
      .from("blocks")
      .select("type, data")
      .eq("user_id", profile.id)
      .is("sub_site_id", null)
      .eq("visible", true);
    answers = synthesizeAnswersFromProfile(profile, blocks || []);
    source = "synthesized";
  }

  const coWinners = await getCoWinners(supabase, week, profile.id);

  const aiOut = await generateInterviewContent({
    ...answers,
    coWinners,
    weekLabel: week,
    blogUrl: `https://huevsite.io/blog/${slug}`,
  });

  const blogTags = Array.from(new Set([...(aiOut.blogTags || []), "builder-de-la-semana"]));
  const authorAvatar = profile.image || `https://huevsite.io/api/og/${profile.username}`;

  let blogPostId: string | null = null;
  if (existingBlogPost && regenerate) {
    const { error: updErr } = await supabase
      .from("blog_posts")
      .update({
        title: aiOut.blogTitle,
        excerpt: aiOut.blogExcerpt,
        content: aiOut.blogMarkdown,
        tags: blogTags,
        author_name: profile.name || profile.username,
        author_username: profile.username,
        author_avatar_url: authorAvatar,
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingBlogPost.id);
    if (updErr) throw new Error(`Update blog_post failed: ${updErr.message}`);
    blogPostId = existingBlogPost.id;
  } else {
    const { data: newBlogPost, error: insertErr } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title: aiOut.blogTitle,
        excerpt: aiOut.blogExcerpt,
        content: aiOut.blogMarkdown,
        date: new Date().toISOString().split("T")[0],
        tags: blogTags,
        author_name: profile.name || profile.username,
        author_username: profile.username,
        author_avatar_url: authorAvatar,
        is_published: false,
      })
      .select("id")
      .single();
    if (insertErr || !newBlogPost) {
      throw new Error(`Insert blog_post failed: ${insertErr?.message}`);
    }
    blogPostId = newBlogPost.id;
  }

  // Create Typefully drafts so the admin can ship the X / LinkedIn copy
  // straight from /admin/interviews. Best-effort: don't fail the whole
  // pipeline if Typefully is down or rate-limited.
  let xDraftId: number | null = null;
  let xDraftUrl: string | null = null;
  let linkedinDraftId: number | null = null;
  let linkedinDraftUrl: string | null = null;
  try {
    const xDraft = await createTypefullyDraft(aiOut.twitterPost);
    xDraftId = xDraft.id;
    xDraftUrl = getTypefullyDraftUrl(xDraft.id);
  } catch (e) {
    console.error("Typefully X draft error (non-fatal):", e);
  }
  try {
    const liDraft = await createTypefullyDraft(aiOut.linkedinPost);
    linkedinDraftId = liDraft.id;
    linkedinDraftUrl = getTypefullyDraftUrl(liDraft.id);
  } catch (e) {
    console.error("Typefully LinkedIn draft error (non-fatal):", e);
  }

  // Synthetic builder_interviews row in status="ready" — the admin
  // review UI keys off this. We populate intro_/projects_/quickfire_
  // with whatever we ended up using (reused or synthesized) so future
  // BDLS picks for this builder can find the row via
  // findReusableInterview.
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
  const builderEmail = authUser?.user?.email || null;

  const { data: insertedInterview, error: interviewErr } = await supabase
    .from("builder_interviews")
    .insert({
      token,
      builder_username: profile.username,
      builder_email: builderEmail,
      builder_name: profile.name || profile.username,
      expires_at: expiresAt,
      status: "ready",
      submitted_at: new Date().toISOString(),
      intro_who_are_you: answers.introWhoAreYou,
      intro_origin_story: answers.introOriginStory,
      intro_build_in_public: answers.introBuildInPublic,
      projects_main_project: answers.projectsMainProject,
      projects_problem_solved: answers.projectsProblemSolved,
      projects_stack: answers.projectsStack,
      projects_biggest_challenge: answers.projectsBiggestChallenge,
      projects_users_traction: answers.projectsUsersTraction,
      projects_links: answers.projectsLinks,
      quickfire_tool: answers.quickfireTool,
      quickfire_inspiration: answers.quickfireInspiration,
      quickfire_advice: answers.quickfireAdvice,
      quickfire_whats_next: answers.quickfireWhatsNext,
      quickfire_where_to_find: answers.quickfireWhereToFind,
      generated_blog_markdown: aiOut.blogMarkdown,
      generated_linkedin_post: aiOut.linkedinPost,
      generated_twitter_post: aiOut.twitterPost,
      generated_instagram_caption: aiOut.instagramCaption,
      generated_instagram_carousel_prompt: aiOut.instagramCarouselPrompt,
      generated_instagram_story_prompt: aiOut.instagramStoryPrompt,
      typefully_x_draft_id: xDraftId?.toString(),
      typefully_x_draft_url: xDraftUrl,
      typefully_linkedin_draft_id: linkedinDraftId?.toString(),
      typefully_linkedin_draft_url: linkedinDraftUrl,
      blog_post_id: blogPostId,
    })
    .select("id")
    .single();

  let interviewId: string | null = null;
  if (interviewErr) {
    console.error("interview insert error (non-fatal):", interviewErr);
  } else if (insertedInterview) {
    interviewId = insertedInterview.id;
    // Backfill the reverse pointer.
    if (blogPostId) {
      await supabase
        .from("blog_posts")
        .update({ interview_id: interviewId })
        .eq("id", blogPostId);
    }
  }

  // One-shot admin notification per pick. Same email the form-submit
  // flow sends, just triggered from the cron path now.
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io";
    await sendRenderedEmail({
      to: process.env.NOTIFY_EMAIL || "",
      subject: `🎙️ ${profile.name || profile.username} es Builder de la Semana (auto-armado)`,
      react: React.createElement(InterviewNotificationEmail, {
        builderName: profile.name || profile.username,
        builderUsername: profile.username,
        blogTitle: aiOut.blogTitle,
        blogExcerpt: aiOut.blogExcerpt,
        xDraftUrl,
        linkedinDraftUrl,
        adminUrl: `${siteUrl}/admin`,
      }),
    });
    if (interviewId) {
      await supabase
        .from("builder_interviews")
        .update({ admin_notified_at: new Date().toISOString() })
        .eq("id", interviewId);
    }
  } catch (e) {
    console.error("Admin notification email error (non-fatal):", e);
  }

  // Public URL the builder follows to upgrade the auto-armed draft
  // with their own words. The form endpoint accepts both `invited` and
  // `ready` rows, so this works against the synthetic interview row
  // we just created.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io";
  const formUrl = `${siteUrl}/builder-de-la-semana/${token}`;

  // Winner email last so any earlier failure surfaces before we tell
  // the builder anything.
  let emailSent = false;
  let emailError: string | null = null;
  if (sendEmail) {
    const r = await sendWinnerEmail(supabase, profile, week, formUrl);
    emailSent = r.sent;
    emailError = r.error ?? null;
  }

  return {
    username: profile.username,
    blogPostId,
    interviewId,
    formUrl,
    source,
    emailSent,
    emailError,
  };
}

// After all individual posts are generated for a multi-winner week,
// regenerate the joint Instagram carousel prompt and write it back to
// every interview row. Pulls `intro_who_are_you` etc. from the rows
// (since the pipeline now persists those even for synthesized picks).
export async function regenerateJointCarouselForWeek(
  supabase: any,
  week: string
): Promise<{ updated: number } | null> {
  const { data: weekInterviews } = await supabase
    .from("builder_interviews")
    .select(
      "id, builder_username, builder_name, intro_who_are_you, projects_main_project, projects_problem_solved, projects_stack, blog_post_id"
    )
    .in("status", ["ready", "published"]);

  if (!weekInterviews) return null;

  const { data: winners } = await supabase
    .from("showcase_winners")
    .select("user_id, profiles:profiles!showcase_winners_user_id_fkey(username)")
    .eq("week", week);

  const usernames = new Set(
    (winners || [])
      .map((w: any) => w.profiles?.username)
      .filter(Boolean) as string[]
  );

  if (usernames.size < 2) return null;

  const relevantInterviews = (weekInterviews || []).filter((i: any) =>
    usernames.has(i.builder_username)
  );

  // Need a row per winner to build a meaningful joint prompt.
  if (relevantInterviews.length < 2) return null;

  const builders: JointCarouselBuilder[] = relevantInterviews.map((i: any) => ({
    name: i.builder_name || i.builder_username,
    username: i.builder_username,
    introWhoAreYou: i.intro_who_are_you || "",
    projectsMainProject: i.projects_main_project || "",
    projectsProblemSolved: i.projects_problem_solved || "",
    projectsStack: i.projects_stack || "",
  }));

  const jointPrompt = await generateJointCarouselPrompt(builders, week);
  const ids = relevantInterviews.map((i: any) => i.id);

  const { error } = await supabase
    .from("builder_interviews")
    .update({ generated_instagram_carousel_prompt: jointPrompt })
    .in("id", ids);

  if (error) {
    console.error("Joint carousel update error:", error);
    return null;
  }
  return { updated: ids.length };
}
