import { ImageResponse } from 'next/og';
import { profileService } from '@/lib/profile-service';

export const runtime = 'edge';

export const alt = 'huevsite.io builder profile';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;
  const profile = await profileService.getProfile(username);

  const displayName = profile?.displayName || username;
  const tagline = profile?.tagline || 'Builder en huevsite.io';
  const accentColor = profile?.accentColor || '#C8FF00';
  const score = profile?.builderScore || 0;
  const isWinner = profile?.isWinner || false;
  const avatarUrl = profile?.avatarUrl;
  
  // Extract roles (first 2) 
  const roles = (profile as any)?.roles?.slice(0, 3) || [];

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
        {/* Dynamic Background Aura */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '60%',
            height: '120%',
            backgroundColor: `${accentColor}`,
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
            backgroundColor: `${accentColor}`,
            opacity: 0.05,
            filter: 'blur(80px)',
            borderRadius: '50%',
          }}
        />

        {/* Header - Branding */}
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
               Builder de la Semana 🏆
             </div>
          )}
        </div>

        {/* Main Content Card Layout */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            gap: 60,
          }}
        >
          {/* Left: Avatar with Glow */}
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
            {avatarUrl ? (
              <img
                src={avatarUrl}
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: 60,
                  border: `4px solid ${accentColor}40`,
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
            
            {/* Score Badge */}
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

          {/* Right: Info */}
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
                margin: '0 0 32px 0',
                maxWidth: 600,
              }}
            >
              {tagline}
            </p>

            {/* Roles Chips */}
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

        {/* Footer info */}
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
            fontSize: 20,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'monospace'
          }}>
            huevsite.io/<span style={{ color: 'white' }}>{username}</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
