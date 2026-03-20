import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  dedupeImportedLinks,
  ensureAbsoluteUrl,
  type ImportedLinktreeLink,
  normalizeImportedLink,
} from "@/lib/linktree-import";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

function isAllowedLinktreeHost(hostname: string) {
  return (
    /(^|\.)linktr\.ee$/i.test(hostname) ||
    /(^|\.)linktree\.com$/i.test(hostname) ||
    /(^|\.)bio\.site$/i.test(hostname)
  );
}

export async function POST(request: NextRequest) {
  let browser: any;

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

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
        { error: "Por ahora solo soportamos links de Linktree o Bio Site." },
        { status: 400 }
      );
    }

    const playwright = await import("playwright");
    browser = await playwright.chromium.launch({
      headless: true,
    });

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
          normalizeText(document.title.replace(/\s*\|\s*(Linktree|Bio Site).*$/i, "")),
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

    return NextResponse.json({
      sourceUrl: url,
      displayName: imported.displayName,
      bio: imported.bio,
      avatarUrl: imported.avatarUrl,
      links: filteredLinks.slice(0, 12),
    });
  } catch (error) {
    console.error("Linktree import error:", error);
    return NextResponse.json(
      { error: "No pudimos leer ese Linktree o Bio Site. Revisa la URL y reintenta." },
      { status: 500 }
    );
  } finally {
    await browser?.close().catch(() => null);
  }
}
