import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog-data';

export const runtime = 'edge';

export const alt = 'huevsite.io blog cover';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug.toLowerCase());

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#080808',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C8FF00',
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: '-0.04em',
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
          padding: '52px 64px',
          backgroundColor: '#080808',
          color: 'white',
          position: 'relative',
        }}
      >


        {/* Glow — top right */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(200,255,0,0.13) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Inner border frame */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: '0.5px solid rgba(200,255,0,0.15)',
            borderRadius: 12,
            display: 'flex',
          }}
        />

        {/* Top bar: brand + section label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 36,
            zIndex: 10,
          }}
        >
          <span
            style={{
              color: '#C8FF00',
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              display: 'flex',
            }}
          >
            huevsite.io
          </span>
          <div
            style={{
              width: 1,
              height: 22,
              background: 'rgba(255,255,255,0.15)',
              marginLeft: 18,
              marginRight: 18,
              display: 'flex',
            }}
          />
          <span
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            Blog Post
          </span>
        </div>

        {/* Tags */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 28,
            zIndex: 10,
          }}
        >
          {post.tags.slice(0, 3).map((tag, i) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                padding: '6px 14px',
                background: 'rgba(200,255,0,0.08)',
                border: '0.5px solid rgba(200,255,0,0.3)',
                color: '#C8FF00',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              #{tag}
            </div>
          ))}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'white',
            maxWidth: 860,
            marginBottom: 20,
            zIndex: 10,
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {post.title}
        </div>

        {/* Excerpt */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.55,
            maxWidth: 760,
            fontWeight: 400,
            zIndex: 10,
            display: 'flex',
            flex: 1,
            flexWrap: 'wrap',
          }}
        >
          {post.excerpt.length > 200
            ? post.excerpt.substring(0, 200) + '...'
            : post.excerpt}
        </div>

        {/* Bottom row: author + date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            zIndex: 10,
            paddingTop: 20,
            borderTop: '0.5px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  border: '1px solid rgba(200,255,0,0.3)'
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, #C8FF00 0%, #7aaa00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'black',
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                {post.author.name.charAt(0)}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                }}
              >
                {post.author.name}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: '#C8FF00',
                  fontWeight: 600,
                  opacity: 0.8,
                  display: 'flex',
                }}
              >
                {post.author.username === "huevsite" ? "huevsite.io" : `@${post.author.username}`}
              </span>
            </div>
          </div>

          {/* Date */}
          <span
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.3)',
              fontWeight: 500,
              letterSpacing: '0.04em',
              display: 'flex',
            }}
          >
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
