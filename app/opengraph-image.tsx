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
  Eyebrow,
  OgFrame,
  SplitBody,
  HeroBody,
  FooterCTA,
  Card,
  BrandFallback,
  fetchCurrentWinner,
  type Winner,
} from "@/lib/og/shared";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const alt = "huevsite.io — construí tu reputación como builder";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const HEADLINE = "Construí tu reputación como builder.";
const SUB =
  "Proyectos, métricas reales y endorsements de otros builders. Que te vean shippeando, no diciendo.";

function renderWithWinner(winner: Winner) {
  // The frame (logo, eyebrow, CTA, card border) stays brand lime. The winner's
  // own accent is only the avatar ring and the handle.
  const detail = winner.accent_color || ACCENT;
  const name = winner.name || winner.username;
  const tagline = truncate(winner.tagline || "", 70);

  return (
    <OgFrame
      eyebrow={<Eyebrow label="Builder de la Semana" />}
      footer={<FooterCTA cta="Empezá gratis" hint="huevsite.io/tuusuario" />}
    >
      <SplitBody
        headline={HEADLINE}
        sub={SUB}
        right={
          <Card width={420}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <AvatarCircle url={winner.image} name={name} size={104} accent={detail} />
              <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
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
                <span style={{ fontSize: 16, fontWeight: 700, color: detail, display: "flex" }}>
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
                gap: 6,
                paddingTop: 14,
                borderTop: `1px solid ${BORDER}`,
                fontSize: 15,
                fontWeight: 700,
                color: TEXT_MUTED,
              }}
            >
              <span style={{ display: "flex" }}>huevsite.io/</span>
              <span style={{ display: "flex", color: "white" }}>{winner.username}</span>
            </div>
          </Card>
        }
      />
    </OgFrame>
  );
}

function renderBrandOnly() {
  return (
    <OgFrame footer={<FooterCTA cta="Empezá gratis" hint="huevsite.io/tuusuario" />}>
      <HeroBody headline={HEADLINE} sub={SUB} />
    </OgFrame>
  );
}

export function homeOgElement(winner: Winner | null) {
  return winner ? renderWithWinner(winner) : renderBrandOnly();
}

export default async function Image() {
  try {
    const winner = await fetchCurrentWinner();
    return new ImageResponse(homeOgElement(winner), { ...size });
  } catch {
    return new ImageResponse(<BrandFallback label={SUB} />, { ...size });
  }
}
