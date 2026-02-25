import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return new Response('Username is required', { status: 400 });
    }

    const supabase = await createClient();

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, username, tagline, accent_color')
      .eq('username', username)
      .single();

    if (!profile) {
      return new Response('Profile not found', { status: 404 });
    }

    const displayName = profile.name || profile.username;
    const tagline = profile.tagline || 'Builder de LATAM 🇦🇷';
    const accentColor = profile.accent_color || '#C8FF00';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#080808',
            position: 'relative',
          }}
        >
          {/* Mock background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)`,
              backgroundSize: '100px 100px',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              padding: '40px 80px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              boxShadow: `0 0 80px ${accentColor}20`,
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: 'flex',
                fontSize: 32,
                fontWeight: 700,
                color: 'white',
                marginBottom: 40,
                fontFamily: 'monospace',
              }}
            >
              huev<span style={{ color: accentColor }}>site</span>.io
            </div>

            {/* User Info */}
            <div
              style={{
                display: 'flex',
                fontSize: 80,
                fontWeight: 800,
                color: 'white',
                marginBottom: 20,
                textAlign: 'center',
                letterSpacing: '-0.05em',
              }}
            >
              {displayName}
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: 36,
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center',
              }}
            >
              {tagline}
            </div>
            
            <div
               style={{
                  display: 'flex',
                  marginTop: 40,
                  fontSize: 24,
                  fontWeight: 600,
                  color: accentColor,
               }}
            >
              huevsite.io/{profile.username}
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
    console.error('OG API error:', e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
