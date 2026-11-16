"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WallBuilder } from "@/lib/community-wall";

type Slot = { x: number; y: number; d: number };

interface Props {
  builders: WallBuilder[];
  /** El texto, el reservador de usuario y los botones, al centro del óvalo. */
  children: ReactNode;
  onBuilderClick?: (username: string) => void;
}

// Posiciones en grilla hexagonal alrededor del centro, sin pisar el óvalo del
// texto, de la más cercana a la más lejana: el builder más activo queda pegado
// al titular.
function hexSlots(count: number, step: number, rx: number, ry: number): Slot[] {
  const slots: Slot[] = [];
  const reach = Math.ceil(Math.sqrt(count) * 1.6) + 4;
  for (let row = -reach; row <= reach; row++) {
    for (let col = -reach; col <= reach; col++) {
      const x = (col + (row & 1 ? 0.5 : 0)) * step;
      const y = row * step * 0.88;
      const d = (x / rx) ** 2 + (y / ry) ** 2;
      if (d >= 1) slots.push({ x, y, d });
    }
  }
  return slots.sort((a, b) => a.d - b.d).slice(0, count);
}

function layoutFor(width: number) {
  if (width < 640) return { size: 46, gap: 8, rx: 150, ry: 200 };
  if (width < 1024) return { size: 62, gap: 12, rx: 300, ry: 230 };
  return { size: 74, gap: 14, rx: 400, ry: 220 };
}

// El hero de la home: la comunidad entera alrededor del titular, como la imagen
// al compartir. Al scrollear el muro se aleja y aparecen más caras. Hover (o
// primer toque en el celular) muestra quién es; el click lleva a su perfil.
export function CommunityWallHero({ builders, children, onBuilderClick }: Props) {
  const t = useTranslations("landing");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const wallRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<{ size: number; rx: number; ry: number; slots: Slot[] } | null>(null);
  const [hover, setHover] = useState<{ b: WallBuilder; rect: DOMRect } | null>(null);
  const [touched, setTouched] = useState<string | null>(null);
  const coarseRef = useRef(false);

  // Las posiciones dependen del ancho de la ventana: se calculan en el cliente
  // (el servidor manda el texto y el óvalo, que es lo que importa para SEO).
  useEffect(() => {
    coarseRef.current = window.matchMedia("(pointer: coarse)").matches;
    const compute = () => {
      const { size, gap, rx, ry } = layoutFor(window.innerWidth);
      setLayout({ size, rx, ry, slots: hexSlots(builders.length, size + gap, rx, ry) });
    };
    compute();
    let timer: number | undefined;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(compute, 150); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); window.clearTimeout(timer); };
  }, [builders.length]);

  // Progreso del scroll dentro del hero (0 arriba, 1 al soltar el sticky). Se
  // escribe como variable CSS para no re-renderizar en cada frame.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wall = wallRef.current;
    const wrap = wrapRef.current;
    if (!wall || !wrap) return;
    if (reduce) { wall.style.setProperty("--p", "1"); return; }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = wrap.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
      wall.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, [layout]);

  useEffect(() => {
    if (!hover) return;
    const close = () => { setHover(null); setTouched(null); };
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [hover]);

  const show = useCallback((b: WallBuilder, el: HTMLElement) => setHover({ b, rect: el.getBoundingClientRect() }), []);

  const card = hover ? (() => {
    const w = 280;
    const h = 196;
    const x = Math.max(12, Math.min(window.innerWidth - w - 12, hover.rect.left + hover.rect.width / 2 - w / 2));
    const above = hover.rect.top - h - 12;
    const y = above > 12 ? above : hover.rect.bottom + 12;
    const { b } = hover;
    return (
      <div role="tooltip" className="pointer-events-none fixed z-[120] w-[280px] rounded-[22px] border border-white/10 bg-[#111112]/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl" style={{ left: x, top: y }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.image} alt="" width={52} height={52} className="h-[52px] w-[52px] shrink-0 rounded-full border-2 border-[var(--accent)] object-cover" />
          <div className="min-w-0">
            <div className="truncate text-[16px] font-extrabold tracking-tight text-white">{b.name}</div>
            <div className="truncate font-mono text-[11.5px] text-[var(--accent)]">@{b.username}</div>
          </div>
        </div>
        {b.tagline && <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-snug text-[var(--text-dim)]">{b.tagline}</p>}
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-2.5">
          <span className="text-[13px] font-bold text-white">{t("wallViewProfile")} →</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            {t("wallScore", { score: b.score })} · {t("wallProjects", { n: b.projects })}
          </span>
        </div>
      </div>
    );
  })() : null;

  return (
    <section ref={wrapRef} className="community-wall relative h-[190vh] md:h-[210vh]" aria-label={t("wallLabel")}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={wallRef} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ ["--p" as string]: "0", transform: "scale(calc(1.42 - 0.42 * var(--p)))" }}>
          {layout && builders.map((b, i) => {
            const s = layout.slots[i];
            if (!s) return null;
            const far = Math.min(1, (s.d - 1) / 6).toFixed(3);
            return (
              <Link
                key={b.username}
                href={`/${b.username}`}
                prefetch={false}
                aria-label={`${b.name}, @${b.username}`}
                onMouseEnter={(e) => { if (!coarseRef.current) show(b, e.currentTarget); }}
                onMouseLeave={() => { if (!coarseRef.current) setHover(null); }}
                onFocus={(e) => show(b, e.currentTarget)}
                onBlur={() => setHover(null)}
                onClick={(e) => {
                  if (coarseRef.current && touched !== b.username) {
                    e.preventDefault();
                    setTouched(b.username);
                    show(b, e.currentTarget);
                    return;
                  }
                  onBuilderClick?.(b.username);
                }}
                className={`wall-bubble absolute block overflow-hidden rounded-full border-2 bg-[#141416] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:z-10 hover:scale-[1.18] hover:border-[var(--accent)] hover:shadow-[0_0_0_4px_rgba(200,255,0,0.18),0_10px_30px_rgba(0,0,0,0.6)] focus-visible:z-10 focus-visible:scale-[1.18] focus-visible:border-[var(--accent)] focus-visible:outline-none ${touched === b.username ? "z-10 scale-[1.18] border-[var(--accent)]" : "border-white/[0.08]"}`}
                style={{
                  left: s.x - layout.size / 2,
                  top: s.y - layout.size / 2,
                  width: layout.size,
                  height: layout.size,
                  opacity: `clamp(0.15, calc(0.95 - ${far} * (1 - var(--p)) * 0.9), 1)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt="" width={layout.size} height={layout.size} loading={i < 60 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
                {b.active && <span className="absolute bottom-[8%] right-[8%] h-[18%] w-[18%] rounded-full border-2 border-[#050505] bg-[#00FF88]" />}
              </Link>
            );
          })}
        </div>

        {/* El óvalo negro del centro, donde vive el texto */}
        {layout && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-[4] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#050505]"
            style={{ width: layout.rx * 2 - layout.size * 0.5, height: layout.ry * 2 - layout.size * 0.5, boxShadow: "0 0 80px 50px #050505" }}
          />
        )}

        {/* Degradé abajo: el muro se funde con la sección que sigue en vez de cortarse */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[32svh] bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[5] flex w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5 text-center [&>*]:pointer-events-auto">
          {children}
        </div>
      </div>
      {card}
    </section>
  );
}
