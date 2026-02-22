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
    const accentColor = profile.accent_color || '#FFFD01';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#000000',
            backgroundImage: 'radial-gradient(circle at 25% 25%, #111111 0%, #000000 100%)',
            padding: '80px',
            position: 'relative',
          }}
        >
          {/* Accent Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '60%',
              height: '60%',
              borderRadius: '100%',
              backgroundColor: accentColor,
              opacity: 0.1,
              filter: 'blur(100px)',
            }}
          />

          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'black',
              }}
            >
              H
            </div>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', letterSpacing: '-0.05em' }}>
              huevsite.io
            </span>
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '85px',
                fontWeight: '900',
                color: 'white',
                lineHeight: 1.1,
                letterSpacing: '-0.04em',
                marginBottom: '16px',
              }}
            >
              {profile.display_name || username}
            </span>

            {/* Badges / Roles */}
            {roles.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                {roles.map((role: string) => (
                  <div
                    key={role}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '40px',
                      border: `1.5px solid ${accentColor}44`,
                      backgroundColor: `${accentColor}15`,
                      color: accentColor,
                      fontSize: '18px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {role}
                  </div>
                ))}
              </div>
            )}

            <span
              style={{
                fontSize: '32px',
                color: '#888888',
                maxWidth: '850px',
                lineHeight: 1.4,
              }}
            >
              {tagline}
            </span>
          </div>

          {/* URL Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '80px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '40px',
              border: '1px solid #333333',
              backgroundColor: '#111111',
            }}
          >
            <span style={{ fontSize: '18px', color: '#888888', fontWeight: '500' }}>
              huevsite.io/
            </span>
            <span style={{ fontSize: '18px', color: 'white', fontWeight: '800' }}>
              {username}
            </span>
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
