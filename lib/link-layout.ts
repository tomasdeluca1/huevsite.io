import { SOCIAL_PLATFORMS, type SocialPlatformKey, buildSocialUrl } from "@/lib/social-platforms";
import {
  type LinkBoxStyle,
  parseBoxStyleOverride,
  resolveBoxStyle,
} from "@/lib/profile-layout";

const SQUARE_PLATFORMS = new Set([
  "twitter",
  "github",
  "linkedin",
  "instagram",
  "youtube",
  "tiktok",
  "discord",
  "telegram",
  "twitch",
  "farcaster",
]);

const BUTTON_BLOCK_TYPES = new Set([
  "project",
  "building",
  "custom",
  "media",
  "cv",
  "certification",
  "achievement",
  "writing",
]);

const STUDIO_BLOCK_TYPES = new Set([
  "project",
  "building",
  "custom",
  "media",
  "cv",
  "certification",
  "achievement",
  "writing",
  "social",
  "github",
]);

export interface LayoutBlock {
  id: string;
  type: string;
  order: number;
  visible?: boolean;
  boxStyle?: string | null;
  title?: string;
  description?: string;
  link?: string;
  project?: string;
  imageUrl?: string;
  faviconUrl?: string;
  imageMode?: string;
  fileUrl?: string;
  name?: string;
  url?: string;
  username?: string;
  label?: string;
  links?: Array<{ platform?: string; url?: string; label?: string; handle?: string }>;
  posts?: Array<{ title?: string; link?: string; content?: string }>;
}

export interface PublicLinkButton {
  key: string;
  blockId: string;
  title: string;
  description: string;
  href?: string;
  imageUrl?: string;
  style: LinkBoxStyle;
}

export interface PublicSocialLink {
  key: string;
  blockId: string;
  platform: string;
  label: string;
  href: string;
}

export interface StudioLinkRow {
  blockId: string;
  type: string;
  title: string;
  subtitle: string;
  hidden: boolean;
  boxStyle: LinkBoxStyle | null;
  kind: "button" | "social";
}

export function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function platformFromUrl(value: string | undefined): string | null {
  const href = safeHttpUrl(value);
  if (!href) return null;
  const host = new URL(href).hostname.replace(/^www\./i, "").toLowerCase();
  if (host === "x.com" || host === "twitter.com") return "twitter";
  if (host === "github.com") return "github";
  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) return "linkedin";
  if (host === "instagram.com") return "instagram";
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "youtube";
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "discord.com" || host === "discord.gg") return "discord";
  if (host === "t.me" || host === "telegram.me" || host === "telegram.org") return "telegram";
  if (host === "twitch.tv") return "twitch";
  if (host === "warpcast.com") return "farcaster";
  return null;
}

export function isSocialSquare(platform: string | undefined, url?: string): boolean {
  const key = (platform || "").toLowerCase();
  if (key === "website") {
    const detected = platformFromUrl(url);
    return !!detected && SQUARE_PLATFORMS.has(detected);
  }
  if (SQUARE_PLATFORMS.has(key)) return true;
  const detected = platformFromUrl(url);
  return !!detected && SQUARE_PLATFORMS.has(detected);
}

function platformLabel(platform: string): string {
  const known = SOCIAL_PLATFORMS[platform as SocialPlatformKey];
  if (known) return known.short;
  if (platform === "tiktok") return "TIKTOK";
  return platform.toUpperCase().slice(0, 8);
}

function socialHref(link: { platform?: string; url?: string; handle?: string }): string | undefined {
  const direct = safeHttpUrl(link.url);
  if (direct) return direct;
  const handle = (link.handle || "").trim();
  if (!handle || !link.platform) return undefined;
  return safeHttpUrl(buildSocialUrl(link.platform, handle));
}

