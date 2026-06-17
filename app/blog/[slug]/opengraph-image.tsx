import { ImageResponse } from "next/og";
import {
  getPostBySlugAsync,
  isBuilderOfTheWeekPost,
  type BlogPost,
} from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site-url";
import { ogAvatarUrl } from "@/lib/og-avatar";

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

const ACCENT = "#C8FF00";
const BG_TOP = "#050505";
const BG_BOTTOM = "#0c0c0c";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT_DIM = "rgba(255,255,255,0.62)";
const TEXT_MUTED = "rgba(255,255,255,0.38)";

function absoluteAssetUrl(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${SITE_URL}${src}`;
  return `${SITE_URL}/${src}`;
}

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
        color: ACCENT,
        fontSize: 64,
        fontWeight: 900,
        letterSpacing: "-0.05em",
      }}
    >
      huevsite.io
    </div>
  );
}

function FrameBackground({ tinted = false }: { tinted?: boolean }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOTTOM} 60%, ${
            tinted ? "#111307" : "#0a0a0a"
          } 100%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -160,
          right: -140,
          width: 540,
          height: 540,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(200,255,0,0.20) 0%, rgba(200,255,0,0.05) 40%, transparent 72%)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          left: -140,
          width: 460,
          height: 460,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
          display: "flex",
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

function Logo() {
  // Real site logo: "huev" + "site" (accent) + ".io" (dim). Matches the shared
  // OG Wordmark and /api/og/[username] — no floating brand-lime dot.
  return (
    <div style={{ display: "flex", alignItems: "baseline" }}>
      <span style={{ color: "white", fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em" }}>huev</span>
      <span style={{ color: ACCENT, fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em" }}>site</span>
      <span style={{ color: "white", opacity: 0.4, fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em" }}>.io</span>
    </div>
  );
}

function TagPill({ tag }: { tag: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(200,255,0,0.10)",
        border: "1px solid rgba(200,255,0,0.28)",
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
            : "1px solid rgba(200,255,0,0.35)",
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
        background: "linear-gradient(135deg, #C8FF00 0%, #7aaa00 100%)",
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
      <FrameBackground tinted />

      {/* Top bar: wordmark + Builder de la Semana eyebrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Logo />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 18px",
            borderRadius: 999,
            background: "rgba(200,255,0,0.10)",
            border: "1px solid rgba(200,255,0,0.32)",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: ACCENT,
              display: "flex",
              boxShadow: `0 0 16px ${ACCENT}`,
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
              boxShadow: "0 24px 80px rgba(200,255,0,0.22)",
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
              background: "linear-gradient(135deg, #C8FF00 0%, #7aaa00 100%)",
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
  const avatarUrl = absoluteAssetUrl(post.author.avatarUrl);
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
        <Logo />
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
}
