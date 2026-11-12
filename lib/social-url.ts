// Un solo normalizador para los links de redes del perfil.
// Acepta usuario, @usuario o cualquier variante de URL (http/https, www, m.,
// barra final, query, prefijo duplicado) y devuelve la URL canónica, o un
// error en español rioplatense. El cliente, las APIs, el MCP, el render y el
// script de backfill usan estas mismas funciones: nunca se confía en el input.

export const SOCIAL_PLATFORM_IDS = [
  "twitter",
  "linkedin",
  "github",
  "youtube",
  "instagram",
  "tiktok",
  "threads",
  "bluesky",
  "website",
  "email",
  "discord",
  "telegram",
  "twitch",
  "farcaster",
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORM_IDS)[number];

export type SocialUrlCode =
  | "empty"
  | "invalid"
  | "not_profile"
  | "wrong_network"
  | "bad_website"
  | "bad_email"
  | "short_link"
  | "repo"
  | "video"
  | "post"
  | "unsupported";

export interface CanonicalSocialLink {
  platform: SocialPlatformId;
  url: string;
  handle: string;
  label?: string;
  favicon?: string;
}

export type NormalizeSuccess = {
  ok: true;
  platform: SocialPlatformId;
  url: string;
  handle: string;
};

export type NormalizeFailure = {
  ok: false;
  code: SocialUrlCode;
  error: string;
  networkLabel: string;
  otherLabel?: string;
};

export type NormalizeResult = NormalizeSuccess | NormalizeFailure;

const PLATFORM_ALIASES: Record<string, SocialPlatformId> = {
  twitter: "twitter",
  x: "twitter",
  linkedin: "linkedin",
  li: "linkedin",
  github: "github",
  gh: "github",
  youtube: "youtube",
  yt: "youtube",
  instagram: "instagram",
  ig: "instagram",
  tiktok: "tiktok",
  threads: "threads",
  bluesky: "bluesky",
  bsky: "bluesky",
  website: "website",
  web: "website",
  site: "website",
  link: "website",
  email: "email",
  mail: "email",
  correo: "email",
  discord: "discord",
  telegram: "telegram",
  tg: "telegram",
  twitch: "twitch",
  farcaster: "farcaster",
  warpcast: "farcaster",
};

const NETWORK_LABEL: Record<SocialPlatformId, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
  github: "GitHub",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  threads: "Threads",
  bluesky: "Bluesky",
  website: "la web",
  email: "el mail",
  discord: "Discord",
  telegram: "Telegram",
  twitch: "Twitch",
  farcaster: "Farcaster",
};

const KNOWN_HOSTS = [
  "linkedin.com",
  "github.com",
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "instagram.com",
  "tiktok.com",
  "threads.net",
  "threads.com",
  "bsky.app",
  "discord.gg",
  "discord.com",
  "telegram.me",
  "telegram.org",
  "twitch.tv",
  "warpcast.com",
  "farcaster.xyz",
  "x.com",
  "t.me",
].sort((a, b) => b.length - a.length);

const GITHUB_RESERVED = new Set([
  "about",
  "account",
  "apps",
  "collections",
  "codespaces",
  "copilot",
  "customer-stories",
  "enterprise",
  "events",
  "explore",
  "features",
  "git-guides",
  "issues",
  "join",
  "login",
  "marketplace",
  "new",
  "notifications",
  "org",
  "organizations",
  "pricing",
  "pulls",
  "readme",
  "search",
  "security",
  "settings",
  "signup",
  "site",
  "sponsors",
  "team",
  "topics",
  "trending",
  "users",
]);

const TWITTER_RESERVED = new Set([
  "compose",
  "explore",
  "hashtag",
  "home",
  "i",
  "intent",
  "login",
  "messages",
  "notifications",
  "privacy",
  "search",
  "settings",
  "share",
  "signup",
  "tos",
]);

const YOUTUBE_RESERVED = new Set([
  "account",
  "attribution_link",
  "channel",
  "clip",
  "embed",
  "feed",
  "gaming",
  "hashtag",
  "iframe_api",
  "live",
  "playlist",
  "post",
  "premium",
  "redirect",
  "results",
  "shorts",
  "t",
  "watch",
]);

const INSTAGRAM_RESERVED = new Set([
  "about",
  "accounts",
  "direct",
  "explore",
  "legal",
  "p",
  "reel",
  "reels",
  "stories",
]);

