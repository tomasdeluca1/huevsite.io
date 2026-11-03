export const FPS = 30;
export const DURATION = 36 * FPS;

/** Overlap so the next section can slide up over the previous one. Total stays 45s. */
export const SLIDE_FRAMES = 18;

export const SCENES = {
  hook: { from: 0, dur: 150 },
  wall: { from: 150, dur: 330 },
  projects: { from: 480, dur: 300 },
  geo: { from: 780, dur: 210 },
  hunt: { from: 990, dur: 180 },
  close: { from: 1170, dur: 180 },
} as const;

export function withSlide(
  from: number,
  dur: number,
  edge: { enter: boolean; exit: boolean },
) {
  const start = edge.enter ? from - SLIDE_FRAMES : from;
  const end = from + dur;
  return { from: start, duration: end - start, enter: edge.enter, exit: edge.exit };
}

export type Layout = "vertical" | "landscape";
