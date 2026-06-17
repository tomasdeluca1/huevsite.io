import { ImageResponse } from "next/og";
import {
  ACCENT,
  BORDER,
  TEXT_DIM,
  TEXT_MUTED,
  OG_SIZE,
  OG_CONTENT_TYPE,
  truncate,
  AvatarCircle,
  Wordmark,
  Eyebrow,
  InnerBorder,
  rootStyle,
  fetchCurrentWinner,
  type Winner,
} from "@/lib/og/shared";
import { getContrastColor } from "@/lib/profile-types";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const alt = "huevsite.io — el portfolio que no da vergüenza ajena";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

function renderWithWinner(winner: Winner) {
  const accent = winner.accent_color || ACCENT;
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
        <Wordmark accent={accent} />
        <Eyebrow label="Builder de la Semana" accent={accent} />
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
              fontSize: 60,
              lineHeight: 1.04,
              fontWeight: 900,
              letterSpacing: "-0.045em",
              display: "flex",
              flexWrap: "wrap",
              color: "white",
              maxWidth: 580,
            }}
          >
            Construí tu reputación como builder.
          </div>
          <div
            style={{
              fontSize: 21,
              lineHeight: 1.42,
              color: TEXT_DIM,
              display: "flex",
              flexWrap: "wrap",
              maxWidth: 560,
              fontWeight: 500,
            }}
          >
            Proyectos, métricas reales y endorsements de otros builders. Que te
            vean shippeando, no diciendo. Acá vive la red de LATAM.
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
            background: accent,
            color: getContrastColor(accent),
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
    <div style={rootStyle(ACCENT)}>
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
            fontSize: 80,
            lineHeight: 1.02,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            display: "flex",
            flexWrap: "wrap",
            color: "white",
          }}
        >
          Construí tu reputación como builder.
        </div>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.42,
            color: TEXT_DIM,
            display: "flex",
            flexWrap: "wrap",
            maxWidth: 880,
            fontWeight: 500,
          }}
        >
          Proyectos, métricas reales y endorsements de otros builders. Que te
          vean shippeando, no diciendo. Acá vive la red de LATAM.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            padding: "14px 24px",
            borderRadius: 14,
            background: ACCENT,
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
