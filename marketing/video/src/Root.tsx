import { Composition } from "remotion";
import { Film } from "./Film";
import { DURATION, FPS } from "./timing";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="Vertical"
        component={Film}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ layout: "vertical" as const }}
      />
      <Composition
        id="Landscape"
        component={Film}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ layout: "landscape" as const }}
      />
    </>
  );
}
