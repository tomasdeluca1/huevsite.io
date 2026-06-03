import { ImageResponse } from "next/og";
import { OG_SIZE, OG_CONTENT_TYPE, OgFrame, Eyebrow, HeroBody, FooterCTA } from "@/lib/og/shared";

export const runtime = "edge";
export const alt = "Invitá builders y ganá Pro — huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    <OgFrame eyebrow={<Eyebrow label="Referidos" />} footer={<FooterCTA cta="Ver referidos" hint="huevsite.io/referrals" />}>
      <HeroBody
        headline="Invitá builders, ganá Pro."
        sub="Cada 3 builders que sumás a Pro con tu link, te llevás 3 meses de Pro gratis."
      />
    </OgFrame>,
    { ...size }
  );
}
