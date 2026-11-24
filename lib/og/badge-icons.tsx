import { ProfileBadge } from "@/lib/profile-types";

/* Badge glyphs for next/og (Satori). Satori's bundled font has no glyphs for
 * the unicode icons in BADGE_CATALOG (✦ ⚡ 𝕏 ◆ ◈ ✶ ▣ ◭ △), so every badge
 * renders as an empty "tofu" square on the OG image. Inline <svg> paths render
 * the same everywhere regardless of font coverage. Every BADGE_CATALOG key
 * must have an entry here — add one when adding a badge.
 */

type IconProps = { size?: number; color?: string };

function Svg({ size = 20, children }: { size?: number; children: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {children}
    </svg>
  );
}

const ICONS: Record<ProfileBadge["key"], (props: IconProps) => any> = {
  profile_complete: ({ size, color = "#fff" }) => (
    <Svg size={size}>
      <path
        d="M12 2 L14.3 9.3 L22 9.3 L15.8 13.8 L18.1 21 L12 16.6 L5.9 21 L8.2 13.8 L2 9.3 L9.7 9.3 Z"
        fill={color}
      />
    </Svg>
  ),
  active_this_week: ({ size, color = "#fff" }) => (
    <Svg size={size}>
      <path d="M13 2 L4 14 L11 14 L10 22 L20 10 L13 10 Z" fill={color} />
    </Svg>
  ),
  twitter_connected: ({ size, color = "#fff" }) => (
    <Svg size={size}>
      <path
        d="M4 3 L10.2 11.1 L4.4 18 L7 18 L11.6 12.7 L15.8 18 L20 18 L13.5 9.5 L19 3 L16.4 3 L12.1 8 L8.2 3 Z"
        fill={color}
      />
    </Svg>
  ),
  builder_of_the_week: ({ size, color = "#fff" }) => (
    <Svg size={size}>
      <path d="M12 2 L22 9 L12 22 L2 9 Z" fill={color} />
    </Svg>
  ),
  premium: ({ size, color = "#fff" }) => (
    <Svg size={size}>
      <path d="M12 2 L20 9 L12 22 L4 9 Z" fill={color} opacity={0.9} />
      <path d="M12 2 L20 9 L4 9 Z" fill={color} />
    </Svg>
  ),
  ambassador: ({ size, color = "#fff" }) => (
    <Svg size={size}>
      <path
        d="M12 1 L14 8.5 L21.5 6.5 L16.5 12 L21.5 17.5 L14 15.5 L12 23 L10 15.5 L2.5 17.5 L7.5 12 L2.5 6.5 L10 8.5 Z"
        fill={color}
      />
    </Svg>
  ),
  multi_block: ({ size, color = "#fff" }) => (
    <Svg size={size}>
      <rect x="3" y="3" width="7" height="7" fill={color} />
      <rect x="14" y="3" width="7" height="7" fill={color} opacity={0.55} />
      <rect x="3" y="14" width="7" height="7" fill={color} opacity={0.55} />
      <rect x="14" y="14" width="7" height="7" fill={color} />
    </Svg>
  ),
  github_linked: ({ size, color = "#fff" }) => (
    <Svg size={size}>
      <path
        d="M12 2 C6.5 2 2 6.5 2 12 C2 16.4 4.9 20.2 8.8 21.5 C8.8 21.2 8.8 20.4 8.8 19.3 C6.1 19.9 5.5 18 5.5 18 C5.1 16.9 4.5 16.6 4.5 16.6 C3.6 16 4.6 16 4.6 16 C5.6 16.1 6.2 17 6.2 17 C7.1 18.5 8.5 18.1 9 17.8 C9.1 17.1 9.4 16.6 9.7 16.3 C7.4 16.1 5 15.2 5 11.4 C5 10.3 5.4 9.4 6.2 8.7 C6.1 8.4 5.7 7.3 6.3 5.9 C6.3 5.9 7.2 5.6 8.8 6.7 C9.8 6.4 10.9 6.3 12 6.3 C13.1 6.3 14.2 6.4 15.2 6.7 C16.8 5.6 17.7 5.9 17.7 5.9 C18.3 7.3 17.9 8.4 17.8 8.7 C18.6 9.4 19 10.3 19 11.4 C19 15.2 16.6 16.1 14.3 16.3 C14.7 16.7 15 17.4 15 18.5 C15 20 15 21.1 15 21.5 C18.9 20.2 21.8 16.4 21.8 12 C21.8 6.5 17.3 2 12 2 Z"
        fill={color}
      />
    </Svg>
  ),
  rising_builder: ({ size, color = "#fff" }) => (
    <Svg size={size}>
      <path d="M3 18 L9 10 L14 14 L21 5" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 5 L21 5 L21 11" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
};

const FALLBACK_ICON = ({ size, color = "#fff" }: IconProps) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="6" fill={color} />
  </Svg>
);

export function BadgeIcon({ badgeKey, size = 20, color = "#fff" }: { badgeKey: string; size?: number; color?: string }) {
  const render = ICONS[badgeKey as ProfileBadge["key"]] || FALLBACK_ICON;
  return render({ size, color });
}
