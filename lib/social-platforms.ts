export const SOCIAL_PLATFORMS = {
  twitter: {
    label: "Twitter / X",
    placeholder: "@usuario",
    buildUrl: (h: string) => `https://x.com/${h.replace("@", "")}`,
    icon: "𝕏",
  },
  github: {
    label: "GitHub",
    placeholder: "usuario",
    buildUrl: (h: string) => `https://github.com/${h}`,
    icon: "⬡",
  },
  linkedin: {
    label: "LinkedIn",
    placeholder: "in/usuario",
    buildUrl: (h: string) => `https://linkedin.com/in/${h.replace(/^in\//, "")}`,
    icon: "in",
  },
  discord: {
    label: "Discord",
    placeholder: "usuario",
    buildUrl: (h: string) => `https://discord.com/users/${h}`,
    icon: "💬",
  },
  farcaster: {
    label: "Farcaster",
    placeholder: "@usuario",
    buildUrl: (h: string) => `https://warpcast.com/${h.replace("@", "")}`,
    icon: "f",
  },
  telegram: {
    label: "Telegram",
    placeholder: "@usuario",
    buildUrl: (h: string) => `https://t.me/${h.replace("@", "")}`,
    icon: "✈",
  },
  youtube: {
    label: "YouTube",
    placeholder: "@canal",
    buildUrl: (h: string) => `https://youtube.com/@${h.replace("@", "")}`,
    icon: "▶",
  },
  twitch: {
    label: "Twitch",
    placeholder: "usuario",
    buildUrl: (h: string) => `https://twitch.tv/${h}`,
    icon: "🎮",
  },
  website: {
    label: "Web propia",
    placeholder: "https://...",
    buildUrl: (h: string) => h,
    icon: "🔗",
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
