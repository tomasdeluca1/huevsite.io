import { AbsoluteFill, Sequence } from "remotion";
import { BG } from "./brand";
import { Fonts } from "./fonts";
import { Reveal } from "./motion";
import { SCENES, type Layout } from "./timing";
import { Hook } from "./scenes/Hook";
import { Wall } from "./scenes/Wall";
import { Projects } from "./scenes/Projects";
import { MapScene } from "./scenes/MapScene";
import { Hunt } from "./scenes/Hunt";
import { Close } from "./scenes/Close";

export function Film({ layout }: { layout: Layout }) {
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Fonts />
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.dur}>
        <Hook layout={layout} />
      </Sequence>
      <Sequence from={SCENES.wall.from} durationInFrames={SCENES.wall.dur}>
        <Reveal>
          <Wall layout={layout} />
        </Reveal>
      </Sequence>
      <Sequence from={SCENES.projects.from} durationInFrames={SCENES.projects.dur}>
        <Reveal>
          <Projects layout={layout} />
        </Reveal>
      </Sequence>
      <Sequence from={SCENES.geo.from} durationInFrames={SCENES.geo.dur}>
        <Reveal>
          <MapScene layout={layout} />
        </Reveal>
      </Sequence>
      <Sequence from={SCENES.hunt.from} durationInFrames={SCENES.hunt.dur}>
        <Reveal>
          <Hunt layout={layout} />
        </Reveal>
      </Sequence>
      <Sequence from={SCENES.close.from} durationInFrames={SCENES.close.dur}>
        <Reveal>
          <Close layout={layout} />
        </Reveal>
      </Sequence>
    </AbsoluteFill>
  );
}
