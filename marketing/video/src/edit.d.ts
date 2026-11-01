export const FPS: number;
export const DURATION: number;
export const SHOTS: Shot[];
export const SOUNDS: SoundCue[];
export function shotAt(frame: number): Shot;

export type Shot = {
  kind: string;
  dur: number;
  from: number;
  sound: string | null;
  text?: string;
  accent?: boolean;
  index?: number;
  row?: number;
  fast?: boolean;
  ramp?: "in" | "out";
  phase?: number;
};

export type SoundCue = {
  frame: number;
  type: string;
  gain: number;
  variant: number;
};
