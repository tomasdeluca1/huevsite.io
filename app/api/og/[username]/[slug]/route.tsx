import { ImageResponse } from 'next/og';
import { profileService } from '@/lib/profile-service';
import { ogAvatarUrl } from '@/lib/og-avatar';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { username: string; slug: string } }
) {
  try {
    const { username, slug } = params;
    const profile = await profileService.getSubSiteProfile(username, slug);

    if (!profile) return new Response('Sub-site not found', { status: 404 });

    const title = profile.displayName;
    const tagline = profile.tagline || 'Proyecto built on huevsite.io';
    const accentColor = profile.accentColor || '#C8FF00';
    const creator = profile.parentProfile;
    // Proxy + re-encode to JPEG; Satori can't decode the webp avatars huevsite stores.
    const creatorAvatarSrc = ogAvatarUrl(creator?.avatarUrl, 32);
    const profileAvatarSrc = ogAvatarUrl(profile.avatarUrl, 320);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#050507',
            color: 'white',
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
              opacity: 0.1,
              filter: 'blur(100px)',
              borderRadius: '50%',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.04em' }}>huev</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: accentColor, letterSpacing: '-0.04em' }}>site</span>
            </div>

            {creator && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)' }}>
                {creatorAvatarSrc && (
                  <img src={creatorAvatarSrc} width={32} height={32} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${accentColor}` }} />
                )}
                <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>por</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>@{creator.username}</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              gap: 60,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1.2, justifyContent: 'center' }}>
              <div style={{
                display: 'flex',
                padding: '6px 14px',
                backgroundColor: `${accentColor}12`,
                color: accentColor,
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: 20,
                border: `1px solid ${accentColor}25`,
                alignSelf: 'flex-start',
              }}>
                PROYECTO DESTACADO
              </div>

              <h1
                style={{
                  fontSize: 84,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.05em',
                  margin: '0 0 20px 0',
                  color: 'white',
                }}
              >
                {title}
              </h1>

              <p
                style={{
                  fontSize: 32,
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.3,
                  margin: 0,
                  fontWeight: 500,
                  maxWidth: 580,
                  letterSpacing: '-0.02em',
                }}
              >
                {tagline}
              </p>
            </div>

            <div style={{ display: 'flex', flex: 1, position: 'relative', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute',
                width: '120%',
                height: '100%',
                background: `radial-gradient(circle, ${accentColor}26 0%, transparent 70%)`,
                borderRadius: '50%',
              }} />

              {profileAvatarSrc ? (
                <img
                  src={profileAvatarSrc}
                  width={320}
                  height={320}
                  style={{
                    width: 320,
                    height: 320,
                    borderRadius: 80,
                    objectFit: 'cover',
                    border: `4.5px solid ${accentColor}40`,
                    boxShadow: `0 40px 80px ${accentColor}20`,
                  }}
                />
              ) : (
                <div style={{
                  width: 320,
                  height: 320,
                  borderRadius: 80,
                  backgroundColor: '#0A0A0C',
                  border: `1.5px dashed ${accentColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 140 }}>🚀</span>
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
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
              huevsite.io/{username}/<span style={{ color: 'white' }}>{slug}</span>
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
    console.error('OG sub-site API error:', e);
    return new Response('Failed to generate the image', {
      status: 500,
    });
  }
}
