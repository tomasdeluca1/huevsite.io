import { ImageResponse } from "next/og";
import {
  getPostBySlugAsync,
  isBuilderOfTheWeekPost,
  type BlogPost,
} from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site-url";

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

function absoluteAssetUrl(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${SITE_URL}${src}`;
  return `${SITE_URL}/${src}`;
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function renderFallback() {
  return (
    <div
      style={{
        background: "#080808",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#C8FF00",
        fontSize: 52,
        fontWeight: 900,
        letterSpacing: "-0.04em",
      }}
    >
      huevsite.io
    </div>
  );
}

function renderBuilderOfTheWeek(post: BlogPost) {
  const avatarUrl = absoluteAssetUrl(post.author.avatarUrl);
  const title = truncate(post.title, 88);
  const excerpt = truncate(post.excerpt, 170);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #050505 0%, #0d0d0d 50%, #111307 100%)",
        color: "white",
        padding: "42px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -130,
          right: -110,
          width: 460,
          height: 460,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(200,255,0,0.22) 0%, rgba(200,255,0,0.06) 38%, transparent 72%)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -180,
          left: -120,
          width: 420,
          height: 420,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 18,
          border: "1px solid rgba(200,255,0,0.16)",
          borderRadius: 22,
          display: "flex",
        }}
      />

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          gap: 32,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 320,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "8px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              padding: 24,
              borderRadius: 28,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#C8FF00",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#C8FF00",
                  display: "flex",
                }}
              />
              Builder de la Semana
            </div>

            {avatarUrl ? (
              <img
                src={avatarUrl}
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 999,
                  objectFit: "cover",
                  border: "3px solid rgba(200,255,0,0.75)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #C8FF00 0%, #8DB800 100%)",
                  color: "black",
                  fontSize: 54,
                  fontWeight: 900,
                }}
              >
                {post.author.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  display: "flex",
                  flexWrap: "wrap",
                }}
              >
                {post.author.name}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 18,
                  color: "rgba(255,255,255,0.78)",
                  fontWeight: 600,
                }}
              >
                <span style={{ display: "flex", color: "#C8FF00" }}>
                  @{post.author.username}
                </span>
                <span style={{ display: "flex" }}>
                  huevsite.io/{post.author.username}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 8px",
              fontSize: 14,
              color: "rgba(255,255,255,0.42)",
              fontWeight: 700,
            }}
          >
            <span style={{ display: "flex" }}>huevsite.io</span>
            <span style={{ display: "flex" }}>
              {new Date(post.date).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "10px 0 10px 4px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              {post.tags.slice(0, 3).map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "rgba(200,255,0,0.08)",
                    border: "1px solid rgba(200,255,0,0.26)",
                    color: "#C8FF00",
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  #{tag}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontSize: 58,
                  lineHeight: 1.04,
                  fontWeight: 900,
                  letterSpacing: "-0.045em",
                  display: "flex",
                  flexWrap: "wrap",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 24,
                  lineHeight: 1.42,
                  color: "rgba(255,255,255,0.62)",
                  display: "flex",
                  flexWrap: "wrap",
                  maxWidth: 690,
                }}
              >
                {excerpt}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.10)",
              paddingTop: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span
                style={{
                  display: "flex",
                  color: "rgba(255,255,255,0.38)",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                }}
              >
                Serie editorial
              </span>
              <span
                style={{
                  display: "flex",
                  fontSize: 28,
                  color: "white",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
              >
                Entrevistas a builders que están haciendo ruido.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                padding: "14px 20px",
                borderRadius: 18,
                background: "#C8FF00",
                color: "black",
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              Leer en huevsite
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderDefaultPost(post: BlogPost) {
  const avatarUrl = absoluteAssetUrl(post.author.avatarUrl);
  const excerpt = truncate(post.excerpt, 200);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "52px 64px",
        backgroundColor: "#080808",
        color: "white",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(200,255,0,0.13) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          bottom: 20,
          border: "0.5px solid rgba(200,255,0,0.15)",
          borderRadius: 12,
          display: "flex",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 36,
          zIndex: 10,
        }}
      >
        <span
          style={{
            color: "#C8FF00",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            display: "flex",
          }}
        >
          huevsite.io
        </span>
        <div
          style={{
            width: 1,
            height: 22,
            background: "rgba(255,255,255,0.15)",
            marginLeft: 18,
            marginRight: 18,
            display: "flex",
          }}
        />
        <span
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Blog Post
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 28,
          zIndex: 10,
        }}
      >
        {post.tags.slice(0, 3).map((tag) => (
          <div
            key={tag}
            style={{
              display: "flex",
              padding: "6px 14px",
              background: "rgba(200,255,0,0.08)",
              border: "0.5px solid rgba(200,255,0,0.3)",
              color: "#C8FF00",
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            #{tag}
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: "white",
          maxWidth: 860,
          marginBottom: 20,
          zIndex: 10,
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {post.title}
      </div>

      <div
        style={{
          fontSize: 22,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.55,
          maxWidth: 760,
          fontWeight: 400,
          zIndex: 10,
          display: "flex",
          flex: 1,
          flexWrap: "wrap",
        }}
      >
        {excerpt}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          zIndex: 10,
          paddingTop: 20,
          borderTop: "0.5px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                border: "1px solid rgba(200,255,0,0.3)",
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: "linear-gradient(135deg, #C8FF00 0%, #7aaa00 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "black",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              {post.author.name.charAt(0)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.02em",
                display: "flex",
              }}
            >
              {post.author.name}
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#C8FF00",
                fontWeight: 600,
                display: "flex",
              }}
            >
              @{post.author.username}
            </span>
          </div>
        </div>

        <div
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.35)",
            fontWeight: 600,
            display: "flex",
          }}
        >
          {new Date(post.date).toLocaleDateString("es-AR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
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
    isBuilderOfTheWeekPost(post) ? renderBuilderOfTheWeek(post) : renderDefaultPost(post),
    { ...size }
  );
}
