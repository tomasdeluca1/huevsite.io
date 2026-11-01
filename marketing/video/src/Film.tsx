import { AbsoluteFill, Sequence } from "remotion";
import { BG } from "./brand";
import { Fonts } from "./fonts";
import { SceneShift } from "./motion";
import { SCENES, withSlide, type Layout } from "./timing";
import { Hook } from "./scenes/Hook";
import { Wall } from "./scenes/Wall";
import { Projects } from "./scenes/Projects";
import { MapScene } from "./scenes/MapScene";
import { Hunt } from "./scenes/Hunt";
import { Close } from "./scenes/Close";

export function Film({ layout }: { layout: Layout }) {
  const hook = withSlide(SCENES.hook.from, SCENES.hook.dur, { enter: false, exit: true });
  const wall = withSlide(SCENES.wall.from, SCENES.wall.dur, { enter: true, exit: true });
  const projects = withSlide(SCENES.projects.from, SCENES.projects.dur, { enter: true, exit: true });
  const geo = withSlide(SCENES.geo.from, SCENES.geo.dur, { enter: true, exit: true });
  const hunt = withSlide(SCENES.hunt.from, SCENES.hunt.dur, { enter: true, exit: true });
  const close = withSlide(SCENES.close.from, SCENES.close.dur, { enter: true, exit: false });

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Fonts />
      <Sequence from={hook.from} durationInFrames={hook.duration}>
        <SceneShift duration={hook.duration} enter={hook.enter} exit={hook.exit}>
          <Hook layout={layout} />
        </SceneShift>
      </Sequence>
      <Sequence from={wall.from} durationInFrames={wall.duration}>
        <SceneShift duration={wall.duration} enter={wall.enter} exit={wall.exit}>
          <Wall layout={layout} />
        </SceneShift>
      </Sequence>
      <Sequence from={projects.from} durationInFrames={projects.duration}>
        <SceneShift duration={projects.duration} enter={projects.enter} exit={projects.exit}>
          <Projects layout={layout} />
        </SceneShift>
      </Sequence>
      <Sequence from={geo.from} durationInFrames={geo.duration}>
        <SceneShift duration={geo.duration} enter={geo.enter} exit={geo.exit}>
          <MapScene layout={layout} />
        </SceneShift>
      </Sequence>
      <Sequence from={hunt.from} durationInFrames={hunt.duration}>
        <SceneShift duration={hunt.duration} enter={hunt.enter} exit={hunt.exit}>
          <Hunt layout={layout} />
        </SceneShift>
      </Sequence>
      <Sequence from={close.from} durationInFrames={close.duration}>
        <SceneShift duration={close.duration} enter={close.enter} exit={close.exit}>
          <Close layout={layout} />
        </SceneShift>
      </Sequence>
    </AbsoluteFill>
  );
}
