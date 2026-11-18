"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { LandingTestimonial } from "@/lib/testimonial-service";

const ROTATE_MS = 6500;

function Face({ t, size, className = "" }: { t: LandingTestimonial; size: number; className?: string }) {
  return t.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={t.avatarUrl} alt="" width={size} height={size} loading="lazy" className={`shrink-0 rounded-full object-cover ${className}`} style={{ width: size, height: size }} />
  ) : (
    <span className={`grid shrink-0 place-items-center rounded-full bg-white/[0.08] font-black text-white/70 ${className}`} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {t.name.charAt(0).toUpperCase()}
    </span>
  );
}

function QuoteCard({ t }: { t: LandingTestimonial }) {
  return (
    <a
      href={`/${t.username}`}
      className="group flex w-[300px] shrink-0 flex-col gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.025] p-5 transition-colors hover:border-[rgba(200,255,0,0.35)] hover:bg-white/[0.04] md:w-[340px]"
    >
      <p className="line-clamp-4 text-[14px] leading-relaxed text-[var(--text-dim)]">{t.quote}</p>
      <span className="mt-auto flex items-center gap-2.5">
        <Face t={t} size={30} />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold text-white group-hover:underline underline-offset-4">{t.name}</span>
          <span className="block truncate font-mono text-[11px] text-[var(--text-muted)]">@{t.username}</span>
        </span>
      </span>
    </a>
  );
}

// "Lo que dicen los builders": una cita grande que va rotando (tocás una cara
// para elegirla) y abajo dos filas que se mueven en sentidos opuestos. Todo
// sale de los testimonios aprobados; nada inventado.
export function TestimonialsWall({ testimonials }: { testimonials: LandingTestimonial[] }) {
  const t = useTranslations("landing");
  // Las citas con más cuerpo van arriba, en grande.
  const featured = useMemo(
    () => [...testimonials].filter((x) => x.quote.length >= 60).sort((a, b) => b.quote.length - a.quote.length).slice(0, 6),
    [testimonials]
  );
  const pool = featured.length > 0 ? featured : testimonials.slice(0, 6);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || pool.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % pool.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, pool.length]);

  const current = pool[active];
  const half = Math.ceil(testimonials.length / 2);
  const rowA = testimonials.slice(0, half);
  const rowB = testimonials.slice(half);

  return (
    <section style={{ padding: "var(--section-y) 0" }} className="overflow-hidden">
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 var(--section-x)" }} className="flex flex-col items-center gap-10">
        <div className="mx-auto max-w-[720px] text-center">
          <div className="section-label" style={{ justifyContent: "center" }}>{t("testimonialsLabelClean")}</div>
          <h2 className="section-title">{t("testimonialsTitle")}</h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="flex">
              {testimonials.slice(0, 8).map((x, i) => (
                <Face key={x.id} t={x} size={30} className={`border-2 border-[#050505] ${i > 0 ? "-ml-2" : ""}`} />
              ))}
            </span>
            <span className="whitespace-nowrap font-mono text-[12px] text-[var(--text-muted)]">{t("testimonialsCount", { n: testimonials.length })}</span>
          </div>
        </div>

        {current && (
          <div
            className="relative w-full max-w-[860px] overflow-hidden rounded-[1.8rem] border border-[rgba(200,255,0,0.25)] bg-[rgba(200,255,0,0.03)] px-6 py-8 md:px-12 md:py-12"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <span aria-hidden className="pointer-events-none absolute right-6 top-2 select-none font-serif font-black leading-none text-[rgba(200,255,0,0.14)] md:right-10" style={{ fontSize: 150, lineHeight: 1 }}>&rdquo;</span>
            <AnimatePresence mode="wait">
              <motion.figure
                key={current.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative flex min-h-[200px] flex-col justify-between gap-7 md:min-h-[180px]"
              >
                <blockquote className="text-xl font-bold leading-snug tracking-tight text-white md:text-[26px]">{current.quote}</blockquote>
                <figcaption>
                  <Link href={`/${current.username}`} className="group inline-flex items-center gap-3">
                    <Face t={current} size={44} className="ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[#0a0a0a]" />
                    <span>
                      <span className="block text-[15px] font-black text-white group-hover:underline underline-offset-4">{current.name}</span>
                      <span className="block font-mono text-[12px] text-[var(--accent)]">@{current.username}</span>
                    </span>
                  </Link>
                </figcaption>
              </motion.figure>
            </AnimatePresence>

            {pool.length > 1 && (
              <div className="relative mt-8 flex items-center gap-2" role="tablist" aria-label={t("testimonialsPick")}>
                {pool.map((x, i) => (
                  <button
                    key={x.id}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={x.name}
                    onClick={() => setActive(i)}
                    className={`rounded-full transition-all ${i === active ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[#0a0a0a]" : "opacity-45 hover:opacity-100"}`}
                  >
                    <Face t={x} size={28} />
                  </button>
                ))}
                <span className="ml-auto hidden h-1 w-24 overflow-hidden rounded-full bg-white/10 sm:block" aria-hidden>
                  <motion.span
                    key={`${current.id}-${paused}`}
                    className="block h-full bg-[var(--accent)]"
                    initial={{ width: "0%" }}
                    animate={{ width: paused ? "0%" : "100%" }}
                    transition={{ duration: paused ? 0 : ROTATE_MS / 1000, ease: "linear" }}
                  />
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {testimonials.length >= 4 && (
        <div className="hv-marquee-wrap relative mt-10 flex flex-col gap-3">
          {[rowA, rowB].map((row, r) => (
            <div key={r} className="hv-marquee-row flex overflow-hidden">
              <div className={`hv-marquee flex shrink-0 gap-3 pr-3 ${r === 1 ? "hv-marquee-reverse" : ""}`} style={{ ["--hv-dur" as string]: `${Math.max(40, row.length * 9)}s` }}>
                {[...row, ...row].map((x, i) => (
                  <div key={`${x.id}-${i}`} aria-hidden={i >= row.length || undefined}>
                    <QuoteCard t={x} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/testimonio" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-mono text-[12px] text-[var(--text-dim)] transition-colors hover:border-[rgba(200,255,0,0.4)] hover:text-[var(--accent)]">
          {t("testimonialsCta")}
        </Link>
      </div>
    </section>
  );
}
