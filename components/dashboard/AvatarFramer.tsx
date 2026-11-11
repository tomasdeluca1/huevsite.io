"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import {
  AVATAR_ZOOM_MAX,
  DEFAULT_AVATAR_FOCUS,
  avatarFocusStyle,
  isDefaultAvatarFocus,
  normalizeAvatarFocus,
  type AvatarFocus,
} from "@/lib/avatar-focus";

interface Props {
  src: string;
  value: unknown;
  onChange: (focus: AvatarFocus) => void;
}

const SIZE = 144;

// Encuadre de la foto de perfil: se arrastra la foto dentro del círculo y el slider
// hace zoom. Con flechas del teclado también se mueve (2% por toque).
export function AvatarFramer({ src, value, onChange }: Props) {
  const t = useTranslations("dashboard");
  const focus = normalizeAvatarFocus(value);
  const drag = useRef<{ px: number; py: number; start: AvatarFocus } | null>(null);
  const [dragging, setDragging] = useState(false);

  const move = (dxPct: number, dyPct: number, from: AvatarFocus = focus) => {
    const round = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
    onChange({ ...from, x: round(from.x + dxPct), y: round(from.y + dyPct) });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, start: focus };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    // Arrastrar la foto a la derecha muestra más de su lado izquierdo: el foco baja.
    const factor = 100 / SIZE / d.start.zoom;
    move(-(e.clientX - d.px) * factor, -(e.clientY - d.py) * factor, d.start);
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 2;
    const keys: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const delta = keys[e.key];
    if (!delta) return;
    e.preventDefault();
    move(delta[0], delta[1]);
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface2)] p-4">
      <div className="section-label !text-[9px]">{t("blockEditor.hero.framingLabel")}</div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={t("blockEditor.hero.framingLabel")}
        aria-valuetext={`${Math.round(focus.x)}% ${Math.round(focus.y)}%`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className={`relative overflow-hidden rounded-full border-2 border-white/20 bg-black/40 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ width: SIZE, height: SIZE }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full object-cover"
          style={avatarFocusStyle(focus)}
        />
      </div>
      <div className="flex w-full max-w-[220px] items-center gap-3">
        <span className="font-mono text-[10px] uppercase text-[var(--text-muted)]">{t("blockEditor.hero.zoomLabel")}</span>
        <input
          type="range"
          min={1}
          max={AVATAR_ZOOM_MAX}
          step={0.05}
          value={focus.zoom}
          onChange={(e) => onChange({ ...focus, zoom: Number(e.target.value) })}
          className="flex-1 accent-[var(--accent)]"
          aria-label={t("blockEditor.hero.zoomLabel")}
        />
      </div>
      <div className="flex items-center gap-3">
        <p className="font-mono text-[10px] text-[var(--text-muted)]">{t("blockEditor.hero.framingHint")}</p>
        {!isDefaultAvatarFocus(focus) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_AVATAR_FOCUS)}
            className="flex items-center gap-1 font-mono text-[10px] uppercase text-[var(--text-dim)] hover:text-white"
          >
            <RotateCcw size={11} /> {t("blockEditor.hero.framingReset")}
          </button>
        )}
      </div>
    </div>
  );
}
