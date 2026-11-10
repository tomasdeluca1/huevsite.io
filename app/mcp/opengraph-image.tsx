import { ImageResponse } from "next/og";
import { OG_SIZE, OG_CONTENT_TYPE, OgFrame, Eyebrow, HeroBody, FooterCTA } from "@/lib/og/shared";

export const runtime = "edge";
export const alt = "Conectá tu agente a huevsite";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    <OgFrame eyebrow={<Eyebrow label="MCP" />} footer={<FooterCTA cta="Conectar el agente" hint="huevsite.io/mcp" />}>
      <HeroBody
        headline="Conectá tu agente."
        sub="Cursor, VS Code, Claude o ChatGPT actualizan tu perfil. Entrás con tu cuenta."
      />
    </OgFrame>,
    { ...size }
  );
}
