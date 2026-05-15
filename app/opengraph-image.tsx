import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const alt = "huevsite.io — el portfolio que no da vergüenza ajena";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT_FALLBACK = "#C8FF00";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT_DIM = "rgba(255,255,255,0.62)";
const TEXT_MUTED = "rgba(255,255,255,0.40)";

type Winner = {
  username: string;
  name: string | null;
  image: string | null;
  tagline: string | null;
  accent_color: string | null;
};

async function fetchCurrentWinner(): Promise<Winner | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) return null;

  const url = `${baseUrl}/rest/v1/showcase_winners?select=user:profiles!showcase_winners_user_id_fkey(username,name,image,tagline,accent_color)&order=week.desc&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ user: Winner | null }>;
    return rows[0]?.user ?? null;
  } catch {
    return null;
  }
}

function truncate(text: string, max: number) {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

// Satori on edge doesn't decode webp. Route remote avatars through a free
// image proxy that re-encodes to jpeg at a fixed size.
function safeAvatarUrl(src: string | null, size: number): string | null {
  if (!src) return null;
  if (!src.startsWith("http")) return null;
  const encoded = encodeURIComponent(src);
  return `https://images.weserv.nl/?url=${encoded}&w=${size * 2}&h=${
    size * 2
  }&fit=cover&output=jpg`;
}

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          background: ACCENT_FALLBACK,
          display: "flex",
          boxShadow: `0 0 24px ${ACCENT_FALLBACK}`,
        }}
      />
      <span
        style={{
          color: "white",
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          display: "flex",
        }}
      >
        huevsite.io
      </span>
    </div>
  );
}

function BuilderBadge({ accent }: { accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 18px",
        borderRadius: 999,
        background: `${accent}1f`,
        border: `1px solid ${accent}66`,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: accent,
          display: "flex",
          boxShadow: `0 0 14px ${accent}`,
        }}
      />
      <span
        style={{
          color: accent,
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        Builder de la Semana
      </span>
    </div>
  );
}

function AvatarCircle({
  url,
  name,
  size: avatarSize,
  accent,
}: {
  url: string | null;
  name: string;
  size: number;
  accent: string;
}) {
  const proxied = safeAvatarUrl(url, avatarSize);
  if (proxied) {
    return (
      <img
        src={proxied}
        width={avatarSize}
        height={avatarSize}
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: 999,
          objectFit: "cover",
          border: `4px solid ${accent}`,
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
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}aa 100%)`,
        color: "black",
        fontSize: Math.round(avatarSize * 0.42),
        fontWeight: 900,
        border: `4px solid ${accent}`,
      }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function rootStyle(accent: string) {
  return {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    padding: "56px 64px",
    color: "white",
    background: `radial-gradient(circle at 14% 12%, ${accent}26 0%, transparent 42%), radial-gradient(circle at 88% 88%, ${accent}1f 0%, transparent 48%), linear-gradient(160deg, #050505 0%, #0c0c0c 55%, #0a0a0a 100%)`,
    position: "relative" as const,
  };
}

function InnerBorder() {
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        right: 24,
        bottom: 24,
        border: `1px solid ${BORDER}`,
        borderRadius: 28,
        display: "flex",
      }}
    />
  );
}

function renderWithWinner(winner: Winner) {
  const accent = winner.accent_color || ACCENT_FALLBACK;
  const name = winner.name || winner.username;
  const tagline = truncate(winner.tagline || "", 64);

  return (
    <div style={rootStyle(accent)}>
      <InnerBorder />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Wordmark />
        <BuilderBadge accent={accent} />
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          marginTop: 32,
          gap: 44,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.04,
              fontWeight: 900,
              letterSpacing: "-0.045em",
              display: "flex",
              flexWrap: "wrap",
              color: "white",
              maxWidth: 580,
            }}
          >
            El portfolio que no da vergüenza ajena.
          </div>
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.42,
              color: TEXT_DIM,
              display: "flex",
              flexWrap: "wrap",
              maxWidth: 540,
              fontWeight: 500,
            }}
          >
            Mostrá quién sos y qué buildás. Sin diseñar desde cero, sin LinkedIn
            genérico.
          </div>
        </div>

        <div
          style={{
            width: 420,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 28,
            borderRadius: 28,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${accent}40`,
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <AvatarCircle
              url={winner.image}
              name={name}
              size={104}
              accent={accent}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "white",
                  display: "flex",
                  flexWrap: "wrap",
                }}
              >
                {truncate(name, 18)}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: accent,
                  display: "flex",
                }}
              >
                @{winner.username}
              </span>
            </div>
          </div>

          {tagline ? (
            <div
              style={{
                fontSize: 17,
                lineHeight: 1.45,
                color: TEXT_DIM,
                display: "flex",
                flexWrap: "wrap",
                fontWeight: 500,
              }}
            >
              {tagline}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingTop: 16,
              borderTop: `1px solid ${BORDER}`,
              fontSize: 15,
              fontWeight: 700,
              color: TEXT_MUTED,
            }}
          >
            <span style={{ display: "flex" }}>huevsite.io/</span>
            <span style={{ display: "flex", color: "white" }}>
              {winner.username}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 22,
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "12px 22px",
            borderRadius: 14,
            background: ACCENT_FALLBACK,
            color: "black",
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: "-0.01em",
          }}
        >
          Empezá gratis
        </div>
        <span
          style={{
            color: TEXT_MUTED,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          huevsite.io/tuusuario
        </span>
      </div>
    </div>
  );
}

function renderBrandOnly() {
  return (
    <div style={rootStyle(ACCENT_FALLBACK)}>
      <InnerBorder />

      <Wordmark />

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
          maxWidth: 940,
        }}
      >
        <div
          style={{
            fontSize: 88,
            lineHeight: 1.02,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            display: "flex",
            flexWrap: "wrap",
            color: "white",
          }}
        >
          El portfolio que no da vergüenza ajena.
        </div>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.42,
            color: TEXT_DIM,
            display: "flex",
            flexWrap: "wrap",
            maxWidth: 820,
            fontWeight: 500,
          }}
        >
          Mostrá quién sos y qué buildás. Sin diseñar desde cero, sin LinkedIn
          genérico. Con personalidad propia.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            padding: "14px 24px",
            borderRadius: 14,
            background: ACCENT_FALLBACK,
            color: "black",
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          Empezá gratis
        </div>
        <span
          style={{
            color: TEXT_MUTED,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          huevsite.io/tuusuario
        </span>
      </div>
    </div>
  );
}

export default async function Image() {
  const winner = await fetchCurrentWinner();
  return new ImageResponse(
    winner ? renderWithWinner(winner) : renderBrandOnly(),
    { ...size }
  );
}
