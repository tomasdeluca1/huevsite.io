import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .trim();
}

function pickMeta(html: string, patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtml(m[1]);
  }
  return "";
}

// Block obvious internal/loopback/link-local hosts to limit SSRF. Not airtight
// (no DNS resolution), but rejects the easy cases for an authed convenience endpoint.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "0.0.0.0" || h === "::1" || h === "[::1]") return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h === "169.254.169.254" || h === "metadata.google.internal") return true;
  return false;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let raw: string;
  try {
    ({ url: raw } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  let url = (raw || "").trim();
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url.replace(/^\/+/, "");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "blocked_host" }, { status: 400 });
  }

  // Best-effort fetch. On any failure we still return the URL so the caller can
  // create the project with the link and let the user fill the rest manually.
  let html = "";
  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; huevsite/1.0; +https://huevsite.io) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      html = (await res.text()).slice(0, 500_000);
    }
  } catch {
    // ignore — fall through with empty html
  }

  const title = pickMeta(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ]);
  const description = pickMeta(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  ]);
  let imageUrl = pickMeta(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ]);
  // Resolve protocol-relative / root-relative og:image against the page origin.
  if (imageUrl) {
    try {
      imageUrl = new URL(imageUrl, parsed.origin).toString();
    } catch {
      imageUrl = "";
    }
  }

  // Favicon (any rel containing "icon"). Resolve against origin; fall back to
  // the conventional /favicon.ico so we always offer a favicon option.
  let faviconUrl = pickMeta(html, [
    // Prefer the apple-touch-icon (usually 180×180) — crisper than favicon.ico.
    /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon[^"']*["']/i,
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i,
  ]);
  if (faviconUrl) {
    try {
      faviconUrl = new URL(faviconUrl, parsed.origin).toString();
    } catch {
      faviconUrl = "";
    }
  }
  if (!faviconUrl) faviconUrl = `${parsed.origin}/favicon.ico`;

  return NextResponse.json({ url: parsed.toString(), title, description, imageUrl, faviconUrl });
}
