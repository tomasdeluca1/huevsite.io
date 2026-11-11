import type { CSSProperties } from "react";
import { z } from "zod";

// Encuadre de la foto del hero. x/y es el punto de la foto que queda en el centro
// del círculo (0-100, en %), zoom agranda la foto desde ese punto (1 = sin zoom).
// Vive en data.avatarFocus del bloque hero.
export type AvatarFocus = { x: number; y: number; zoom: number };

export const AVATAR_ZOOM_MAX = 3;
export const DEFAULT_AVATAR_FOCUS: AvatarFocus = { x: 50, y: 50, zoom: 1 };

export const avatarFocusSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zoom: z.number().min(1).max(AVATAR_ZOOM_MAX),
});

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normalizeAvatarFocus(value: unknown): AvatarFocus {
  if (!value || typeof value !== "object") return DEFAULT_AVATAR_FOCUS;
  const v = value as Record<string, unknown>;
  return {
    x: clamp(v.x, 0, 100, 50),
    y: clamp(v.y, 0, 100, 50),
    zoom: clamp(v.zoom, 1, AVATAR_ZOOM_MAX, 1),
  };
}

export function isDefaultAvatarFocus(focus: AvatarFocus): boolean {
  return focus.x === 50 && focus.y === 50 && focus.zoom === 1;
}

// Estilo para el <img> con object-fit: cover dentro del círculo.
export function avatarFocusStyle(value: unknown): CSSProperties {
  const focus = normalizeAvatarFocus(value);
  if (isDefaultAvatarFocus(focus)) return {};
  const origin = `${focus.x}% ${focus.y}%`;
  return {
    objectPosition: origin,
    transform: focus.zoom !== 1 ? `scale(${focus.zoom})` : undefined,
    transformOrigin: origin,
  };
}