export function canonicalPlatformId(platform: unknown): SocialPlatformId | null {
  if (typeof platform !== "string") return null;
  return PLATFORM_ALIASES[platform.trim().toLowerCase()] ?? null;
}

export function networkLabel(platform: SocialPlatformId): string {
  return NETWORK_LABEL[platform];
}

function fail(
  code: SocialUrlCode,
  platform: SocialPlatformId,
  other?: SocialPlatformId,
): NormalizeFailure {
  const network = NETWORK_LABEL[platform];
  const otherLabel = other ? NETWORK_LABEL[other] : undefined;
  return { ok: false, code, error: socialUrlMessage(code, platform, other), networkLabel: network, otherLabel };
}

export function socialUrlMessage(
  code: SocialUrlCode,
  platform: SocialPlatformId,
  other?: SocialPlatformId,
): string {
  const network = NETWORK_LABEL[platform];
  const otherLabel = other ? NETWORK_LABEL[other] : "otra red";
  switch (code) {
    case "empty":
      return "";
    case "wrong_network":
      return `Ese link es de ${otherLabel}, no de ${network}.`;
    case "bad_website":
      return "Ese sitio no es un link válido. Tiene que ser algo como https://tusitio.com.";
    case "bad_email":
      return "Ese mail no es válido. Tiene que ser algo como tu@mail.com.";
    case "short_link":
      return "Ese link corto no es un perfil. Pegá el link completo, por ejemplo tiktok.com/@usuario.";
    case "repo":
      return "Eso es un repo. Pegá solo tu usuario de GitHub.";
    case "video":
      return "Eso es un video. Pegá el canal: @usuario, /channel/, /c/ o /user/.";
    case "post":
      return "Eso es una publicación, no tu perfil.";
    case "not_profile":
      return `Eso no es un perfil de ${network}. Pegá el usuario o el link del perfil.`;
    case "unsupported":
      return "Esa red no está soportada. Usá X, LinkedIn, GitHub, YouTube, Instagram, TikTok, Threads, Bluesky, un sitio o un mail.";
    case "invalid":
      if (platform === "linkedin") {
        return "El link de LinkedIn tiene que ser /in/usuario o /company/empresa.";
      }
      if (platform === "twitter") {
        return "El usuario de X tiene que tener hasta 15 letras, números o _.";
      }
      if (platform === "bluesky") {
        return "El usuario de Bluesky es un dominio, por ejemplo ana.bsky.social.";
      }
      if (platform === "github") {
        return "Ese usuario de GitHub no es válido.";
      }
      if (platform === "youtube") {
        return "Pegá el canal de YouTube: @usuario, /channel/, /c/ o /user/.";
      }
      return `No pude leer ese link de ${network}. Pegá el usuario o el link completo.`;
    default:
      return `No pude leer ese link de ${network}.`;
  }
}

function cleanRaw(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f\u200b\u200c\u200d\ufeff]/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
}

function tightenUrl(value: string): string {
  if (/https?:\/\//i.test(value) || /^(?:www\.|m\.|mobile\.)/i.test(value)) {
    return value.replace(/\s+/g, "");
  }
  return value;
}

