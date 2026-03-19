const DEFAULT_SITE_URL = "https://huevsite.io";

function normalizeSiteUrl(rawUrl?: string | null) {
  const value = rawUrl?.trim();

  if (!value) {
    return DEFAULT_SITE_URL;
  }

  try {
    const url = new URL(value);

    if (url.hostname === "www.huevsite.io") {
      url.hostname = "huevsite.io";
    }

    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
