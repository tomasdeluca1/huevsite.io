import { ImageResponse } from 'next/og';
import { profileService } from '@/lib/profile-service';
import { ogAvatarUrl } from '@/lib/og-avatar';
import { getContrastColor } from '@/lib/profile-types';
import {
  ACCENT,
  BORDER,
  TEXT_DIM,
  TEXT_MUTED,
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

function fallback() {
  return new ImageResponse(<BrandFallback label="Un proyecto, hecho en huevsite.io" />, { ...OG_SIZE });
}

export async function GET(
  _request: Request,
  { params }: { params: { username: string; slug: string } }
) {
  try {
    const { username, slug } = params;
    const profile = await profileService.getSubSiteProfile(username, slug);
    if (!profile) return fallback();

    const accent = profile.accentColor || ACCENT;
    const onAccent = getContrastColor(accent);
    const title = truncate(profile.displayName || slug, 40);
    const tagline = truncate(profile.tagline || 'Proyecto hecho en huevsite.io', 90);
    const creator = profile.parentProfile;
    // Proxy + re-encode to JPEG; Satori can't decode the webp avatars huevsite stores.
    const creatorAvatarSrc = ogAvatarUrl(creator?.avatarUrl, 32);
    const projectAvatarSrc = ogAvatarUrl(profile.avatarUrl, 320);

    return new ImageResponse(
      (
        <div style={rootStyle(accent)}>
          <Texture />
          <InnerBorder />

          {/* Top bar: wordmark + creator chip */}
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
            {creator && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255,255,255,0.05)',
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: `1px solid ${BORDER}`,
                }}
              >
                {creatorAvatarSrc && (
                  <img
                    src={creatorAvatarSrc}
                    width={28}
                    height={28}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${accent}` }}
                  />
                )}
                <span style={{ fontSize: 15, fontWeight: 600, color: TEXT_MUTED, display: 'flex' }}>por</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'white', display: 'flex' }}>@{creator.username}</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              gap: 52,
              position: 'relative',
              zIndex: 1,
              marginTop: 8,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1.2, justifyContent: 'center' }}>
              <div style={{ display: 'flex', marginBottom: 22 }}>
                <Eyebrow label="Proyecto" accent={accent} />
              </div>

              <div
                style={{
                  fontSize: 76,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.05em',
                  color: 'white',
                  display: 'flex',
                  flexWrap: 'wrap',
                  marginBottom: 20,
                }}
              >
                {title}
              </div>

              <div
                style={{
                  fontSize: 28,
                  color: TEXT_DIM,
                  lineHeight: 1.32,
                  fontWeight: 500,
                  maxWidth: 580,
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  flexWrap: 'wrap',
                }}
              >
                {tagline}
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  width: '120%',
                  height: '100%',
                  background: `radial-gradient(circle, ${accent}2e 0%, transparent 70%)`,
                  borderRadius: '50%',
                  display: 'flex',
                }}
              />
              {projectAvatarSrc ? (
                <img
                  src={projectAvatarSrc}
                  width={300}
                  height={300}
                  style={{
                    width: 300,
                    height: 300,
                    borderRadius: 72,
                    objectFit: 'cover',
                    border: `4px solid ${accent}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 300,
                    height: 300,
                    borderRadius: 72,
                    background: `linear-gradient(135deg, ${accent} 0%, ${accent}aa 100%)`,
                    border: `4px solid ${accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: onAccent,
                    fontSize: 150,
                    fontWeight: 900,
                  }}
                >
                  {title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingTop: 22,
              borderTop: `1px solid ${BORDER}`,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 17, fontWeight: 800, color: TEXT_MUTED }}>
              huevsite.io/{username}/<span style={{ color: 'white', display: 'flex' }}>{slug}</span>
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
