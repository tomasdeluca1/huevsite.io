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
