import { ImageResponse } from "next/og";
import {
  getPostBySlugAsync,
  isBuilderOfTheWeekPost,
  type BlogPost,
} from "@/lib/blog-data";
import { ogAvatarUrl } from "@/lib/og-avatar";
import { BRAND } from "@/lib/brand";
import { OgLogo } from "@/lib/og/shared";

// BDLS posts are published from the DB after deploy, so this metadata route
// must stay dynamic instead of serving a cached shell from build time.
export const dynamic = "force-dynamic";
export const runtime = "edge";

export const alt = "huevsite.io blog cover";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const ACCENT = BRAND.color.accent;
const BG_TOP = BRAND.color.bg;
const BORDER = BRAND.color.border;
const TEXT_DIM = BRAND.color.textDim;
const TEXT_MUTED = BRAND.color.textMuted;

function truncate(text: string, max: number) {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

// BDLS titles lead with the builder's name then ": " or ", " then the hook
// (e.g. "Martín Pulitano: De hackathons…", "Rober: De Freelance…"). The portrait
// card already shows the name big, so drop that prefix and use the hook as a
// clean headline. The title's name form often differs from author_name
// ("Rober" vs "Robertino", "Martín Pulitano" vs "Martín Ezequiel Pulitano"), so
// match on any shared name/username token — and only strip when the early
// prefix actually looks like the name (guards hook-led titles).
function headlineFromTitle(title: string, name: string, username: string) {
  const m = title.match(/^(.{1,30}?)\s*[:,]\s+(.+)$/);
  if (m) {
    const prefix = m[1].toLowerCase();
    const rest = m[2].trim();
    const tokens = [...name.toLowerCase().split(/\s+/), username.toLowerCase()].filter(
      (t) => t.length >= 3
    );
    if (rest && tokens.some((t) => prefix.includes(t) || t.includes(prefix))) {
      return rest.charAt(0).toUpperCase() + rest.slice(1);
    }
  }
  return title;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderFallback() {
  return (
    <div
      style={{
        background: BG_TOP,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <OgLogo height={64} />
    </div>
  );
}

function FrameBackground() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: BG_TOP,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.05) 1.4px, transparent 1.4px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: `1px solid ${BORDER}`,
          borderRadius: 28,
          display: "flex",
        }}
      />
    </>
  );
}

function TagPill({ tag }: { tag: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "8px 14px",
        borderRadius: 999,
        background: BRAND.color.accentDim,
        border: `1px solid ${BRAND.color.accentMid}`,
        color: ACCENT,
        fontSize: 13,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
      }}
    >
      #{tag}
    </div>
  );
}

