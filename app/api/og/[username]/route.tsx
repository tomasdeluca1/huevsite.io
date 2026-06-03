import { ImageResponse } from 'next/og';
import { profileService } from '@/lib/profile-service';
import { ogAvatarUrl } from '@/lib/og-avatar';
import { getContrastColor } from '@/lib/profile-types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const profile = await profileService.getProfile(username);

    if (!profile) return new Response('Profile not found', { status: 404 });
    const displayName = profile.displayName || username;
    const heroBlock = profile.blocks.find((block) => block.type === 'hero');
    const tagline = (heroBlock as any)?.tagline || profile.tagline || 'Builder en huevsite.io';
    const roles = (profile as any)?.roles?.slice(0, 3) || [];
    const accentColor = profile.accentColor || '#C8FF00';
    const score = profile.builderScore || 0;
    const isWinner = profile.isWinner || false;
    // Proxy + re-encode to JPEG; Satori can't decode the webp avatars huevsite stores.
    const avatarSrc = ogAvatarUrl(profile.avatarUrl, 240);
    const earnedBadges = (profile.badges || []).slice(0, 5);

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

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#050505',
            position: 'relative',
            padding: 60,
            overflow: 'hidden',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              right: '-10%',
              width: '60%',
              height: '120%',
              backgroundColor: accentColor,
              opacity: 0.08,
              filter: 'blur(100px)',
              borderRadius: '50%',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: '-20%',
              left: '-10%',
              width: '40%',
              height: '80%',
              backgroundColor: accentColor,
              opacity: 0.05,
              filter: 'blur(80px)',
              borderRadius: '50%',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 60,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.04em' }}>huev</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: accentColor, letterSpacing: '-0.04em' }}>site</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'white', opacity: 0.4, letterSpacing: '-0.04em' }}>.io</span>
            </div>

            {isWinner && (
              <div style={{
                display: 'flex',
                padding: '10px 20px',
                backgroundColor: `${accentColor}1A`,
                border: `1px solid ${accentColor}40`,
                borderRadius: 20,
                color: accentColor,
                fontSize: 18,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Builder de la Semana
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              gap: 60,
            }}
          >
            <div style={{ display: 'flex', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  left: -20,
                  right: -20,
                  bottom: -20,
                  background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`,
                  borderRadius: '50%',
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
                    borderRadius: 60,
                    border: `4px solid ${accentColor}40`,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 240,
                    height: 240,
                    borderRadius: 60,
                    backgroundColor: `${accentColor}1A`,
                    border: `4px solid ${accentColor}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: accentColor,
                    fontSize: 100,
                    fontWeight: 900,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div style={{
                position: 'absolute',
                bottom: -20,
                right: -20,
                backgroundColor: '#0A0A0C',
                border: `2px solid ${accentColor}`,
                borderRadius: 24,
                padding: '12px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>{score}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
              <h1
                style={{
                  fontSize: 84,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  margin: '0 0 20px 0',
                  color: 'white',
                }}
              >
                {displayName}
              </h1>

              <p
                style={{
                  fontSize: 28,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.4,
                  margin: '0 0 24px 0',
                  maxWidth: 600,
                }}
              >
                {tagline}
              </p>

              {earnedBadges.length > 0 && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
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

              <div style={{ display: 'flex', gap: 12 }}>
                {roles.map((role: string) => (
                  <div key={role} style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'white'
                  }}>
                    {role}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 40,
          }}>
            <div style={{
              display: 'flex',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '10px 20px',
              borderRadius: 100,
              fontSize: 18,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'monospace'
            }}>
              huevsite.io/<span style={{ color: 'white' }}>{username}</span>
            </div>

            {/* Call to action */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: accentColor,
              color: getContrastColor(accentColor),
              padding: '14px 30px',
              borderRadius: 100,
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: '-0.01em',
              boxShadow: `0 10px 30px ${accentColor}40`,
            }}>
              Ver perfil →
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
