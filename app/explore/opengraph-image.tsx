import { ImageResponse } from "next/og";
import {
  OG_SIZE, OG_CONTENT_TYPE, ACCENT, TEXT_DIM,
  OgFrame, Eyebrow, SplitBody, HeroBody, FooterCTA, Card, BrandFallback, countBuilders,
} from "@/lib/og/shared";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const alt = "Explorá a los builders de huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const HEADLINE = "Explorá a los builders que shippean.";
const SUB = "Inspirate con perfiles reales, descubrí proyectos y armá el tuyo en 3 minutos.";

export default async function Image() {
  try {
    const count = await countBuilders();

    const body = count ? (
      <SplitBody
        headline={HEADLINE}
        sub={SUB}
        right={
          <Card width={380}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 112, fontWeight: 900, color: ACCENT, letterSpacing: "-0.04em", lineHeight: 1, display: "flex" }}>{`+${fmt(count)}`}</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex" }}>builders</span>
            </div>
          </Card>
        }
      />
    ) : (
      <HeroBody headline={HEADLINE} sub={SUB} />
    );

    return new ImageResponse(
      <OgFrame eyebrow={<Eyebrow label="Explorar" />} footer={<FooterCTA cta="Explorar builders" hint="huevsite.io/explore" />}>
        {body}
      </OgFrame>,
      { ...size }
    );
  } catch {
    return new ImageResponse(<BrandFallback label={SUB} />, { ...size });
  }
}
