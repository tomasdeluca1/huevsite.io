import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRenderedEmail } from "@/lib/email";
import { BuilderReviewFeedbackEmail } from "@/components/emails/BuilderReviewFeedbackEmail";
import React from "react";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Statuses where the builder is allowed to see and review content.
const REVIEWABLE_STATUSES = new Set(["submitted", "generating", "ready", "published"]);

// GET — fetch generated content for review page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getServiceRoleClient();

  const { data: interview, error: queryError } = await supabase
    .from("builder_interviews")
    .select(
      `
      id,
      builder_name,
      builder_username,
      status,
      builder_approved_at,
      builder_feedback,
      generated_blog_markdown,
      generated_twitter_post,
      generated_linkedin_post,
      generated_instagram_caption,
      generated_instagram_carousel,
      story_video_path,
      story_video_uploaded_at,
      story_video_size_bytes,
      story_video_mime_type
    `
    )
    .eq("token", token)
    .maybeSingle();

  if (queryError) {
    console.error("Review GET query error:", queryError);
    return NextResponse.json(
      { error: queryError.message },
      { status: 500 }
    );
  }

  if (!interview) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!REVIEWABLE_STATUSES.has(interview.status)) {
    return NextResponse.json(
      { error: "not_ready", status: interview.status },
      { status: 409 }
    );
  }

  return NextResponse.json({
    id: interview.id,
    builderName: interview.builder_name,
    builderUsername: interview.builder_username,
    status: interview.status,
    approvedAt: interview.builder_approved_at,
    previousFeedback: interview.builder_feedback,
    content: {
      blogMarkdown: interview.generated_blog_markdown,
      twitterPost: interview.generated_twitter_post,
      linkedinPost: interview.generated_linkedin_post,
      instagramCaption: interview.generated_instagram_caption,
      instagramCarousel: Array.isArray(interview.generated_instagram_carousel)
        ? interview.generated_instagram_carousel
        : [],
    },
    video: interview.story_video_path
      ? {
          uploadedAt: interview.story_video_uploaded_at,
          sizeBytes: interview.story_video_size_bytes,
          mimeType: interview.story_video_mime_type,
        }
      : null,
  });
}

// POST — builder approves or requests changes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body.approved !== "boolean") {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const feedback: string | null =
    typeof body.feedback === "string" && body.feedback.trim().length > 0
      ? body.feedback.trim().slice(0, 4000)
      : null;

  // Require feedback when requesting changes
  if (!body.approved && !feedback) {
    return NextResponse.json(
      { error: "Necesitamos un comentario para saber qué cambiar." },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();

  const { data: interview, error: queryError } = await supabase
    .from("builder_interviews")
    .select("id, builder_name, builder_username, status")
    .eq("token", token)
    .maybeSingle();

  if (queryError) {
    console.error("Review POST query error:", queryError);
    return NextResponse.json(
      { error: queryError.message },
      { status: 500 }
    );
  }

  if (!interview) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!REVIEWABLE_STATUSES.has(interview.status)) {
    return NextResponse.json(
      { error: "not_ready", status: interview.status },
      { status: 409 }
    );
  }

  const approvedAt = body.approved ? new Date().toISOString() : null;

  const { error: updateErr } = await supabase
    .from("builder_interviews")
    .update({
      builder_approved_at: approvedAt,
      builder_feedback: feedback,
    })
    .eq("id", interview.id);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 }
    );
  }

  // Notify admin
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io";
    await sendRenderedEmail({
      to: "admin@example.com",
      subject: body.approved
        ? `✅ ${interview.builder_name} aprobó su entrevista`
        : `✍️ ${interview.builder_name} pidió cambios en su entrevista`,
      react: React.createElement(BuilderReviewFeedbackEmail, {
        builderName: interview.builder_name,
        builderUsername: interview.builder_username,
        approved: body.approved,
        feedback,
        adminUrl: `${siteUrl}/admin/interviews/${interview.id}`,
      }),
    });
  } catch (e) {
    console.error("Builder review notification email error:", e);
    // Non-blocking — response still succeeds
  }

  return NextResponse.json({
    success: true,
    approved: body.approved,
  });
}
