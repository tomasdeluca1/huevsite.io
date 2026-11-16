"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { preconnect } from "react-dom";
import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import type { WallBuilder } from "@/lib/community-wall";

type Slot = { x: number; y: number; d: number };
type Layout = { size: number; gap: number; rx: number; ry: number };

// Dos armados fijos: ancho (tablet y escritorio, se escala con CSS) y angosto
// (celular). Al ser fijos, las posiciones salen iguales en el servidor y en el
// cliente: el muro llega en el HTML y se ve en el primer pintado.
const WIDE: Layout = { size: 64, gap: 12, rx: 360, ry: 200 };
const NARROW: Layout = { size: 44, gap: 8, rx: 150, ry: 196 };

// Posiciones en grilla hexagonal alrededor del óvalo del texto, de la más
// cercana a la más lejana. Los Builders de la Semana llegan primero en la
// lista, así que quedan en el anillo de adentro.
function hexSlots(count: number, { size, gap, rx, ry }: Layout): Slot[] {
  const step = size + gap;
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

interface Props {
  builders: WallBuilder[];
  /** El texto, el reservador de usuario y los botones, al centro del óvalo. */
  children: ReactNode;
  onBuilderClick?: (username: string) => void;
}

// El hero de la home: la comunidad entera alrededor del titular, como la imagen
// al compartir. Al scrollear el muro se asienta en su tamaño y el borde se
// aclara. Hover (o primer toque en el celular) muestra quién es; el click lleva
// a su perfil.
export function CommunityWallHero({ builders, children, onBuilderClick }: Props) {
  // Las fotos vienen del proxy: abrir la conexión antes de que el HTML las pida.
  preconnect("https://images.weserv.nl");
  const t = useTranslations("landing");
  const wrapRef = useRef<HTMLElement | null>(null);
  const moversRef = useRef<HTMLDivElement[]>([]);
  const veilRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{ b: WallBuilder; rect: DOMRect } | null>(null);
  const [touched, setTouched] = useState<string | null>(null);
  const coarseRef = useRef(false);

  // Solo se animan dos cosas, las dos en la GPU: la escala del muro y la
  // opacidad del velo del borde. Nada de estilos por burbuja en cada frame.
  useEffect(() => {
    coarseRef.current = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const apply = (p: number) => {
      const scale = 1.12 - 0.12 * p;
      for (const el of moversRef.current) if (el) el.style.transform = `scale(${scale.toFixed(4)})`;
      if (veilRef.current) veilRef.current.style.opacity = (1 - p).toFixed(3);
    };
    if (reduce) { apply(1); return; }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = wrap.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      apply(Math.max(0, Math.min(1, -r.top / Math.max(1, total))));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!hover && !touched) return;
    const close = () => { setHover(null); setTouched(null); };
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [hover, touched]);

  const show = useCallback((b: WallBuilder, el: HTMLElement) => setHover({ b, rect: el.getBoundingClientRect() }), []);

  const wall = (layout: Layout, key: string, index: number, className: string) => {
    const slots = hexSlots(builders.length, layout);
    return (
      <div key={key} className={`absolute left-1/2 top-1/2 h-0 w-0 ${className}`}>
        <div
          ref={(el) => { if (el) moversRef.current[index] = el; }}
          className="absolute left-0 top-0 h-0 w-0 will-change-transform"
          style={{ transform: "scale(1.12)" }}
        >
          {builders.map((b, i) => {
            const s = slots[i];
            if (!s) return null;
            // Las del borde arrancan un poco más apagadas (estático, no se anima).
            const dim = Math.max(0.35, 1 - Math.max(0, s.d - 1) * 0.09);
            const lit = touched === b.username;
            return (
              <Link
                key={b.username}
                href={`/${b.username}`}
                prefetch={false}
                aria-label={b.winner ? `${b.name}, @${b.username}, ${t("wallWinner")}` : `${b.name}, @${b.username}`}
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
                className={`group absolute block rounded-full transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.18] focus-visible:z-10 focus-visible:scale-[1.18] focus-visible:outline-none ${lit ? "z-10 scale-[1.18]" : ""}`}
                style={{ left: s.x - layout.size / 2, top: s.y - layout.size / 2, width: layout.size, height: layout.size, opacity: dim }}
              >
                <span
                  className={`block h-full w-full overflow-hidden rounded-full border-2 bg-[#141416] transition-colors group-hover:border-[var(--accent)] group-focus-visible:border-[var(--accent)] ${b.winner || lit ? "border-[var(--accent)]" : "border-white/[0.08]"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.image}
                    alt=""
                    width={layout.size}
                    height={layout.size}
                    loading={i < 70 ? "eager" : "lazy"}
                    fetchPriority={i < 24 ? "high" : "auto"}
                    decoding="async"
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </span>
                {b.winner ? (
                  <span className="absolute -right-0.5 -top-0.5 grid h-[34%] w-[34%] place-items-center rounded-full border-2 border-[#050505] bg-[var(--accent)] text-[#050505]">
                    <Trophy className="h-[55%] w-[55%]" strokeWidth={2.6} />
                  </span>
                ) : b.active ? (
                  <span className="absolute bottom-[8%] right-[8%] h-[18%] w-[18%] rounded-full border-2 border-[#050505] bg-[#00FF88]" />
                ) : null}
              </Link>
            );
          })}
        </div>
        {/* El óvalo negro del centro, donde vive el texto */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-[4] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#050505]"
          style={{ width: layout.rx * 2 - layout.size * 0.5, height: layout.ry * 2 - layout.size * 0.5, boxShadow: "0 0 70px 44px #050505" }}
        />
      </div>
    );
  };

  const card = hover ? (() => {
    const w = 280;
    const h = hover.b.winner ? 222 : 196;
    const x = Math.max(12, Math.min(window.innerWidth - w - 12, hover.rect.left + hover.rect.width / 2 - w / 2));
    const above = hover.rect.top - h - 12;
    const y = above > 12 ? above : hover.rect.bottom + 12;
    const { b } = hover;
    return (
      <div role="tooltip" className="pointer-events-none fixed z-[120] w-[280px] rounded-[22px] border border-white/10 bg-[#111112]/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl" style={{ left: x, top: y }}>
        {b.winner && (
          <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
            <Trophy size={12} strokeWidth={2.6} /> {t("wallWinner")}
          </div>
        )}
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
    <section ref={wrapRef} className="community-wall relative h-[170vh] md:h-[185vh]" aria-label={t("wallLabel")}>
      {/* El header de arriba es fijo y mide 72px: el escenario ocupa el resto de la pantalla. */}
      <div className="sticky top-[72px] h-[calc(100svh-72px)] overflow-hidden">
        {/* Escritorio y tablet: el armado ancho, achicado en tablet. Celular: el angosto. */}
        {wall(WIDE, "wide", 0, "hidden md:block md:scale-[0.82] lg:scale-100")}
        {wall(NARROW, "narrow", 1, "md:hidden")}

        {/* Velo del borde: arranca puesto y se va al scrollear (solo opacidad) */}
        <div
          ref={veilRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[3] will-change-[opacity]"
          style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(5,5,5,0.7) 100%)" }}
        />

        {/* Degradé abajo: el muro se funde con la sección que sigue */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[30svh] bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[5] flex w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5 text-center [&>*]:pointer-events-auto">
          {children}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[5] flex justify-center">
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0e0e0f]/90 px-3.5 py-1.5 font-mono text-[11.5px] text-[var(--text-dim)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88]" />
            {t("wallShowing", { n: builders.length })}
          </span>
        </div>
      </div>
      {card}
    </section>
  );
}
