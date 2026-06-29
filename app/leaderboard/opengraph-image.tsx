import { ImageResponse } from "next/og";
import {
  OG_SIZE, OG_CONTENT_TYPE, ACCENT,
  OgFrame, Eyebrow, SplitBody, HeroBody, FooterCTA, AvatarCircle, truncate, fetchTopBuilders, BrandFallback,
} from "@/lib/og/shared";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const alt = "El ranking de builders de huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const MEDAL = ["#FFD600", "#C0C0C0", "#CD7F32"];

export default async function Image() {
  try {
  const top = (await fetchTopBuilders(3)).slice(0, 3);
  const headline = "El ranking de builders.";
  const sub = "Subí tu builder score, sumá seguidores y escalá posiciones. ¿Llegás al podio?";

  const body = top.length ? (
    <SplitBody
      headline={headline}
      sub={sub}
      right={
        <div style={{ width: 440, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, padding: 26, borderRadius: 28, background: "rgba(255,255,255,0.05)", border: `1px solid ${ACCENT}40` }}>
          {top.map((b, i) => (
            <div key={b.username} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ width: 26, fontSize: 26, fontWeight: 900, color: MEDAL[i] || "white", display: "flex" }}>{i + 1}</span>
              <AvatarCircle url={b.image} name={b.name || b.username} size={56} accent={ACCENT} />
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "white", display: "flex" }}>{truncate(b.name || b.username, 15)}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: ACCENT, display: "flex" }}>{b.builder_score ?? 0} pts</span>
              </div>
            </div>
          ))}
        </div>
      }
    />
  ) : (
    <HeroBody headline={headline} sub={sub} />
  );

  return new ImageResponse(
    <OgFrame eyebrow={<Eyebrow label="Ranking" />} footer={<FooterCTA cta="Ver ranking" hint="huevsite.io/leaderboard" />}>
      {body}
    </OgFrame>,
    { ...size }
  );
  } catch {
    return new ImageResponse(<BrandFallback label="El ranking de builders de huevsite.io" />, { ...size });
  }
}
