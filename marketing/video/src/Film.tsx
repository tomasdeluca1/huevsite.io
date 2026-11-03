import { AbsoluteFill, Audio, staticFile } from "remotion";
import { BG } from "./brand";
import { Fonts } from "./fonts";
import type { Layout } from "./timing";
import { Apple } from "./v4/Apple";

export function Film({ layout, variant }: { layout: Layout; variant: "organic" | "ads" }) {
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Fonts />
      <Audio src={staticFile("audio/bed.wav")} />
      <Apple layout={layout} variant={variant} />
    </AbsoluteFill>
  );
}
