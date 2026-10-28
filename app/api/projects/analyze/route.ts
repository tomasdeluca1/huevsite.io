import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pickMetaContent, pickLinkHref, pickTitleTag, resolveAssetUrl } from "@/lib/og-meta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  // URL final tras los redirects: las rutas relativas (og:image, favicon) se
  // resuelven contra ella, no contra la URL que escribió el usuario.
  let finalUrl = parsed.toString();
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
      finalUrl = res.url || finalUrl;
      html = (await res.text()).slice(0, 500_000);
    }
  } catch {
    // ignore — fall through with empty html
  }

  const title =
    pickMetaContent(html, ["og:title", "twitter:title"]) || pickTitleTag(html);
  const description = pickMetaContent(html, ["og:description", "twitter:description", "description"]);
  const imageUrl = resolveAssetUrl(
    pickMetaContent(html, ["og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"]),
    finalUrl,
  );

  // Prefer the apple-touch-icon (usually 180x180) over a generic icon. If the
  // page declares none, offer the conventional /favicon.ico of the final host.
  const faviconUrl =
    resolveAssetUrl(pickLinkHref(html, ["apple-touch-icon", "icon"]), finalUrl) ||
    resolveAssetUrl("/favicon.ico", finalUrl);

  return NextResponse.json({ url: parsed.toString(), title, description, imageUrl, faviconUrl });
}
