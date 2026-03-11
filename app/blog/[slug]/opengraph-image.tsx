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
          backgroundImage: 'radial-gradient(circle at 60% 0%, rgba(200, 255, 0, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 120%, rgba(200, 255, 0, 0.15) 0%, transparent 60%)',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Aesthetic Frame */}
        <div 
          style={{
             position: 'absolute',
             top: 0, left: 0, right: 0, bottom: 0,
             border: '2px solid rgba(255,255,255,0.03)',
             margin: '40px',
             borderRadius: '32px'
          }}
        />

        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '50px', gap: '20px' }}>
          <div style={{ display: 'flex', color: '#C8FF00', fontSize: 36, fontWeight: 900, letterSpacing: '-0.05em' }}>
            huevsite.io
          </div>
          <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>
            Blog
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '40px',
            color: 'white',
            maxWidth: '1000px',
            textShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          {post.title}
        </div>

        {/* Excerpt */}
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: 1.4,
            maxWidth: '900px',
            marginBottom: '70px',
            display: 'flex',
          }}
        >
          {post.excerpt.length > 140 ? post.excerpt.substring(0, 140) + '...' : post.excerpt}
        </div>

        {/* Author Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'rgba(255,255,255,0.03)', padding: '24px 32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
             <div style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>{post.author.name}</div>
             <div style={{ fontSize: 20, color: '#C8FF00', fontWeight: 600 }}>@{post.author.username}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
