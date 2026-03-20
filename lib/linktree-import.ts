import { SOCIAL_PLATFORMS, type SocialPlatformKey } from "@/lib/social-platforms";

export interface ImportedLinktreeLink {
  title: string;
  url: string;
  platform: SocialPlatformKey | "website";
  hostname: string;
  category: ImportedLinkCategory;
  imageUrl?: string;
}

export type ImportedLinkCategory =
  | "social"
  | "writing"
  | "media"
  | "project"
  | "community"
  | "other";

export interface LinktreeImportData {
  sourceUrl: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  links: ImportedLinktreeLink[];
}

const PLATFORM_HOSTS: Array<{ match: RegExp; platform: SocialPlatformKey }> = [
  { match: /(^|\.)github\.com$/i, platform: "github" },
  { match: /(^|\.)x\.com$/i, platform: "twitter" },
  { match: /(^|\.)twitter\.com$/i, platform: "twitter" },
  { match: /(^|\.)linkedin\.com$/i, platform: "linkedin" },
  { match: /(^|\.)instagram\.com$/i, platform: "instagram" },
  { match: /(^|\.)youtube\.com$/i, platform: "youtube" },
  { match: /(^|\.)youtu\.be$/i, platform: "youtube" },
  { match: /(^|\.)discord\.com$/i, platform: "discord" },
  { match: /(^|\.)discord\.gg$/i, platform: "discord" },
  { match: /(^|\.)t\.me$/i, platform: "telegram" },
  { match: /(^|\.)telegram\.me$/i, platform: "telegram" },
  { match: /(^|\.)warpcast\.com$/i, platform: "farcaster" },
  { match: /(^|\.)twitch\.tv$/i, platform: "twitch" },
];

export function ensureAbsoluteUrl(input: string) {
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}

export function classifyLinkPlatform(url: string): ImportedLinktreeLink["platform"] {
  try {
    const hostname = new URL(ensureAbsoluteUrl(url)).hostname.replace(/^www\./, "");
    const matched = PLATFORM_HOSTS.find(({ match }) => match.test(hostname));
    return matched?.platform || "website";
  } catch {
    return "website";
  }
}

export function normalizeImportedLink(
  url: string,
  title?: string | null,
  imageUrl?: string | null
): ImportedLinktreeLink | null {
  try {
    const normalizedUrl = ensureAbsoluteUrl(url).trim();
    const parsed = new URL(normalizedUrl);

    if (!/^https?:$/i.test(parsed.protocol)) {
      return null;
    }

    const hostname = parsed.hostname.replace(/^www\./, "");
    const cleanTitle = (title || "").trim();

    const absoluteUrl = parsed.toString();

    return {
      title: cleanTitle || hostname,
      url: absoluteUrl,
      platform: classifyLinkPlatform(absoluteUrl),
      hostname,
      category: inferImportedLinkCategory(absoluteUrl, cleanTitle || hostname),
      imageUrl: imageUrl?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

export function dedupeImportedLinks(links: Array<ImportedLinktreeLink | null | undefined>) {
  const seen = new Set<string>();

  return links.filter((link): link is ImportedLinktreeLink => {
    if (!link) return false;

    const key = link.url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export function getLinktreeFeaturedLinks(data: LinktreeImportData | null | undefined, limit = 2) {
  if (!data?.links?.length) return [];

  const genericLinks = data.links.filter((link) => link.platform === "website");
  const sourceLinks = genericLinks.length > 0 ? genericLinks : data.links;

  return sourceLinks.slice(0, limit);
}

export function getImportedLinkLabel(link: ImportedLinktreeLink) {
  if (link.platform !== "website") {
    return SOCIAL_PLATFORMS[link.platform]?.label || link.platform;
  }

  return link.hostname.replace(/\.[a-z]{2,}$/i, "").replace(/[-_]/g, " ");
}

export function extractGitHubProfileUsername(url: string) {
  try {
    const parsed = new URL(ensureAbsoluteUrl(url));
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname !== "github.com") return null;

    const [username, maybeRepo] = parsed.pathname.split("/").filter(Boolean);
    if (!username || maybeRepo) return null;
    if (username.toLowerCase() === "features") return null;

    return username;
  } catch {
    return null;
  }
}

export function inferImportedLinkCategory(url: string, title?: string) {
  try {
    const parsed = new URL(ensureAbsoluteUrl(url));
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const haystack = `${hostname} ${pathname} ${(title || "").toLowerCase()}`;
    const platform = classifyLinkPlatform(url);

    if (platform !== "website") {
      if (platform === "discord" || platform === "telegram") {
        return "community";
      }

      if (platform === "youtube" || /\/watch|\/shorts|\/embed|\/video|\/reel/.test(pathname)) {
        return "media";
      }

      if (
        (platform === "linkedin" && /\/posts\/|\/activity\/|\/recent-activity/.test(pathname)) ||
        ((platform === "twitter" || platform === "farcaster") && /\/status\/|\/post\//.test(pathname))
      ) {
        return "writing";
      }

      if (platform === "github" && pathname.split("/").filter(Boolean).length > 1) {
        return "project";
      }

      return "social";
    }

    if (
      /medium\.com|substack\.com|hashnode\.com|dev\.to|mirror\.xyz|beehiiv\.com|ghost\.io/.test(hostname) ||
      /\b(blog|post|article|essays?|newsletter|substack|writing|notes)\b/.test(haystack)
    ) {
      return "writing";
    }

    if (
      /youtube\.com|youtu\.be|vimeo\.com|loom\.com|tiktok\.com/.test(hostname) ||
      /\b(video|demo|watch|trailer|clip|showreel)\b/.test(haystack)
    ) {
      return "media";
    }

    if (
      /\b(discord|community|slack|forum|telegram)\b/.test(haystack)
    ) {
      return "community";
    }

    if (
      /\b(product|app|studio|agency|portfolio|work|project|tool|saas|site|web|store|shop|launch|landing|docs)\b/.test(haystack)
    ) {
      return "project";
    }

    return "project";
  } catch {
    return "other";
  }
}
