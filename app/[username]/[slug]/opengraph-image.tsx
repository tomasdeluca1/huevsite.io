import { ImageResponse } from 'next/og';
import { profileService } from '@/lib/profile-service';

export const runtime = 'edge';

export const alt = 'huevsite.io builder profile sub-site';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const profile = await profileService.getSubSiteProfile(username, slug);

  const displayName = profile?.displayName || username;
  const tagline =
    (profile?.blocks?.find((b: any) => b.type === 'hero') as any)?.tagline ||
    profile?.tagline ||
    'Sub-site en huevsite.io';
  const accentColor = profile?.accentColor || '#C8FF00';
  const avatarUrl = (profile?.blocks?.find((b: any) => b.type === 'hero') as any)?.avatarUrl || profile?.avatarUrl;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const bgUrl = `${baseUrl}/og-background.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050505',
          fontFamily: 'sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Background Image Layer */}
        <img
          src={bgUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {/* Brand watermark — top left */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 48,
            color: accentColor,
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            display: 'flex',
          }}
        >
          huevsite.io
        </div>

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          {/* Avatar (with glow behind it if we want, or just the image) */}
          <div style={{ display: 'flex', marginBottom: 28, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -30, left: -30, right: -30, bottom: -30, background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)` }} />

            {avatarUrl ? (
              <img
                src={avatarUrl}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                }}
              />
            ) : (
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  background: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'black',
                  fontSize: 56,
                  fontWeight: 900,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Display name */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              fontFamily: 'serif',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'white',
              marginBottom: 16,
              maxWidth: 1000,
              display: 'flex',
              textAlign: 'center',
            }}
          >
            {displayName}
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 400,
              marginBottom: 48,
              maxWidth: 800,
              lineHeight: 1.4,
              textAlign: 'center',
              display: 'flex',
            }}
          >
            {tagline}
          </div>

          {/* URL pill */}
          <div
            style={{
              display: 'flex',
              border: `1px solid ${accentColor}80`,
              background: `${accentColor}1A`,
              borderRadius: 100,
              padding: '12px 32px',
              color: accentColor,
              fontSize: 24,
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
          >
            huevsite.io/{username}/{slug}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
