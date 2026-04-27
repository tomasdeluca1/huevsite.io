import { NextRequest, NextResponse } from "next/server";
import React from "react";
import crypto from "crypto";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { getAdminClient } from "@/lib/admin-auth";
import { generateInterviewContent } from "@/lib/openrouter";
import { WinnerEmail } from "@/components/emails/WinnerEmail";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/admin/auto-bdls-from-profile
//
// Pick a winner without making them fill the interview form. Pulls the
// profile + visible blocks, synthesizes interview-style answers from
// them, runs the same generation pipeline as the regular interview
// submit, and creates a blog_posts row with is_published=false so the
// admin can review it from /admin/interviews/[id] before publishing.
//
// Query params:
//   username   (required) — huevsite username of the builder
//   week       (required) — ISO week, e.g. "2026-W17"
//   email      (optional) — send winner email if "1" (default: "1")
//   regenerate (optional) — overwrite an existing blog_post for the same
//                           week. Default: false. Without this, if a blog
//                           post already exists with the target slug, we
//                           skip generation and just ensure the winner row
//                           and email exist.
function pickStr(...vals: any[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function blocksByType(blocks: any[], type: string): any[] {
  return blocks.filter((b) => b.type === type);
}

// Synthesize the answers the builder would have written in the interview
// form, but derived from what's already on their public huevsite.
function synthesizeInterviewAnswers(profile: any, blocks: any[]) {
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
    quickfireWhereToFind: quickfireWhereToFind,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const week = searchParams.get("week");
  const sendEmail = searchParams.get("email") !== "0";
  const regenerate = searchParams.get("regenerate") === "1";

  if (!username || !week) {
    return NextResponse.json(
      { error: "Faltan ?username= y ?week= (ej: ?username=galfrevn&week=2026-W17)" },
      { status: 400 }
    );
  }

  // 1. Profile + blocks
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, name, tagline, location, github_handle, image")
    .eq("username", username)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json({ error: `Perfil ${username} no encontrado` }, { status: 404 });
  }

  const { data: blocks } = await supabase
    .from("blocks")
    .select("type, data")
    .eq("user_id", profile.id)
    .is("sub_site_id", null)
    .eq("visible", true);

  // 2. Ensure winner row
  const { data: existingWinner } = await supabase
    .from("showcase_winners")
    .select("id")
    .eq("user_id", profile.id)
    .eq("week", week)
    .maybeSingle();

  let winnerInserted = false;
  if (!existingWinner) {
    const { error: winnerErr } = await supabase
      .from("showcase_winners")
      .insert({ user_id: profile.id, week });
    if (winnerErr) {
      return NextResponse.json(
        { error: `No pude insertar el winner: ${winnerErr.message}` },
        { status: 500 }
      );
    }
    winnerInserted = true;
  }

  // 3. Co-winners for the same week (other than this builder), so the
  // generated content can cross-reference them.
  const { data: siblings } = await supabase
    .from("showcase_winners")
    .select("user_id, profiles:profiles!showcase_winners_user_id_fkey(name, username)")
    .eq("week", week)
    .neq("user_id", profile.id);
  const coWinners = (siblings || [])
    .map((s: any) => s.profiles)
    .filter(Boolean)
    .map((p: any) => ({ name: p.name || p.username, username: p.username }));

  // 4. Existing blog_post for this username+week → skip unless ?regenerate=1
  const slug = `builder-de-la-semana-${username}-${week.toLowerCase()}`;
  const { data: existingBlogPost } = await supabase
    .from("blog_posts")
    .select("id, slug, is_published")
    .eq("slug", slug)
    .maybeSingle();

  let blogPostId: string | null = existingBlogPost?.id ?? null;
  let generated = false;

  if (!existingBlogPost || regenerate) {
    // 5. Generate blog content from synthesized answers
    const answers = synthesizeInterviewAnswers(profile, blocks || []);
    const aiOut = await generateInterviewContent({ ...answers, coWinners, weekLabel: week });

    const blogTags = Array.from(
      new Set([...(aiOut.blogTags || []), "builder-de-la-semana"])
    );

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
          author_avatar_url: profile.image || `https://huevsite.io/api/og/${profile.username}`,
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBlogPost.id);
      if (updErr) {
        return NextResponse.json(
          { error: `Update blog_post failed: ${updErr.message}` },
          { status: 500 }
        );
      }
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
          author_avatar_url:
            profile.image || `https://huevsite.io/api/og/${profile.username}`,
          is_published: false,
        })
        .select("id")
        .single();

      if (insertErr || !newBlogPost) {
        return NextResponse.json(
          { error: `Insert blog_post failed: ${insertErr?.message}` },
          { status: 500 }
        );
      }
      blogPostId = newBlogPost.id;
    }

    // 6. Synthetic builder_interviews row in status="ready" so the
    // admin review UI (/admin/interviews/[id]) shows the same Twitter /
    // LinkedIn / Instagram drafts that the regular interview flow
    // produces. We never email this token to anyone.
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    const builderEmail = authUser?.user?.email || null;

    const { error: interviewErr } = await supabase.from("builder_interviews").insert({
      token,
      builder_username: profile.username,
      builder_email: builderEmail,
      builder_name: profile.name || profile.username,
      expires_at: expiresAt,
      status: "ready",
      submitted_at: new Date().toISOString(),
      generated_blog_markdown: aiOut.blogMarkdown,
      generated_linkedin_post: aiOut.linkedinPost,
      generated_twitter_post: aiOut.twitterPost,
      generated_instagram_caption: aiOut.instagramCaption,
      generated_instagram_carousel: aiOut.instagramCarousel,
      blog_post_id: blogPostId,
    });

    if (interviewErr) {
      console.error("auto-bdls interview insert error:", interviewErr);
      // Non-fatal: blog post + winner are the load-bearing pieces.
    }

    generated = true;
  }

  // 7. Winner email (best-effort)
  let emailSent = false;
  let emailError: string | null = null;
  if (sendEmail) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
      const builderEmail = authUser?.user?.email;
      if (!builderEmail) {
        emailError = "No email on auth.users";
      } else {
        const html = await render(
          React.createElement(WinnerEmail, {
            name: profile.name || profile.username,
            username: profile.username,
            week,
            // No formUrl — the blog is auto-generated from their profile,
            // so they don't need to fill the interview form.
          })
        );
        await resend.emails.send({
          from: "hi@huevsite.studio",
          to: builderEmail,
          subject: "🏆 ¡Sos el builder de la semana en Huevsite!",
          html,
        });
        emailSent = true;
      }
    } catch (e: any) {
      emailError = e?.message || String(e);
    }
  }

  return NextResponse.json({
    success: true,
    username,
    week,
    winnerInserted,
    generatedBlog: generated,
    blogPostId,
    blogSlug: slug,
    coWinners,
    emailSent,
    emailError,
  });
}
