import { ImageResponse } from "next/og";
import { OG_SIZE, OG_CONTENT_TYPE, OgFrame, Eyebrow, HeroBody, FooterCTA } from "@/lib/og/shared";

export const runtime = "edge";
export const alt = "El blog de huevsite — growth, producto y builders de LATAM";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    <OgFrame eyebrow={<Eyebrow label="Blog" />} footer={<FooterCTA cta="Leer el blog" hint="huevsite.io/blog" />}>
      <HeroBody
        headline="El blog de huevsite."
        sub="Growth, producto y las historias de los builders que están construyendo en LATAM."
      />
    </OgFrame>,
    { ...size }
  );
}