function hostIndexes(value: string): number[] {
  const lower = value.toLowerCase();
  const indexes: number[] = [];
  for (let i = 0; i < lower.length; i++) {
    for (const host of KNOWN_HOSTS) {
      if (!lower.startsWith(host, i)) continue;
      const before = i === 0 ? "" : lower[i - 1];
      const after = lower[i + host.length] || "";
      const boundaryBefore = i === 0 || /[^a-z0-9-]/i.test(before);
      const boundaryAfter = !after || /[/?:#]/.test(after);
      if (boundaryBefore && boundaryAfter) indexes.push(i);
      break;
    }
  }
  return indexes;
}

function withWww(value: string, index: number): string {
  for (const pre of ["mobile.", "www.", "m."]) {
    if (value.slice(Math.max(0, index - pre.length), index).toLowerCase() === pre) {
      return `https://${value.slice(index - pre.length)}`;
    }
  }
  const sliced = value.slice(index);
  return /^https?:\/\//i.test(sliced) ? sliced : `https://${sliced}`;
}

/** Saca el prefijo duplicado: linkedin.com/in/https://www.linkedin.com/in/x */
export function peelSocialInput(raw: string): string {
  let value = tightenUrl(cleanRaw(raw));
  if (!value) return "";
  const lower = value.toLowerCase();
  const schemeAt = Math.max(lower.lastIndexOf("https://"), lower.lastIndexOf("http://"));
  if (schemeAt > 0) value = value.slice(schemeAt);
  const hosts = hostIndexes(value);
  if (hosts.length > 1) {
    value = withWww(value, hosts[hosts.length - 1]);
  }
  return value;
}

function tryUrl(value: string): URL | null {
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function hostnameOf(url: URL): string {
  return url.hostname.toLowerCase().replace(/\.$/, "");
}

function hostIs(url: URL, root: string): boolean {
  const host = hostnameOf(url);
  return host === root || host.endsWith(`.${root}`);
}

function networkOfUrl(url: URL): SocialPlatformId | null {
  if (url.protocol === "mailto:") return "email";
  if (hostIs(url, "linkedin.com")) return "linkedin";
  if (hostIs(url, "github.com")) return "github";
  if (hostIs(url, "youtube.com") || hostIs(url, "youtu.be")) return "youtube";
  if (hostIs(url, "x.com") || hostIs(url, "twitter.com")) return "twitter";
  if (hostIs(url, "instagram.com")) return "instagram";
  if (hostIs(url, "tiktok.com")) return "tiktok";
  if (hostIs(url, "threads.net") || hostIs(url, "threads.com")) return "threads";
  if (hostIs(url, "bsky.app")) return "bluesky";
  if (hostIs(url, "discord.com") || hostIs(url, "discord.gg")) return "discord";
  if (hostIs(url, "t.me") || hostIs(url, "telegram.me") || hostIs(url, "telegram.org")) return "telegram";
  if (hostIs(url, "twitch.tv")) return "twitch";
  if (hostIs(url, "warpcast.com") || hostIs(url, "farcaster.xyz")) return "farcaster";
  return null;
}

function segments(url: URL): string[] {
  return url.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(value);
}

function success(platform: SocialPlatformId, url: string, handle: string): NormalizeSuccess {
  return { ok: true, platform, url, handle };
}

function rejectForeign(platform: SocialPlatformId, url: URL): NormalizeFailure | null {
  const detected = networkOfUrl(url);
  if (detected && detected !== platform) return fail("wrong_network", platform, detected);
  return null;
}

function slugOk(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

const LINKEDIN_SLUG = /^[A-Za-z0-9\u00C0-\u024F][A-Za-z0-9\u00C0-\u024F_-]{0,99}$/;
const SIMPLE_NAME = /^[A-Za-z0-9\u00C0-\u024F._-]{1,64}$/;

function parseLinkedIn(value: string): NormalizeResult {
  const loose = value.replace(/^@/, "");
  const kindFromText = /^(in|company|school)\/(.+)$/i.exec(loose);
  if (!looksLikeUrl(loose)) {
    if (kindFromText) {
      const kind = kindFromText[1].toLowerCase();
      const slug = kindFromText[2].replace(/\/+$/, "").split("/")[0];
      if (!slugOk(slug, LINKEDIN_SLUG)) return fail("invalid", "linkedin");
      return linkedInResult(kind, slug);
    }
    const slug = loose.split("/")[0];
    if (!slugOk(slug, LINKEDIN_SLUG)) return fail("invalid", "linkedin");
    return linkedInResult("in", slug);
  }
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "linkedin");
  const foreign = rejectForeign("linkedin", url);
  if (foreign) return foreign;
  if (!hostIs(url, "linkedin.com")) return fail("invalid", "linkedin");
  const segs = segments(url);
  const lowered = segs.map((part) => part.toLowerCase());
  let kind = "";
  let slug = "";
  const marker = lowered.findIndex((part) => part === "in" || part === "company" || part === "school" || part === "pub");
  if (marker >= 0) {
    kind = lowered[marker] === "pub" ? "in" : lowered[marker];
    slug = segs[marker + 1] || "";
    if ((slug.toLowerCase() === "company" || slug.toLowerCase() === "in" || slug.toLowerCase() === "school") && segs[marker + 2]) {
      kind = slug.toLowerCase() === "in" ? "in" : slug.toLowerCase();
      slug = segs[marker + 2];
    }
  }
  if (!kind || !slugOk(slug, LINKEDIN_SLUG)) return fail("invalid", "linkedin");
  return linkedInResult(kind, slug);
}

function linkedInResult(kind: string, slug: string): NormalizeSuccess {
  const safeKind = kind === "company" || kind === "school" ? kind : "in";
  const handle = safeKind === "in" ? slug : `${safeKind}/${slug}`;
  return success("linkedin", `https://www.linkedin.com/${safeKind}/${slug}`, handle);
}

function parseGithub(value: string): NormalizeResult {
  const loose = value.replace(/^@/, "");
  if (!looksLikeUrl(loose)) return githubUser(loose);
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "github");
  const foreign = rejectForeign("github", url);
  if (foreign) return foreign;
  if (!hostIs(url, "github.com")) return fail("invalid", "github");
  const segs = segments(url);
  if (segs.length === 0) return fail("invalid", "github");
  if (segs.length > 1) return fail("repo", "github");
  return githubUser(segs[0]);
}

function githubUser(value: string): NormalizeResult {
  const user = value.trim();
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(user)) return fail("invalid", "github");
  if (GITHUB_RESERVED.has(user.toLowerCase())) return fail("not_profile", "github");
  return success("github", `https://github.com/${user}`, user);
}

