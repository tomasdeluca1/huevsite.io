import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog-data';

export const runtime = 'edge';

export const alt = 'huevsite.io blog cover';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'black',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 60,
          }}
        >
          huevsite.io
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '80px',
          backgroundColor: '#0A0A0A',
          backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(200, 255, 0, 0.15) 0%, transparent 60%)',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* We use an absolute background element if you had a specific default OG image.
            For now, we generate a highly aesthetic code-based background to ensure it always looks good. */}
        <div 
          style={{
             position: 'absolute',
             top: 0, left: 0, right: 0, bottom: 0,
             border: '4px solid rgba(255,255,255,0.05)',
             margin: '20px',
             borderRadius: '40px'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
          <div style={{ display: 'flex', color: '#C8FF00', fontSize: 40, fontWeight: 900, letterSpacing: '-0.05em' }}>
            huevsite.io
          </div>
          <div style={{ width: '4px', height: '40px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 32, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            BLOG
          </div>
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '30px',
            color: 'white',
            maxWidth: '1000px'
          }}
        >
          {post.title}
        </div>

        <div
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: 1.4,
            maxWidth: '900px',
            marginBottom: '60px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {post.excerpt}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              background: '#C8FF00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'black',
              fontSize: 32,
              fontWeight: 900
            }}
          >
             {post.author.name.charAt(0)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
             <div style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>{post.author.name}</div>
             <div style={{ fontSize: 24, fontFamily: 'monospace', color: '#C8FF00' }}>@{post.author.username}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
