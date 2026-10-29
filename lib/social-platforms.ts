export const SOCIAL_PLATFORMS = {
  twitter: {
    label: "Twitter / X",
    short: "X",
    placeholder: "@usuario",
    buildUrl: (h: string) => `https://x.com/${h.replace("@", "")}`,
    icon: "𝕏",
    brandColor: "#ffffff",
  },
  github: {
    label: "GitHub",
    short: "GITHUB",
    placeholder: "usuario",
    buildUrl: (h: string) => `https://github.com/${h}`,
    icon: "⬡",
    brandColor: "#ffffff",
  },
  linkedin: {
    label: "LinkedIn",
    short: "LINKEDIN",
    placeholder: "in/usuario",
    buildUrl: (h: string) => `https://linkedin.com/in/${h.replace(/^in\//, "")}`,
    icon: "in",
    brandColor: "#0A66C2",
  },
  discord: {
    label: "Discord",
    short: "DISCORD",
    placeholder: "usuario",
    buildUrl: (h: string) => `https://discord.com/users/${h}`,
    icon: "💬",
    brandColor: "#5865F2",
  },
  farcaster: {
    label: "Farcaster",
    short: "FARCAST",
    placeholder: "@usuario",
    buildUrl: (h: string) => `https://warpcast.com/${h.replace("@", "")}`,
    icon: "f",
    brandColor: "#855AF2",
  },
  telegram: {
    label: "Telegram",
    short: "TELEGRAM",
    placeholder: "@usuario",
    buildUrl: (h: string) => `https://t.me/${h.replace("@", "")}`,
    icon: "✈",
    brandColor: "#26A5E4",
  },
  youtube: {
    label: "YouTube",
    short: "YOUTUBE",
    placeholder: "@canal",
    buildUrl: (h: string) => `https://youtube.com/@${h.replace("@", "")}`,
    icon: "▶",
    brandColor: "#FF0000",
  },
  twitch: {
    label: "Twitch",
    short: "TWITCH",
    placeholder: "usuario",
    buildUrl: (h: string) => `https://twitch.tv/${h}`,
    icon: "🎮",
    brandColor: "#9146FF",
  },
  website: {
    label: "Web propia",
    short: "WEB",
    placeholder: "https://...",
    buildUrl: (h: string) => h,
    icon: "🔗",
    brandColor: "#ffffff",
  },
  instagram: {
    label: "Instagram",
    short: "INSTA",
    placeholder: "usuario",
    buildUrl: (h: string) => `https://instagram.com/${h.replace("@", "")}`,
    icon: "📸",
    brandColor: "#E4405F",
  },
} as const;

export type SocialPlatformKey = keyof typeof SOCIAL_PLATFORMS;

export function buildSocialUrl(platform: string, handle: string): string {
  const p = SOCIAL_PLATFORMS[platform as SocialPlatformKey];
  if (!p || !handle.trim()) return "";
  return p.buildUrl(handle.trim());
}

export function getUrlPreview(platform: string, handle: string): string {
  const url = buildSocialUrl(platform, handle);
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "") + u.pathname;
  } catch {
    return url;
  }
}

type SocialLinkLike = { platform: string; url?: string; label?: string };

const SQUARE_LABEL_MAX = 8;
const SECOND_LEVEL_TLDS = new Set(["co", "com", "org", "net", "gov", "edu", "ac"]);

function parseUrl(raw: string | undefined): URL | null {
  const value = (raw || "").trim();
  if (!value) return null;
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
}

function bareHostname(u: URL): string {
  return u.hostname.replace(/^www\./i, "");
}

/**
 * Etiqueta del cuadrado de la grilla de celular. Siempre una abreviación fija:
 * el `label` del usuario NO gana acá (el import de Linktree lo llena con el
 * texto del botón). Plataformas desconocidas (y `website` con varios websites sin
 * favicon) usan el hostname sin
 * `www.` ni TLD, en mayúsculas, cortado a 8 caracteres (sin elipsis).
 */
export function resolveSquareLabel(
  link: SocialLinkLike & { favicon?: string },
  ctx?: { severalWebsites?: boolean }
): string {
  const known = SOCIAL_PLATFORMS[link.platform as SocialPlatformKey];
  if (known && link.platform !== "website") return known.short;
  // §6.3: un website es "WEB"; solo si hay varios Y este no tiene favicon
  // (cae al Globe) el hostname lo desambigua.
  if (link.platform === "website" && !(ctx?.severalWebsites && !link.favicon)) return known.short;

  const u = parseUrl(link.url);
  if (u) {
    const parts = bareHostname(u).split(".").filter(Boolean);
    if (parts.length > 1) parts.pop(); // TLD
    if (parts.length > 1 && SECOND_LEVEL_TLDS.has(parts[parts.length - 1])) parts.pop(); // co.uk
    const name = parts[parts.length - 1];
    if (name) return name.toUpperCase().slice(0, SQUARE_LABEL_MAX);
  }
  if (known) return known.short;
  return (link.platform || "WEB").toUpperCase().slice(0, SQUARE_LABEL_MAX);
}

/**
 * URL a abrir al tocar. Solo X tiene una URL pública de intención de seguir;
 * el resto abre el perfil tal cual (https, nunca esquemas app://).
 */
export function resolveFollowUrl(link: SocialLinkLike): string {
  const raw = (link.url || "").trim();
  if (link.platform === "twitter") {
    const u = parseUrl(raw);
    if (u && /^(www\.)?(x|twitter)\.com$/i.test(u.hostname)) {
      const handle = u.pathname.split("/").filter(Boolean)[0]?.replace(/^@/, "");
      const reserved = new Set(["intent", "i", "home", "share", "search", "explore", "hashtag"]);
      if (handle && /^\w{1,15}$/.test(handle) && !reserved.has(handle.toLowerCase())) {
        return `https://x.com/intent/follow?screen_name=${handle}`;
      }
    }
  }
  if (!raw || /^(https?:|mailto:)/i.test(raw)) return raw;
  return `https://${raw}`;
}

const COMPACT_URL_MAX = 16;

/**
 * Forma compacta de la URL para la lista de escritorio: hostname sin `www.` y,
 * si el resultado sigue siendo corto, el último segmento del path. Pensada para
 * entrar sin truncar ("abreviaciones, no recortes").
 */
export function compactUrl(url: string): string {
  const u = parseUrl(url);
  if (!u) return (url || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[?#]/)[0];
  const host = bareHostname(u);
  // mailto: y similares no tienen host: el pathname (la dirección) es lo que hay.
  if (!host) return u.pathname.replace(/^\/+/, "");
  const last = u.pathname.split("/").filter(Boolean).pop();
  if (last) {
    const withPath = `${host}/${last}`;
    if (withPath.length <= COMPACT_URL_MAX) return withPath;
  }
  return host;
}
