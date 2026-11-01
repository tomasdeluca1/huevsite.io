export const FPS = 30;
export const DURATION = 45 * FPS;

export const SCENES = {
  hook: { from: 0, dur: 150 },
  wall: { from: 150, dur: 330 },
  projects: { from: 480, dur: 300 },
  geo: { from: 780, dur: 210 },
  hunt: { from: 990, dur: 180 },
  close: { from: 1170, dur: 180 },
} as const;

export type Layout = "vertical" | "landscape";
