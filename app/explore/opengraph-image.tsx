import { ImageResponse } from "next/og";
import {
  OG_SIZE, OG_CONTENT_TYPE, ACCENT, TEXT_DIM,
  OgFrame, Eyebrow, SplitBody, HeroBody, FooterCTA, countBuilders,
} from "@/lib/og/shared";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const alt = "Explorá los builders de LATAM en huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export default async function Image() {
  const count = await countBuilders();
  const headline = "Explorá los builders de LATAM.";
  const sub = "Inspirate con perfiles reales, descubrí proyectos y armá el tuyo en 3 minutos.";

  const body = count ? (
    <SplitBody
      headline={headline}
      sub={sub}
      right={
        <div style={{ width: 380, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 36, borderRadius: 28, background: "rgba(255,255,255,0.05)", border: `1px solid ${ACCENT}40`, gap: 6 }}>
          <span style={{ fontSize: 110, fontWeight: 900, color: ACCENT, letterSpacing: "-0.04em", lineHeight: 1, display: "flex" }}>{`+${fmt(count)}`}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex" }}>builders</span>
        </div>
      }
    />
  ) : (
    <HeroBody headline={headline} sub={sub} />
  );

  return new ImageResponse(
    <OgFrame eyebrow={<Eyebrow label="Hall of fame" />} footer={<FooterCTA cta="Explorar builders" hint="huevsite.io/explore" />}>
      {body}
    </OgFrame>,
    { ...size }
  );
}