export function canonicalGithubUsername(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const result = normalizeSocialInput("github", value);
  return result.ok ? result.handle : null;
}

function parseTwitter(value: string): NormalizeResult {
  const loose = value.trim();
  if (!looksLikeUrl(loose)) return twitterHandle(loose.replace(/^@/, ""));
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "twitter");
  const foreign = rejectForeign("twitter", url);
  if (foreign) return foreign;
  if (!hostIs(url, "x.com") && !hostIs(url, "twitter.com")) return fail("invalid", "twitter");
  const segs = segments(url);
  const screen = url.searchParams.get("screen_name");
  if (segs[0]?.toLowerCase() === "intent" && screen) return twitterHandle(screen);
  if (segs.length === 0) return fail("invalid", "twitter");
  if (TWITTER_RESERVED.has(segs[0].replace(/^@/, "").toLowerCase())) return fail("not_profile", "twitter");
  if (segs.length > 1) return fail("post", "twitter");
  return twitterHandle(segs[0].replace(/^@/, ""));
}

function twitterHandle(value: string): NormalizeResult {
  if (!/^[A-Za-z0-9_]{1,15}$/.test(value)) return fail("invalid", "twitter");
  if (TWITTER_RESERVED.has(value.toLowerCase())) return fail("not_profile", "twitter");
  return success("twitter", `https://x.com/${value}`, value);
}

function parseYouTube(value: string): NormalizeResult {
  const loose = value.trim();
  if (!looksLikeUrl(loose)) return youtubeLoose(loose);
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "youtube");
  if (hostIs(url, "youtu.be")) return fail("video", "youtube");
  const foreign = rejectForeign("youtube", url);
  if (foreign) return foreign;
  if (!hostIs(url, "youtube.com")) return fail("invalid", "youtube");
  const segs = segments(url);
  if (segs.length === 0) return fail("invalid", "youtube");
  const first = segs[0];
  if (first.startsWith("@")) return youtubeHandle(first.slice(1));
  const head = first.toLowerCase();
  if (head === "watch" || head === "shorts" || head === "playlist" || head === "embed" || head === "live" || head === "clip") {
    return fail("video", "youtube");
  }
  if (head === "channel" && segs[1]) return youtubeChannel(segs[1]);
  if (head === "c" && segs[1]) return youtubeCustom(segs[1]);
  if (head === "user" && segs[1]) return youtubeLegacyUser(segs[1]);
  if (YOUTUBE_RESERVED.has(head)) return fail("not_profile", "youtube");
  if (segs.length > 1) return fail("not_profile", "youtube");
  if (/^UC[0-9A-Za-z_-]{22}$/.test(first)) return youtubeChannel(first);
  return youtubeHandle(first);
}

