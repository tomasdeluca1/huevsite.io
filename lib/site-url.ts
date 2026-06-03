// The apex (huevsite.io) 307-redirects to www.huevsite.io at the platform
// level, so www is the host that actually serves content. Advertise www
// everywhere (canonical, og:image, twitter:image, share links) to avoid a
// redirect hop — some OG/image crawlers (e.g. opengraph.xyz's preview fetcher)
// don't follow cross-host redirects on images and show a broken preview.
const DEFAULT_SITE_URL = "https://www.huevsite.io";

function normalizeSiteUrl(rawUrl?: string | null) {
  const value = rawUrl?.trim();

  if (!value) {
    return DEFAULT_SITE_URL;
  }

  try {
    const url = new URL(value);

    if (url.hostname === "huevsite.io") {
      url.hostname = "www.huevsite.io";
    }

    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
