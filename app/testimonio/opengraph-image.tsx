import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  OgFrame,
  Eyebrow,
  HeroBody,
  FooterCTA,
} from "@/lib/og/shared";

export const runtime = "edge";
export const alt = "Dejá tu testimonio — huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <OgFrame
        eyebrow={<Eyebrow label="Testimonios" />}
        footer={<FooterCTA cta="Dejá el tuyo" hint="huevsite.io/testimonio" />}
      >
        <HeroBody
          headline="¿Te sirve huevsite? Contalo."
          sub="Dejá tu testimonio y, si nos gusta, lo mostramos en la home con tu nombre, foto y link a tu perfil."
        />
      </OgFrame>
    ),
    { ...size }
  );
}
