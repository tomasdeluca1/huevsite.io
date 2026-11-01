import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ACCENT, BG } from "./brand";

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

/** Hard editorial wipe: a black plate leaves to the right with a 3px lime edge. */
export function Reveal({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const p = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {children}
      {p < 1 ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${p * width}px)`, background: BG }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ACCENT }} />
        </div>
      ) : null}
    </div>
  );
}