function youtubeLoose(value: string): NormalizeResult {
  const text = value.replace(/^@/, "");
  const channel = /^(?:channel\/)([^/?#]+)/i.exec(value);
  if (channel) return youtubeChannel(channel[1]);
  const custom = /^(?:c\/)([^/?#]+)/i.exec(value);
  if (custom) return youtubeCustom(custom[1]);
  const user = /^(?:user\/)([^/?#]+)/i.exec(value);
  if (user) return youtubeLegacyUser(user[1]);
  if (/^UC[0-9A-Za-z_-]{22}$/.test(text)) return youtubeChannel(text);
  return youtubeHandle(text);
}

function youtubeHandle(value: string): NormalizeResult {
  if (!/^[A-Za-z0-9\u00C0-\u024F._-]{1,30}$/.test(value)) return fail("invalid", "youtube");
  if (YOUTUBE_RESERVED.has(value.toLowerCase())) return fail("not_profile", "youtube");
  return success("youtube", `https://www.youtube.com/@${value}`, value);
}

function youtubeChannel(value: string): NormalizeResult {
  if (!/^UC[0-9A-Za-z_-]{22}$/.test(value)) return fail("invalid", "youtube");
  return success("youtube", `https://www.youtube.com/channel/${value}`, `channel/${value}`);
}

function youtubeCustom(value: string): NormalizeResult {
  if (!slugOk(value, SIMPLE_NAME)) return fail("invalid", "youtube");
  return success("youtube", `https://www.youtube.com/c/${value}`, `c/${value}`);
}

function youtubeLegacyUser(value: string): NormalizeResult {
  if (!slugOk(value, SIMPLE_NAME)) return fail("invalid", "youtube");
  return success("youtube", `https://www.youtube.com/user/${value}`, `user/${value}`);
}

function parseInstagramLike(platform: "instagram" | "threads", value: string): NormalizeResult {
  const loose = value.trim();
  if (!looksLikeUrl(loose)) return socialName(platform, loose.replace(/^@/, ""));
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", platform);
  const foreign = rejectForeign(platform, url);
  if (foreign) return foreign;
  const okHost =
    platform === "instagram"
      ? hostIs(url, "instagram.com")
      : hostIs(url, "threads.net") || hostIs(url, "threads.com");
  if (!okHost) return fail("invalid", platform);
  const segs = segments(url);
  if (segs.length === 0) return fail("invalid", platform);
  const first = segs[0].replace(/^@/, "");
  if (INSTAGRAM_RESERVED.has(first.toLowerCase())) return fail("post", platform);
  return socialName(platform, first);
}

function socialName(platform: "instagram" | "threads" | "tiktok", value: string): NormalizeResult {
  if (!/^(?!.*\.\.)(?!\.)(?!.*\.$)[A-Za-z0-9._]{1,30}$/.test(value)) return fail("invalid", platform);
  if (platform === "tiktok") {
    return success("tiktok", `https://www.tiktok.com/@${value}`, value);
  }
  if (platform === "threads") {
    return success("threads", `https://www.threads.net/@${value}`, value);
  }
  return success("instagram", `https://www.instagram.com/${value}`, value);
}

function parseTikTok(value: string): NormalizeResult {
  const loose = value.trim();
  if (!looksLikeUrl(loose)) return socialName("tiktok", loose.replace(/^@/, ""));
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "tiktok");
  const host = hostnameOf(url);
  if (host === "vm.tiktok.com" || host === "vt.tiktok.com" || host.endsWith(".vm.tiktok.com")) {
    return fail("short_link", "tiktok");
  }
  const foreign = rejectForeign("tiktok", url);
  if (foreign) return foreign;
  if (!hostIs(url, "tiktok.com")) return fail("invalid", "tiktok");
  const segs = segments(url);
  const at = segs.find((part) => part.startsWith("@"));
  if (!at) return fail("invalid", "tiktok");
  return socialName("tiktok", at.slice(1));
}

function parseBluesky(value: string): NormalizeResult {
  const loose = value.trim().replace(/^@/, "");
  if (loose.startsWith("did:")) return blueskyDid(loose.split(/[?#]/)[0]);
  // ana.bsky.social parece un host, pero es el usuario, no una URL.
  if (!/^https?:\/\//i.test(loose) && !loose.includes("/")) return blueskyHandle(loose);
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "bluesky");
  const foreign = rejectForeign("bluesky", url);
  if (foreign) return foreign;
  if (!hostIs(url, "bsky.app")) return fail("invalid", "bluesky");
  const segs = segments(url);
  if (segs[0]?.toLowerCase() !== "profile" || !segs[1]) return fail("not_profile", "bluesky");
  const ident = segs[1];
  if (ident.startsWith("did:")) return blueskyDid(ident);
  return blueskyHandle(ident);
}

function blueskyHandle(value: string): NormalizeResult {
  const handle = value.toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(handle)) {
    return fail("invalid", "bluesky");
  }
  return success("bluesky", `https://bsky.app/profile/${handle}`, handle);
}

function blueskyDid(value: string): NormalizeResult {
  if (!/^did:plc:[a-z2-7]{24}$/.test(value) && !/^did:web:[a-z0-9.-]+$/i.test(value)) {
    return fail("invalid", "bluesky");
  }
  return success("bluesky", `https://bsky.app/profile/${value}`, value);
}

function parseEmail(value: string): NormalizeResult {
  let text = value.trim();
  if (/^mailto:/i.test(text)) {
    try {
      const url = new URL(text);
      text = url.pathname;
    } catch {
      text = text.replace(/^mailto:/i, "");
    }
  }
  text = text.split("?")[0].trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) || text.length > 254) return fail("bad_email", "email");
  const at = text.lastIndexOf("@");
  const local = text.slice(0, at);
  const domain = text.slice(at + 1).toLowerCase();
  const handle = `${local}@${domain}`;
  return success("email", `mailto:${handle}`, handle);
}

function parseWebsite(value: string): NormalizeResult {
  const text = value.trim();
  if (/^mailto:/i.test(text) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return parseEmail(text);
  if (/^(javascript|vbscript|data|file|blob|filesystem|about):/i.test(text)) return fail("bad_website", "website");
  const url = tryUrl(text);
  if (!url) return fail("bad_website", "website");
  if (url.protocol !== "http:" && url.protocol !== "https:") return fail("bad_website", "website");
  const host = hostnameOf(url);
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
  if (!host || (!host.includes(".") && host !== "localhost") || host.includes(" ")) return fail("bad_website", "website");
  if (ipv4 && host.split(".").some((part) => Number(part) > 255)) return fail("bad_website", "website");
  url.username = "";
  url.password = "";
  url.hash = "";
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  const port = url.port ? `:${url.port}` : "";
  const href = `${url.protocol}//${host}${port}${path}${url.search}`;
  if (href.length > 500) return fail("bad_website", "website");
  return success("website", href, href);
}

function parseDiscord(value: string): NormalizeResult {
  const loose = value.trim();
  if (!looksLikeUrl(loose)) {
    if (!/^[\w.]{2,32}$/.test(loose.replace(/^@/, ""))) return fail("invalid", "discord");
    const user = loose.replace(/^@/, "");
    return success("discord", `https://discord.com/users/${user}`, user);
  }
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "discord");
  const foreign = rejectForeign("discord", url);
  if (foreign) return foreign;
  const segs = segments(url);
  if (hostIs(url, "discord.gg") && segs[0]) {
    return success("discord", `https://discord.gg/${segs[0]}`, segs[0]);
  }
  if (hostIs(url, "discord.com") && (segs[0] === "invite" || segs[0] === "users") && segs[1]) {
    if (segs[0] === "invite") return success("discord", `https://discord.gg/${segs[1]}`, segs[1]);
    return success("discord", `https://discord.com/users/${segs[1]}`, segs[1]);
  }
  return fail("not_profile", "discord");
}

function parseTelegram(value: string): NormalizeResult {
  const loose = value.trim().replace(/^@/, "");
  if (!looksLikeUrl(loose)) {
    if (!/^[A-Za-z0-9_]{5,32}$/.test(loose)) return fail("invalid", "telegram");
    return success("telegram", `https://t.me/${loose}`, loose);
  }
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "telegram");
  const foreign = rejectForeign("telegram", url);
  if (foreign) return foreign;
  if (!hostIs(url, "t.me") && !hostIs(url, "telegram.me") && !hostIs(url, "telegram.org")) {
    return fail("invalid", "telegram");
  }
  const segs = segments(url);
  const name = segs[0] === "s" ? segs[1] : segs[0];
  if (!name || !/^[A-Za-z0-9_]{5,32}$/.test(name)) return fail("invalid", "telegram");
  return success("telegram", `https://t.me/${name}`, name);
}

function parseTwitch(value: string): NormalizeResult {
  const loose = value.trim().replace(/^@/, "");
  if (!looksLikeUrl(loose)) return twitchUser(loose);
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "twitch");
  const foreign = rejectForeign("twitch", url);
  if (foreign) return foreign;
  if (!hostIs(url, "twitch.tv")) return fail("invalid", "twitch");
  const segs = segments(url);
  if (!segs[0] || ["directory", "videos", "settings", "subscriptions"].includes(segs[0].toLowerCase())) {
    return fail("not_profile", "twitch");
  }
  return twitchUser(segs[0]);
}

function twitchUser(value: string): NormalizeResult {
  if (!/^[A-Za-z0-9_]{4,25}$/.test(value)) return fail("invalid", "twitch");
  return success("twitch", `https://www.twitch.tv/${value}`, value);
}

function parseFarcaster(value: string): NormalizeResult {
  const loose = value.trim().replace(/^@/, "");
  if (!looksLikeUrl(loose)) return farcasterUser(loose);
  const url = tryUrl(loose);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return fail("invalid", "farcaster");
  const foreign = rejectForeign("farcaster", url);
  if (foreign) return foreign;
  if (!hostIs(url, "warpcast.com") && !hostIs(url, "farcaster.xyz")) return fail("invalid", "farcaster");
  const segs = segments(url);
  if (!segs[0]) return fail("invalid", "farcaster");
  return farcasterUser(segs[0]);
}

function farcasterUser(value: string): NormalizeResult {
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(value)) return fail("invalid", "farcaster");
  return success("farcaster", `https://warpcast.com/${value}`, value);
}

const PARSERS: Record<SocialPlatformId, (value: string) => NormalizeResult> = {
  twitter: parseTwitter,
  linkedin: parseLinkedIn,
  github: parseGithub,
  youtube: parseYouTube,
  instagram: (value) => parseInstagramLike("instagram", value),
  tiktok: parseTikTok,
  threads: (value) => parseInstagramLike("threads", value),
  bluesky: parseBluesky,
  website: parseWebsite,
  email: parseEmail,
  discord: parseDiscord,
  telegram: parseTelegram,
  twitch: parseTwitch,
  farcaster: parseFarcaster,
};

export function normalizeSocialInput(platform: unknown, raw: unknown): NormalizeResult {
  const id = canonicalPlatformId(platform);
  if (typeof raw !== "string") return fail("empty", id ?? "website");
  const cleaned = cleanRaw(raw);
  if (!cleaned) return fail("empty", id ?? "website");
  const peeled = peelSocialInput(cleaned);
  if (!id) {
    const probe = tryUrl(looksLikeUrl(peeled) ? peeled : peeled);
    const detected = probe ? networkOfUrl(probe) : null;
    if (!detected) return fail("unsupported", "website");
    return PARSERS[detected](peeled || cleaned);
  }
  return PARSERS[id](peeled || cleaned);
}

type StoredLink = {
  platform?: unknown;
  url?: unknown;
  handle?: unknown;
  label?: unknown;
  favicon?: unknown;
};

function draftCandidates(link: StoredLink): string[] {
  const values = [link.handle, link.url].filter((value): value is string => typeof value === "string");
  const nonempty = values.map((value) => value).filter((value) => value.trim());
  return nonempty.length ? nonempty : values.slice(0, 1);
}

function cleanLabel(label: unknown): string | undefined {
  if (typeof label !== "string") return undefined;
  const trimmed = label.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 80);
}

function cleanFavicon(platform: SocialPlatformId, favicon: unknown, url: string): string | undefined {
  if (platform !== "website") return undefined;
  if (typeof favicon === "string" && /^https:\/\//i.test(favicon.trim())) return favicon.trim();
  const parsed = tryUrl(url);
  if (!parsed || parsed.protocol === "mailto:") return undefined;
  return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
}

export function normalizeStoredLink(link: StoredLink):
  | { ok: true; link: CanonicalSocialLink }
  | NormalizeFailure {
  const attempts = draftCandidates(link);
  if (!attempts.length || attempts.every((value) => !value.trim())) {
    const id = canonicalPlatformId(link.platform) ?? "website";
    return fail("empty", id);
  }
  let last: NormalizeFailure = fail("invalid", canonicalPlatformId(link.platform) ?? "website");
  for (const attempt of attempts) {
    const result = normalizeSocialInput(link.platform, attempt);
    if (result.ok) {
      const label = cleanLabel(link.label);
      const favicon = cleanFavicon(result.platform, link.favicon, result.url);
      return {
        ok: true,
        link: {
          platform: result.platform,
          url: result.url,
          handle: result.handle,
          ...(label ? { label } : {}),
          ...(favicon ? { favicon } : {}),
        },
      };
    }
    if (result.code !== "empty") last = result;
  }
  return last;
}

export function linkDraft(link: StoredLink): string {
  if (typeof link.handle === "string" && link.handle !== "") return link.handle;
  return typeof link.url === "string" ? link.url : "";
}

export function socialDraftsBlockSave(links: unknown): boolean {
  if (!Array.isArray(links)) return false;
  return links.some((item) => {
    if (!item || typeof item !== "object") return false;
    const link = item as StoredLink;
    const draft = linkDraft(link);
    if (!draft.trim()) return false;
    return !normalizeSocialInput(link.platform, draft).ok;
  });
}

export function commitSocialLinks(links: unknown):
  | { ok: true; links: CanonicalSocialLink[] }
  | { ok: false; error: string } {
  if (!Array.isArray(links)) return { ok: true, links: [] };
  const next: CanonicalSocialLink[] = [];
  for (const item of links) {
    if (!item || typeof item !== "object") continue;
    const result = normalizeStoredLink(item as StoredLink);
    if (result.ok) {
      next.push(result.link);
      continue;
    }
    if (result.code === "empty") continue;
    return { ok: false, error: result.error };
  }
  return { ok: true, links: next };
}

export function readSocialLinks(links: unknown): CanonicalSocialLink[] {
  if (!Array.isArray(links)) return [];
  const next: CanonicalSocialLink[] = [];
  for (const item of links) {
    if (!item || typeof item !== "object") continue;
    const result = normalizeStoredLink(item as StoredLink);
    if (result.ok) next.push(result.link);
  }
  return next;
}

export interface SocialLinkFix {
  platform: string;
  before: string;
  after: string;
}

export interface SocialLinkProblem {
  platform: string;
  before: string;
  reason: string;
}

export interface SocialLinksPlan {
  changed: boolean;
  links: CanonicalSocialLink[];
  fixed: SocialLinkFix[];
  unfixable: SocialLinkProblem[];
}

function beforeText(link: StoredLink): string {
  const handle = typeof link.handle === "string" ? link.handle : "";
  const url = typeof link.url === "string" ? link.url : "";
  return (url || handle).trim() || handle || url;
}

export function planSocialLinks(links: unknown): SocialLinksPlan {
  if (!Array.isArray(links)) {
    return { changed: false, links: [], fixed: [], unfixable: [] };
  }
  const next: CanonicalSocialLink[] = [];
  const fixed: SocialLinkFix[] = [];
  const unfixable: SocialLinkProblem[] = [];
  let changed = false;
  for (const item of links) {
    if (!item || typeof item !== "object") {
      changed = true;
      continue;
    }
    const link = item as StoredLink;
    const result = normalizeStoredLink(link);
    if (!result.ok) {
      if (result.code === "empty") {
        changed = true;
        continue;
      }
      unfixable.push({
        platform: typeof link.platform === "string" ? link.platform : "",
        before: beforeText(link),
        reason: result.error,
      });
      changed = true;
      continue;
    }
    next.push(result.link);
    const handle = typeof link.handle === "string" ? link.handle : "";
    const url = typeof link.url === "string" ? link.url : "";
    const platform = canonicalPlatformId(link.platform);
    const same =
      url === result.link.url &&
      handle === result.link.handle &&
      platform === result.link.platform;
    if (!same) {
      changed = true;
      fixed.push({
        platform: result.link.platform,
        before: beforeText(link),
        after: result.link.url,
      });
    }
  }
  return { changed, links: next, fixed, unfixable };
}

export function normalizeBlockData(
  type: string,
  data: unknown,
  mode: "strict" | "drop",
): { ok: true; data: unknown } | { ok: false; error: string } {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: true, data };
  const record = { ...(data as Record<string, unknown>) };
  if (type === "social" && Array.isArray(record.links)) {
    if (mode === "strict") {
      const committed = commitSocialLinks(record.links);
      if (!committed.ok) return committed;
      record.links = committed.links;
    } else {
      record.links = readSocialLinks(record.links);
    }
  }
  if (type === "github" && typeof record.username === "string" && record.username.trim()) {
    const username = canonicalGithubUsername(record.username);
    if (!username) {
      if (mode === "strict") {
        const result = normalizeSocialInput("github", record.username);
        return { ok: false, error: result.ok ? "Ese usuario de GitHub no es válido." : result.error };
      }
      record.username = "";
    } else {
      record.username = username;
    }
  }
  return { ok: true, data: record };
}
