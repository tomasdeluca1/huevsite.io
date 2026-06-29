import { ImageResponse } from 'next/og';
import { profileService } from '@/lib/profile-service';
import { ogAvatarUrl } from '@/lib/og-avatar';
import { getContrastColor } from '@/lib/profile-types';
import {
  ACCENT,
  BORDER,
  TEXT_DIM,
  TEXT_MUTED,
  TEXT_FAINT,
  OG_SIZE,
  truncate,
  rootStyle,
  Texture,
  InnerBorder,
  Wordmark,
  Eyebrow,
  BrandFallback,
} from '@/lib/og/shared';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BADGE_OG_VISUALS: Record<string, { bg: string }> = {
  profile_complete:     { bg: "linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)" },
  profile_validated:    { bg: "linear-gradient(135deg, #22d3ee, #3b82f6, #6366f1)" },
  good_reputation:      { bg: "linear-gradient(135deg, #a855f7, #7c3aed, #6366f1)" },
  active_this_week:     { bg: "linear-gradient(135deg, #10b981, #34d399, #6ee7b7)" },
  top_matchmaker:       { bg: "linear-gradient(135deg, #0ea5e9, #38bdf8, #7dd3fc)" },
  builder_of_the_week:  { bg: "linear-gradient(135deg, #f59e0b, #fbbf24, #fde68a)" },
  premium:              { bg: "linear-gradient(135deg, #84cc16, #C8FF00, #bef264)" },
  ambassador:           { bg: "linear-gradient(135deg, #ec4899, #a855f7, #d946ef)" },
  twitter_connected:    { bg: "linear-gradient(135deg, #1d9bf0, #0ea5e9, #38bdf8)" },
};

// A valid branded PNG for every failure path (missing profile, DB error, bad
// data). This route doubles as an avatar fallback elsewhere, so it must never
// return a 500/404 that would render as a broken <img>.
function fallback() {
  return new ImageResponse(<BrandFallback />, { ...OG_SIZE });
}

export async function GET(
  _request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const profile = await profileService.getProfile(username);
    if (!profile) return fallback();

    const accent = profile.accentColor || ACCENT;
    const onAccent = getContrastColor(accent);
    const displayName = truncate(profile.displayName || username, 22);
    const heroBlock = profile.blocks.find((block) => block.type === 'hero');
    const tagline = truncate(
      (heroBlock as any)?.tagline || profile.tagline || 'Builder en huevsite.io',
      96
    );
    const roles: string[] = ((profile as any)?.roles?.slice(0, 3) || []).map((r: string) =>
      truncate(r, 20)
    );
    const score = profile.builderScore || 0;
    const isWinner = profile.isWinner || false;
    // Proxy + re-encode to JPEG; Satori can't decode the webp avatars huevsite stores.
    const avatarSrc = ogAvatarUrl(profile.avatarUrl, 240);
    const earnedBadges = (profile.badges || []).slice(0, 5);

    return new ImageResponse(
      (
        <div style={rootStyle(accent)}>
          <Texture />
          <InnerBorder />

          {/* Top bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Wordmark accent={accent} />
            {isWinner ? (
              <Eyebrow label="Builder de la Semana" accent={accent} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${BORDER}`,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: TEXT_FAINT, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex' }}>
                  Builder score
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: accent, display: 'flex' }}>{score}</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              gap: 56,
              position: 'relative',
              zIndex: 1,
              marginTop: 8,
            }}
          >
            <div style={{ display: 'flex', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: -24,
                  left: -24,
                  right: -24,
                  bottom: -24,
                  background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
                  borderRadius: '50%',
                  display: 'flex',
                }}
              />
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  width={240}
                  height={240}
                  style={{
                    width: 240,
                    height: 240,
                    borderRadius: 56,
                    border: `4px solid ${accent}`,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 240,
                    height: 240,
                    borderRadius: 56,
                    background: `linear-gradient(135deg, ${accent} 0%, ${accent}aa 100%)`,
                    border: `4px solid ${accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: onAccent,
                    fontSize: 104,
                    fontWeight: 900,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  bottom: -18,
                  right: -18,
                  background: '#0a0a0f',
                  border: `2px solid ${accent}`,
                  borderRadius: 22,
                  padding: '10px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 900, color: TEXT_FAINT, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex' }}>Score</span>
                <span style={{ fontSize: 30, fontWeight: 900, color: 'white', display: 'flex' }}>{score}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: 18 }}>
              <div
                style={{
                  fontSize: 78,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.045em',
                  color: 'white',
                  display: 'flex',
                  flexWrap: 'wrap',
                }}
              >
                {displayName}
              </div>

              <div
                style={{
                  fontSize: 27,
                  color: TEXT_DIM,
                  lineHeight: 1.32,
                  maxWidth: 600,
                  display: 'flex',
                  flexWrap: 'wrap',
                  fontWeight: 500,
                }}
              >
                {tagline}
              </div>

              {earnedBadges.length > 0 && (
                <div style={{ display: 'flex', gap: 10 }}>
                  {earnedBadges.map((badge) => {
                    const v = BADGE_OG_VISUALS[badge.key];
                    return (
                      <div
                        key={badge.key}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: v?.bg || '#555',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          border: '1.5px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        {badge.icon}
                      </div>
                    );
                  })}
                </div>
              )}

              {roles.length > 0 && (
                <div style={{ display: 'flex', gap: 10 }}>
                  {roles.map((role) => (
                    <div
                      key={role}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 12,
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'white',
                        display: 'flex',
                      }}
                    >
                      {role}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 22,
              borderTop: `1px solid ${BORDER}`,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 17,
                fontWeight: 800,
                color: TEXT_MUTED,
              }}
            >
              huevsite.io/<span style={{ color: 'white', display: 'flex' }}>{username}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: accent,
                color: onAccent,
                padding: '13px 26px',
                borderRadius: 14,
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: '-0.01em',
              }}
            >
              Ver perfil →
            </div>
          </div>
        </div>
      ),
      { ...OG_SIZE }
    );
  } catch {
    return fallback();
  }
}
