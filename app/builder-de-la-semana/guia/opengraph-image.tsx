import { ImageResponse } from "next/og";
import { OG_SIZE, OG_CONTENT_TYPE, OgFrame, Eyebrow, HeroBody, FooterCTA } from "@/lib/og/shared";

export const runtime = "edge";
export const alt = "Grabá tu historia como builder — Builder de la Semana | huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    <OgFrame
      eyebrow={<Eyebrow label="Builder de la Semana" />}
      footer={<FooterCTA cta="Grabá tu historia" hint="huevsite.io/builder-de-la-semana" />}
    >
      <HeroBody
        headline="Grabá tu historia como builder."
        sub="10 preguntas. 15 segundos cada una. Una por story. Así te entrevistamos para Builder de la Semana."
      />
    </OgFrame>,
    { ...size }
  );
}