function AuthorAvatar({
  url,
  name,
  size: avatarSize,
  ring = false,
}: {
  url: string | null;
  name: string;
  size: number;
  ring?: boolean;
}) {
  if (url) {
    return (
      <img
        src={url}
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: 999,
          objectFit: "cover",
          border: ring
            ? `3px solid ${ACCENT}`
            : `1px solid ${BRAND.color.accentMid}`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ACCENT,
        color: "black",
        fontSize: Math.round(avatarSize * 0.42),
        fontWeight: 900,
        border: ring ? `3px solid ${ACCENT}` : "none",
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function renderBuilderOfTheWeek(post: BlogPost) {
  // Hero photo routed through the proxy so Satori can render it regardless of
  // the source format (webp uploads, Linktree/Twitter imports, etc.).
  const photoUrl = ogAvatarUrl(post.author.avatarUrl, 240);
  const name = truncate(post.author.name, 34);
  const headline = truncate(
    headlineFromTitle(post.title, post.author.name, post.author.username),
    92
  );

  return (
    <div
      style={{
        // Explicit opaque dark base so the OG is never transparent — Twitter
        // composites alpha-channel PNGs onto white, which read as "light mode".
        background: BG_TOP,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        color: "white",
        padding: "52px 60px",
      }}
    >
      <FrameBackground />

      {/* Top bar: logo + Builder de la Semana eyebrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <OgLogo />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 18px",
            borderRadius: 999,
            background: BRAND.color.accentDim,
            border: `1px solid ${BRAND.color.accentMid}`,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: ACCENT,
              display: "flex",
            }}
          />
          <span
            style={{
              color: ACCENT,
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Builder de la Semana
          </span>
        </div>
      </div>

      {/* Main: portrait + content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 52,
          flex: 1,
          position: "relative",
          zIndex: 1,
          marginTop: 8,
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            width={400}
            height={400}
            style={{
              width: 400,
              height: 400,
              borderRadius: 40,
              objectFit: "cover",
              border: `4px solid ${ACCENT}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 400,
              height: 400,
              borderRadius: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: ACCENT,
              color: "black",
              fontSize: 184,
              fontWeight: 900,
              border: `4px solid ${ACCENT}`,
            }}
          >
            {post.author.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              maxWidth: 580,
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              color: ACCENT,
            }}
          >
            @{post.author.username}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              maxWidth: 580,
              fontSize: 29,
              lineHeight: 1.26,
              fontWeight: 600,
              color: TEXT_DIM,
              marginTop: 4,
            }}
          >
            {headline}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            {post.tags.slice(0, 3).map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "14px 22px",
                borderRadius: 16,
                background: ACCENT,
                color: "black",
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: "-0.01em",
              }}
            >
              Leer entrevista →
            </div>
            <span
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 600,
                color: TEXT_MUTED,
              }}
            >
              huevsite.io/{post.author.username} · {formatDate(post.date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderDefaultPost(post: BlogPost) {
  // Re-encode through the proxy: a webp/foreign-host author avatar passed raw to
  // Satori throws ("Image size cannot be determined") and 500s the whole OG.
  const avatarUrl = ogAvatarUrl(post.author.avatarUrl, 56);
  const title = truncate(post.title, 110);
  const excerpt = truncate(post.excerpt, 230);
  const readingLabel = post.readingTime
    ? `${post.readingTime} min read`
    : null;

  return (
    <div
      style={{
        // Explicit opaque dark base — see renderBuilderOfTheWeek note.
        background: BG_TOP,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        color: "white",
        padding: "56px 64px",
      }}
    >
      <FrameBackground />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <OgLogo />
        <span
          style={{
            color: TEXT_MUTED,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Blog · huevsite.io/blog
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          marginTop: 40,
          position: "relative",
          zIndex: 1,
          flex: 1,
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {post.tags.slice(0, 3).map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>

        <div
          style={{
            fontSize: 64,
            lineHeight: 1.04,
            fontWeight: 900,
            letterSpacing: "-0.045em",
            display: "flex",
            flexWrap: "wrap",
            maxWidth: 1040,
            color: "white",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 24,
            lineHeight: 1.42,
            color: TEXT_DIM,
            display: "flex",
            flexWrap: "wrap",
            maxWidth: 980,
            fontWeight: 500,
          }}
        >
          {excerpt}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 24,
          borderTop: `1px solid ${BORDER}`,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <AuthorAvatar
            url={avatarUrl}
            name={post.author.name}
            size={56}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "white",
                display: "flex",
              }}
            >
              {post.author.name}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: ACCENT,
                display: "flex",
              }}
            >
              @{post.author.username}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 14,
            fontWeight: 600,
            color: TEXT_MUTED,
          }}
        >
          <span style={{ display: "flex" }}>{formatDate(post.date)}</span>
          {readingLabel ? (
            <>
              <span style={{ display: "flex" }}>·</span>
              <span style={{ display: "flex" }}>{readingLabel}</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    const post = await getPostBySlugAsync(slug.toLowerCase());

    if (!post) {
      return new ImageResponse(renderFallback(), { ...size });
    }

    return new ImageResponse(
      isBuilderOfTheWeekPost(post)
        ? renderBuilderOfTheWeek(post)
        : renderDefaultPost(post),
      { ...size }
    );
  } catch {
    // Never 500 a share preview — fall back to the branded cover.
    return new ImageResponse(renderFallback(), { ...size });
  }
}
