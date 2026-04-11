import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// After the 2026-04-11 hardening pass, ai_credits is no longer readable
// or writable from the user-session client. We auth with the session
// client and then switch to the service-role client for the credit
// read/decrement (always scoping queries to user.id).
function getServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
import { buildOnboardingBlocks } from "@/lib/onboarding-utils";
import {
  dedupeImportedLinks,
  ensureAbsoluteUrl,
  type ImportedLinktreeLink,
  normalizeImportedLink,
} from "@/lib/linktree-import";
import { scoreService } from "@/lib/score-service";
import { launchChromiumBrowser } from "@/lib/server/playwright";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

const LINKTREE_REFACTOR_COST = 1;

function isAllowedLinktreeHost(hostname: string) {
  return (
    /(^|\.)linktr\.ee$/i.test(hostname) ||
    /(^|\.)linktree\.com$/i.test(hostname) ||
    /(^|\.)bio\.site$/i.test(hostname)
  );
}

async function scrapeLinktree(url: string) {
  const browser = await launchChromiumBrowser();

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1800 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForTimeout(1800);

    const imported = await page.evaluate(() => {
      const normalizeText = (value?: string | null) =>
        (value || "").replace(/\s+/g, " ").trim();

      const getMeta = (name: string, attr: "property" | "name" = "property") =>
        (document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null)?.content || "";

      const avatar =
        (document.querySelector('img[alt*="profile" i]') as HTMLImageElement | null)?.src ||
        (document.querySelector('img[data-testid*="profile" i]') as HTMLImageElement | null)?.src ||
        (document.querySelector("img") as HTMLImageElement | null)?.src ||
        getMeta("og:image");

      const headingCandidates = [
        document.querySelector("h1"),
        document.querySelector("header h2"),
        document.querySelector('[data-testid="ProfileTitle"]'),
        document.querySelector("title"),
      ]
        .map((node) => normalizeText(node?.textContent))
        .filter(Boolean);

      const bioCandidates = [
        document.querySelector('[data-testid="ProfileDescription"]'),
        document.querySelector("header p"),
        document.querySelector("main p"),
        document.querySelector("meta[name=description]"),
      ]
        .map((node) =>
          node instanceof HTMLMetaElement ? normalizeText(node.content) : normalizeText(node?.textContent)
        )
        .filter(Boolean);

      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
        .map((anchor) => ({
          url: anchor.href,
          title:
            normalizeText(anchor.textContent) ||
            normalizeText(anchor.getAttribute("aria-label")) ||
            normalizeText(anchor.getAttribute("title")),
          imageUrl:
            (anchor.querySelector("img") as HTMLImageElement | null)?.src ||
            (anchor.querySelector('[style*="background-image"]') as HTMLElement | null)?.style.backgroundImage?.match(/url\(["']?(.*?)["']?\)/)?.[1] ||
            "",
        }))
        .filter((item) => item.url && item.title);

      return {
        displayName:
          headingCandidates[0] ||
          normalizeText(getMeta("og:title")) ||
          normalizeText(document.title.replace(/\s*\|\s*Linktree.*$/i, "")),
        bio: bioCandidates[0] || normalizeText(getMeta("description", "name")),
        avatarUrl: avatar || "",
        links: anchors,
      };
    });

    const filteredLinks = dedupeImportedLinks(
      imported.links
        .map((link: { url: string; title: string; imageUrl?: string }) =>
          normalizeImportedLink(link.url, link.title, link.imageUrl)
        )
        .filter((link: ImportedLinktreeLink | null): link is ImportedLinktreeLink => {
          if (!link) return false;

          const normalized = link.url.toLowerCase();
          if (normalized.includes("linktr.ee/") || normalized.includes("linktree.com/")) return false;
          if (normalized.includes("bio.site/")) return false;
          if (normalized.includes("/signin") || normalized.includes("/login")) return false;
          if (normalized.includes("/privacy") || normalized.includes("/terms")) return false;

          return true;
        })
    );

    return {
      sourceUrl: url,
      displayName: imported.displayName,
      bio: imported.bio,
      avatarUrl: imported.avatarUrl,
      links: filteredLinks.slice(0, 12),
    };
  } finally {
    await browser.close().catch(() => null);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionClient = createClient();
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Switch to service-role to read/write ai_credits and the other private
    // profile columns. All subsequent queries are scoped to user.id.
    const supabase = getServiceRoleClient();

    const { url: rawUrl } = await request.json();
    const url = ensureAbsoluteUrl((rawUrl || "").trim());

    if (!url) {
      return NextResponse.json({ error: "Falta la URL de Linktree o Bio Site." }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "La URL no es válida." }, { status: 400 });
    }

    if (!isAllowedLinktreeHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Por ahora sólo soportamos links de Linktree o Bio Site." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, name, tagline, image, accent_color, layout, roles, github_handle, ai_credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
    }

    const currentCredits = profile.ai_credits || 0;
    if (currentCredits < LINKTREE_REFACTOR_COST) {
      return NextResponse.json(
        { error: "No te quedan créditos IA para refactorizar con Linktree o Bio Site." },
        { status: 403 }
      );
    }

    const linktreeData = await scrapeLinktree(url);

    const { data: mainBlocks } = await supabase
      .from("blocks")
      .select("*")
      .eq("user_id", user.id)
      .is("sub_site_id", null)
      .order("order", { ascending: true });

    const githubBlock = (mainBlocks || []).find((block: any) => block.type === "github");
    const githubStats = githubBlock?.data?.stats || null;
    const topLanguages = Array.isArray(githubStats?.topLanguages)
      ? githubStats.topLanguages.map((lang: any) => lang?.name).filter(Boolean)
      : [];

    const generatedBlocks = buildOnboardingBlocks({
      state: {
        username: profile.username,
        accentColor: profile.accent_color,
        layout: profile.layout || "dev_heavy",
        roles: profile.roles || [],
        githubHandle: profile.github_handle || undefined,
        githubData:
          profile.github_handle && githubStats
            ? {
                username: profile.github_handle,
                avatarUrl: profile.image || "",
                name: profile.name || profile.username,
                bio: profile.tagline || "",
                publicRepos: githubStats.repos || 0,
                followers: githubStats.followers || 0,
                topLanguages,
                topRepos: [],
              }
            : null,
        linktreeData,
      },
      displayName: profile.name || profile.username,
      avatarUrl: profile.image || "",
      tagline: profile.tagline || "",
    });

    const nextName = linktreeData.displayName || profile.name || profile.username;
    const nextTagline = linktreeData.bio || profile.tagline || "";
    const nextImage = linktreeData.avatarUrl || profile.image || "";

    const { error: creditError } = await supabase
      .from("profiles")
      .update({
        name: nextName,
        tagline: nextTagline,
        image: nextImage,
        ai_credits: currentCredits - LINKTREE_REFACTOR_COST,
      })
      .eq("id", user.id)
      .eq("ai_credits", currentCredits);

    if (creditError) {
      return NextResponse.json(
        { error: "No pudimos descontar el crédito IA. Reintentá." },
        { status: 409 }
      );
    }

    await supabase.from("blocks").delete().eq("user_id", user.id).is("sub_site_id", null);

    const blocksToInsert = generatedBlocks.map((block) => ({
      user_id: user.id,
      type: block.type,
      order: block.order,
      col_span: block.col_span,
      row_span: block.row_span,
      visible: block.visible,
      sub_site_id: null,
      data:
        block.type === "hero"
          ? {
              name: block.name,
              tagline: block.tagline,
              avatarUrl: block.avatarUrl,
              status: block.status,
              location: block.location,
              description: block.description,
              roles: block.roles,
            }
          : block.type === "github"
          ? {
              username: block.username,
              stats: block.stats,
              showAdvanced: block.showAdvanced,
            }
          : block.type === "social"
          ? { links: block.links }
          : block.type === "stack"
          ? { items: block.items }
          : block.type === "project"
          ? {
              title: block.title,
              description: block.description,
              imageUrl: block.imageUrl,
              metrics: block.metrics,
              link: block.link,
              stack: block.stack,
            }
          : block.type === "writing"
          ? { posts: block.posts }
          : block.type === "media"
          ? {
              url: block.url,
              title: block.title,
              description: block.description,
              link: block.link,
            }
          : block.type === "custom"
          ? {
              label: block.label,
              title: block.title,
              description: block.description,
              link: block.link,
            }
          : {},
    }));

    if (blocksToInsert.length > 0) {
      const { error: insertError } = await supabase.from("blocks").insert(blocksToInsert);
      if (insertError) {
        console.error("Error recreating blocks:", insertError);
        return NextResponse.json({ error: "No pudimos recrear el board." }, { status: 500 });
      }
    }

    const newScore = await scoreService.recomputeScore(user.id);

    return NextResponse.json({
      success: true,
      aiCredits: currentCredits - LINKTREE_REFACTOR_COST,
      builderScore: newScore,
      profile: {
        ...profile,
        name: nextName,
        tagline: nextTagline,
        image: nextImage,
      },
      blocks: generatedBlocks,
    });
  } catch (error) {
    console.error("Linktree refactor error:", error);
    return NextResponse.json(
      { error: "No pudimos refactorizar el board con ese Linktree." },
      { status: 500 }
    );
  }
}
