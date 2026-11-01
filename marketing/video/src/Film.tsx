import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { BG } from "./brand";
import { Fonts } from "./fonts";
import { shotAt } from "./edit.mjs";
import { Logo } from "./components/Type";
import { Stage } from "./v2/Stage";
import type { Layout } from "./timing";

const CORNER = new Set(["cluster", "fly", "project", "geo", "bdls", "launch"]);

export function Film({ layout }: { layout: Layout }) {
  const frame = useCurrentFrame();
  const shot = shotAt(frame);

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Fonts />
      <Audio src={staticFile("audio/master.wav")} />
      <Stage frame={frame} shot={shot} layout={layout} />
      {CORNER.has(shot.kind) ? (
        <div style={{ position: "absolute", top: layout === "vertical" ? 28 : 22, left: layout === "vertical" ? 32 : 36 }}>
          <Logo height={layout === "vertical" ? 30 : 26} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