function sorted(blocks: LayoutBlock[]): LayoutBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function buildLinksLayout(blocks: LayoutBlock[], globalStyle: unknown): {
  buttons: PublicLinkButton[];
  socials: PublicSocialLink[];
} {
  const buttons: PublicLinkButton[] = [];
  const socials: PublicSocialLink[] = [];
  const seenSocial = new Set<string>();

  const pushSocial = (blockId: string, platform: string, href: string) => {
    const normalized = href.replace(/\/$/, "").toLowerCase();
    if (seenSocial.has(normalized)) return;
    seenSocial.add(normalized);
    socials.push({
      key: `${blockId}:${platform}:${socials.length}`,
      blockId,
      platform,
      label: platformLabel(platform),
      href,
    });
  };

  for (const block of sorted(blocks)) {
    if (block.visible === false) continue;
    const style = resolveBoxStyle(block.boxStyle, globalStyle);

    if (block.type === "social" && Array.isArray(block.links)) {
      block.links.forEach((link, index) => {
        const href = socialHref(link);
        if (!href) return;
        const detected = platformFromUrl(href);
        const platform = (link.platform || detected || "website").toLowerCase();
        if (isSocialSquare(platform, href)) {
          pushSocial(block.id, detected && SQUARE_PLATFORMS.has(detected) ? detected : platform, href);
          return;
        }
        buttons.push({
          key: `${block.id}:link:${index}`,
          blockId: block.id,
          title: (link.label || "Web").trim() || "Web",
          description: "",
          href,
          style,
        });
      });
      continue;
    }

    if (block.type === "github") {
      const username = (block.username || "").trim().replace(/^@/, "");
      const href = safeHttpUrl(username ? `https://github.com/${username}` : "");
      if (href) pushSocial(block.id, "github", href);
      continue;
    }

    if (block.type === "writing" && Array.isArray(block.posts)) {
      block.posts.forEach((post, index) => {
        const title = (post.title || "").trim();
        const href = safeHttpUrl(post.link);
        if (!title && !href) return;
        buttons.push({
          key: `${block.id}:post:${index}`,
          blockId: block.id,
          title: title || "Nota",
          description: "",
          href,
          style,
        });
      });
      continue;
    }

    if (!BUTTON_BLOCK_TYPES.has(block.type)) continue;

    const image =
      block.imageMode === "favicon"
        ? block.faviconUrl || block.imageUrl
        : block.imageUrl || block.faviconUrl;

    if (block.type === "project") {
      const title = (block.title || "").trim();
      const href = safeHttpUrl(block.link);
      if (!title && !href) continue;
      buttons.push({
        key: block.id,
        blockId: block.id,
        title: title || "Proyecto",
        description: (block.description || "").trim(),
        href,
        imageUrl: image || undefined,
        style,
      });
      continue;
    }

    if (block.type === "building") {
      const title = (block.project || block.title || "").trim();
      const href = safeHttpUrl(block.link);
      if (!title && !href) continue;
      buttons.push({
        key: block.id,
        blockId: block.id,
        title: title || "Building",
        description: (block.description || "").trim(),
        href,
        style,
      });
      continue;
    }

    if (block.type === "cv") {
      const title = (block.title || "CV").trim();
      buttons.push({
        key: block.id,
        blockId: block.id,
        title,
        description: (block.description || "").trim(),
        href: safeHttpUrl(block.fileUrl || block.link),
        style,
      });
      continue;
    }

    if (block.type === "media") {
      const title = (block.title || "Media").trim();
      buttons.push({
        key: block.id,
        blockId: block.id,
        title,
        description: (block.description || "").trim(),
        href: safeHttpUrl(block.link || block.url),
        imageUrl: image || safeHttpUrl(block.url),
        style,
      });
      continue;
    }

    if (block.type === "certification") {
      const title = (block.name || block.title || "").trim();
      if (!title) continue;
      buttons.push({
        key: block.id,
        blockId: block.id,
        title,
        description: (block.description || "").trim(),
        href: safeHttpUrl(block.link),
        style,
      });
      continue;
    }

    if (block.type === "achievement") {
      const title = (block.title || "").trim();
      if (!title) continue;
      buttons.push({
        key: block.id,
        blockId: block.id,
        title,
        description: (block.description || "").trim(),
        style,
      });
      continue;
    }

    if (block.type === "custom") {
      const title = (block.title || block.label || "").trim();
      const href = safeHttpUrl(block.link);
      if (!title && !href) continue;
      buttons.push({
        key: block.id,
        blockId: block.id,
        title: title || "Link",
        description: (block.description || "").trim(),
        href,
        style,
      });
    }
  }

  return { buttons, socials };
}

function studioTitle(block: LayoutBlock): string {
  if (block.type === "project") return (block.title || "Proyecto").trim() || "Proyecto";
  if (block.type === "building") return (block.project || "Building").trim() || "Building";
  if (block.type === "social") return "Redes";
  if (block.type === "github") return "GitHub";
  if (block.type === "writing") return "Notas";
  if (block.type === "cv") return (block.title || "CV").trim() || "CV";
  if (block.type === "certification") return (block.name || block.title || "Certificación").trim();
  if (block.type === "achievement") return (block.title || "Logro").trim();
  if (block.type === "media") return (block.title || "Media").trim();
  return (block.title || block.label || "Link").trim() || "Link";
}

function studioSubtitle(block: LayoutBlock): string {
  if (block.type === "social") return "";
  if (block.type === "github") return (block.username || "").replace(/^@/, "");
  const href = safeHttpUrl(block.link || block.fileUrl || block.url || "");
  if (href) {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }
  return (block.description || "").trim();
}

export function studioLinkRows(blocks: LayoutBlock[]): StudioLinkRow[] {
  return sorted(blocks)
    .filter((block) => STUDIO_BLOCK_TYPES.has(block.type))
    .map((block) => ({
      blockId: block.id,
      type: block.type,
      title: studioTitle(block),
      subtitle: studioSubtitle(block),
      hidden: block.visible === false,
      boxStyle: parseBoxStyleOverride(block.boxStyle),
      kind: block.type === "social" || block.type === "github" ? "social" : "button",
    }));
}

/** Reordena solo los links y deja el resto de los bloques en su lugar. */
export function applyLinkOrder<T extends { id: string; order: number }>(
  blocks: T[],
  orderedLinkIds: string[],
): T[] {
  const list = [...blocks].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const byId = new Map(list.map((block) => [block.id, block]));
  const queue: T[] = [];
  for (const id of orderedLinkIds) {
    const block = byId.get(id);
    if (block) queue.push(block);
  }
  const moving = new Set(queue.map((block) => block.id));
  let index = 0;
  return list
    .map((block) => (moving.has(block.id) ? queue[index++] : block))
    .map((block, order) => ({ ...block, order }));
}
