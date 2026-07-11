import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { WeeklyDigestEmail } from "@/components/emails/WeeklyDigestEmail";
import { postWeeklyDigest } from "@/lib/twitter";
import { postWeeklyDigestLinkedIn } from "@/lib/linkedin";
import { resolveXHandles } from "@/lib/twitter-utils";
import { buildUnsubscribeUrl } from "@/lib/email-unsubscribe";
import { listAllAuthUsers } from "@/lib/list-auth-users";
import { getAllBlogPosts, getPostCategory } from "@/lib/blog-data";
import { getWeekLaunches } from "@/lib/launch-service";
import { currentLaunchWeek } from "@/lib/launch-week";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

const DAY = 24 * 60 * 60 * 1000;
const UNSUB_MARKER = "__UNSUB_URL__";

/**
 * Weekly community digest cron (Fridays).
 *  - Posts a tweet: top point-gainers of the week + new projects + latest news.
 *  - Emails the same digest to all users with a published profile, minus those
 *    who unsubscribed (community_digest_unsubscribed).
 *  - Writes a fresh score snapshot so next week can compute deltas.
 *
 * Query params (admin/manual):
 *  - secret=<ADMIN_SECRET>   auth for manual trigger
 *  - preview=1               compose everything, send nothing, write nothing
 *  - test_email=<addr>       send only to this address (no tweet, no snapshot)
 *  - force=1                 bypass the once-a-week freshness guard
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const preview = searchParams.get("preview") === "1";
    const testEmail = searchParams.get("test_email");
    const force = searchParams.get("force") === "1";

    const isCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isAdminSecret = secret && secret === process.env.ADMIN_SECRET;
    if (!isCron && !isAdminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const isTest = !!testEmail;
    const isDryRun = preview || isTest;

    // -- Freshness guard: don't double-run within the same week. ----------
    if (!isDryRun && !force) {
      const { data: lastSnap } = await supabase
        .from("score_snapshots")
        .select("snapshot_at")
        .order("snapshot_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastSnap?.snapshot_at) {
        const age = now.getTime() - new Date(lastSnap.snapshot_at).getTime();
        if (age < 5 * DAY) {
          return NextResponse.json({ skipped: true, reason: "already ran this week", lastRun: lastSnap.snapshot_at });
        }
      }
    }

    const weekAgo = new Date(now.getTime() - 7 * DAY);
    const weekLabel = `${weekAgo.getDate()}/${weekAgo.getMonth() + 1} al ${now.getDate()}/${now.getMonth() + 1}`;

    // -- 1. Current scores + profile metadata (published profiles only). --
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, name, image, builder_score, community_digest_unsubscribed")
      .not("username", "is", null);
    const profiles = profilesData || [];

    // -- 2. Previous snapshot per user (most recent prior to this run). ----
    const { data: snapsData } = await supabase
      .from("score_snapshots")
      .select("user_id, score, snapshot_at")
      .gte("snapshot_at", new Date(now.getTime() - 21 * DAY).toISOString())
      .order("snapshot_at", { ascending: false });
    const prevScore = new Map<string, number>();
    for (const s of snapsData || []) {
      if (!prevScore.has(s.user_id)) prevScore.set(s.user_id, s.score || 0);
    }

    // -- 3. Top movers (only when we have a baseline to diff against). -----
    const movers = profiles
      .filter((p) => prevScore.has(p.id))
      .map((p) => ({
        name: p.name || p.username,
        username: p.username as string,
        delta: (p.builder_score || 0) - (prevScore.get(p.id) || 0),
      }))
      .filter((m) => m.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3);

    // -- 4. New projects this week. ---------------------------------------
    const { count: newProjectsCount } = await supabase
      .from("blocks")
      .select("id", { count: "exact", head: true })
      .in("type", ["project", "building"])
      .gte("created_at", weekAgo.toISOString());

    const { data: recentBlocks } = await supabase
      .from("blocks")
      .select("data, user_id, created_at")
      .in("type", ["project", "building"])
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(3);

    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const featuredProjects = (recentBlocks || [])
      .map((b: any) => ({
        title: b.data?.title || b.data?.project || "Nuevo proyecto",
        username: profileById.get(b.user_id)?.username || "builder",
      }))
      .filter((p) => p.username !== "builder");

    // -- 4b. This week's launches (ranked; Pro/featured first). ------------
    let weekLaunches: { title: string; username: string; upvoteCount: number; featured: boolean }[] = [];
    try {
      const { launches } = await getWeekLaunches(currentLaunchWeek());
      weekLaunches = launches.slice(0, 8).map((l) => ({
        title: l.title,
        username: l.user.username,
        upvoteCount: l.upvoteCount,
        featured: l.featured,
      }));
    } catch (e) {
      console.error("[weekly-digest] week launches failed:", e);
    }

    // -- 5. Latest "Novedades" blog post. ---------------------------------
    const allPosts = await getAllBlogPosts();
    const latestNews = allPosts
      .filter((p) => getPostCategory(p) === "novedades")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const news = latestNews ? { title: latestNews.title, slug: latestNews.slug } : null;

    // -- 6. Tweet. --------------------------------------------------------
    // Resolve real X handles for the movers: @mention only when the user has
    // X linked; otherwise their plain huevsite username (never @username).
    let moverMentions: Record<string, string> = {};
    try {
      moverMentions = await resolveXHandles(movers.map((m) => m.username));
    } catch (e) {
      console.error("[weekly-digest] resolveXHandles failed:", e);
    }
    const tweetMovers = movers.map((m) => ({
      username: m.username,
      mention: moverMentions[m.username],
      delta: m.delta,
    }));

    const tweetText = await postWeeklyDigest(tweetMovers, newProjectsCount || 0, news, true);
    let tweetPosted = false;
    if (!isDryRun && tweetText) {
      try {
        await postWeeklyDigest(tweetMovers, newProjectsCount || 0, news, false);
        tweetPosted = true;
      } catch (e) {
        console.error("[weekly-digest] tweet failed:", e);
      }
    }

    // -- 6b. LinkedIn (huevsite.io company page): names, never @handles. ----
    const linkedInMovers = movers.map((m) => ({ name: m.name, delta: m.delta }));
    const linkedInText = await postWeeklyDigestLinkedIn(linkedInMovers, newProjectsCount || 0, news, true);
    let linkedInPosted = false;
    if (!isDryRun && linkedInText) {
      try {
        await postWeeklyDigestLinkedIn(linkedInMovers, newProjectsCount || 0, news, false);
        linkedInPosted = true;
      } catch (e) {
        console.error("[weekly-digest] linkedin failed:", e);
      }
    }

    // -- 7. Email. Render once with a marker, swap the per-user unsub link. -
    const emailHtmlTemplate = await render(
      React.createElement(WeeklyDigestEmail, {
        weekLabel,
        movers: movers.map((m) => ({ name: m.name, username: m.username, delta: m.delta })),
        newProjectsCount: newProjectsCount || 0,
        featuredProjects,
        weekLaunches,
        news,
        unsubscribeUrl: UNSUB_MARKER,
      })
    );

    const subject = `🥚 Resumen semanal de huevsite — ${weekLabel}`;
    let emailsSent = 0;
    const errors: string[] = [];

    if (isTest) {
      const html = emailHtmlTemplate.replaceAll(UNSUB_MARKER, buildUnsubscribeUrl("test"));
      await resend.emails.send({ from: process.env.EMAIL_FROM || "hi@huevsite.studio", to: testEmail!, subject, html });
      emailsSent = 1;
    } else if (!preview) {
      const authUsers = await listAllAuthUsers(supabase);

      for (const u of authUsers) {
        if (!u.email) continue;
        const prof = profileById.get(u.id);
        if (!prof) continue; // no published profile
        if (prof.community_digest_unsubscribed) continue; // opted out

        const html = emailHtmlTemplate.replaceAll(UNSUB_MARKER, buildUnsubscribeUrl(u.id));
        try {
          await resend.emails.send({ from: process.env.EMAIL_FROM || "hi@huevsite.studio", to: u.email, subject, html });
          emailsSent++;
          await new Promise((r) => setTimeout(r, 100));
        } catch (err: any) {
          errors.push(`${u.email}: ${err?.message}`);
        }
      }
    }

    // -- 8. Write this week's snapshot (the baseline for next week). -------
    let snapshotsWritten = 0;
    if (!isDryRun) {
      const rows = profiles.map((p) => ({ user_id: p.id, score: p.builder_score || 0 }));
      if (rows.length > 0) {
        const { error: insErr } = await supabase.from("score_snapshots").insert(rows);
        if (insErr) console.error("[weekly-digest] snapshot insert error:", insErr);
        else snapshotsWritten = rows.length;
      }
    }

    return NextResponse.json({
      success: true,
      preview,
      test: isTest,
      weekLabel,
      tweet: { text: tweetText, posted: tweetPosted },
      linkedin: { text: linkedInText, posted: linkedInPosted },
      movers,
      newProjectsCount: newProjectsCount || 0,
      featuredProjects,
      news,
      emailsSent,
      snapshotsWritten,
      errors,
    });
  } catch (error: any) {
    console.error("[weekly-digest] error:", error);
    return NextResponse.json({ error: error?.message || "Algo salió mal." }, { status: 500 });
  }
}
