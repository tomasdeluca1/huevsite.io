import { ImageResponse } from "next/og";
import { OG_SIZE, OG_CONTENT_TYPE, OgFrame, Eyebrow, HeroBody, FooterCTA } from "@/lib/og/shared";

export const runtime = "edge";
export const alt = "El feed de la comunidad — huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    <OgFrame eyebrow={<Eyebrow label="Feed" />} footer={<FooterCTA cta="Ver el feed" hint="huevsite.io/feed" />}>
      <HeroBody
        headline="Lo último que se está shippeando."
        sub="Seguí a otros builders y mirá sus lanzamientos, proyectos y logros en tiempo real."
      />
    </OgFrame>,
    { ...size }
  );
}
