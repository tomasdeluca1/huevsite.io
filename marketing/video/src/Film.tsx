import { AbsoluteFill, Audio, staticFile } from "remotion";
import { BG } from "./brand";
import { Fonts } from "./fonts";
import { Story } from "./v3/Story";
import type { Layout } from "./timing";

export function Film({ layout, variant }: { layout: Layout; variant: "organic" | "ads" }) {
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Fonts />
      <Audio src={staticFile("audio/bed.wav")} />
      <Story layout={layout} variant={variant} />
    </AbsoluteFill>
  );
}
