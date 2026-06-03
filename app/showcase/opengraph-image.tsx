import { ImageResponse } from "next/og";
import {
  OG_SIZE, OG_CONTENT_TYPE, ACCENT, TEXT_DIM,
  OgFrame, Eyebrow, SplitBody, HeroBody, FooterCTA, AvatarCircle, truncate, fetchCurrentWinner,
} from "@/lib/og/shared";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const alt = "Builder de la Semana — huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const winner = await fetchCurrentWinner();
  const accent = winner?.accent_color || ACCENT;
  const headline = "Builder de la Semana.";
  const sub = "Cada semana la comunidad elige al builder destacado de huevsite.io.";

  const body = winner ? (
    <SplitBody
      headline={headline}
      sub={sub}
      right={
        <div style={{ width: 420, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, padding: 28, borderRadius: 28, background: "rgba(255,255,255,0.05)", border: `1px solid ${accent}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <AvatarCircle url={winner.image} name={winner.name || winner.username} size={96} accent={accent} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: "-0.03em", display: "flex" }}>{truncate(winner.name || winner.username, 16)}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: accent, display: "flex" }}>@{winner.username}</span>
            </div>
          </div>
          {winner.tagline ? (
            <div style={{ fontSize: 17, lineHeight: 1.45, color: TEXT_DIM, display: "flex", flexWrap: "wrap", fontWeight: 500 }}>
              {truncate(winner.tagline, 90)}
            </div>
          ) : null}
        </div>
      }
    />
  ) : (
    <HeroBody headline={headline} sub={sub} />
  );

  return new ImageResponse(
    <OgFrame accent={accent} eyebrow={<Eyebrow label="Showcase" accent={accent} />} footer={<FooterCTA cta="Ver showcase" hint="huevsite.io/showcase" accent={accent} />}>
      {body}
    </OgFrame>,
    { ...size }
  );
}
