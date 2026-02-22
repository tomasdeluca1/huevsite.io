import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, accent_color')
      .eq('username', username.toLowerCase())
      .single();

    if (!profile) return new Response('Profile not found', { status: 404 });

    const { data: heroBlock } = await supabase
      .from('blocks')
      .select('content')
      .eq('profile_id', profile.id)
      .eq('type', 'hero')
      .maybeSingle();

    const tagline = heroBlock?.content?.tagline || 'Builder en huevsite.io';
    const roles = (heroBlock?.content?.roles as string[]) || [];
    const accentColor = profile.accent_color || '#C8FF00';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#050505',
            backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(200,255,0,0.15) 0%, #050505 60%)',
            padding: '80px',
            position: 'relative',
            justifyContent: 'space-between',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Subtle Grid effect overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              zIndex: 0,
            }}
          />

          {/* Top Logo Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: '800',
                color: 'white',
                letterSpacing: '-1px',
                display: 'flex'
              }}
            >
              huev<span style={{ color: accentColor }}>site</span>.io
            </div>
            <div
              style={{
                padding: '4px 12px',
                borderRadius: '100px',
                border: '1px solid #333',
                backgroundColor: '#111',
                color: '#888',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                display: 'flex'
              }}
            >
              // builder logic
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '40px'
            }}>
              <div style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${accentColor}, #00FF88)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: '800',
                color: '#000',
                boxShadow: `0 0 40px ${accentColor}40`
              }}>
                {(profile.display_name || username).substring(0, 1).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '92px',
                    fontWeight: '900',
                    color: 'white',
                    lineHeight: 1,
                    letterSpacing: '-3px',
                    marginBottom: '8px',
                  }}
                >
                  {profile.display_name || username}
                </span>
                {/* Badges / Roles */}
                {roles.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    {roles.map((role: string) => (
                      <div
                        key={role}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '12px',
                          border: `1px solid ${accentColor}50`,
                          backgroundColor: `${accentColor}10`,
                          color: '#FFF',
                          fontSize: '20px',
                          fontWeight: '700',
                          letterSpacing: '-0.5px'
                        }}
                      >
                        {role}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <span
              style={{
                fontSize: '36px',
                color: '#A0A0A0',
                maxWidth: '900px',
                lineHeight: 1.4,
                fontWeight: '500',
                letterSpacing: '-0.5px'
              }}
            >
              {tagline}
            </span>
          </div>

          {/* Bottom URL section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 32px',
                borderRadius: '100px',
                border: `1px solid ${accentColor}40`,
                backgroundColor: 'rgba(0,0,0,0.6)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
              }}
            >
              <span style={{ fontSize: '24px', color: '#888', fontWeight: '500', fontFamily: 'monospace' }}>
                huevsite.io/
              </span>
              <span style={{ fontSize: '24px', color: accentColor, fontWeight: '800', fontFamily: 'monospace' }}>
                {username}
              </span>
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
