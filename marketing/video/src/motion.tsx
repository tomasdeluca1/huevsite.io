import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SLIDE_FRAMES } from "./timing";

export const EASE = Easing.bezier(0.65, 0, 0.35, 1);

export function useRise(delay = 0, distance = 28) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - delay;
  const t = local <= 0 ? 0 : spring({ frame: local, fps, config: { damping: 16, stiffness: 130, mass: 0.7 } });
  return {
    opacity: local <= 0 ? 0 : interpolate(t, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(t, [0, 1], [distance, 0])}px)`,
  };
}

/**
 * Section change: the incoming frame slides up and settles from a short zoom.
 * The outgoing frame lifts with it. No glow, no dissolve to black.
 */
export function SceneShift({
  children,
  duration,
  enter = true,
  exit = true,
}: {
  children: React.ReactNode;
  duration: number;
  enter?: boolean;
  exit?: boolean;
}) {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const enterP = enter
    ? interpolate(frame, [0, SLIDE_FRAMES], [0, 1], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const exitStart = Math.max(SLIDE_FRAMES, duration - SLIDE_FRAMES);
  const exitP = exit
    ? interpolate(frame, [exitStart, duration], [0, 1], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const travel = height;
  const y = interpolate(enterP, [0, 1], [travel, 0]) + interpolate(exitP, [0, 1], [0, -travel]);
  const scale = interpolate(enterP, [0, 1], [enter ? 1.035 : 1, 1]) * interpolate(exitP, [0, 1], [1, exit ? 0.985 : 1]);

  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${y}px) scale(${scale})`, transformOrigin: "center center" }}>
      {children}
    </div>
  );
}
