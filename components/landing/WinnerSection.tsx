"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { ProfileGrid } from "@/components/profile/ProfileGrid";

interface ShowcaseData {
  week: string;
  winners: any[];
  finalists: any[];
  randoms?: any[];
}

interface WinnerSectionProps {
  initialData?: ShowcaseData | null;
  user?: any;
}

// Width of the showcase frame in px — matches max-w-5xl content width minus 48px padding (p-6 on each side)
const FRAME_MEASURE_WIDTH = 920;

export function WinnerSection({ initialData, user }: WinnerSectionProps) {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);
  const [frameHeight, setFrameHeight] = useState<number>(700);

  // Refs for offscreen measurement
  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const d = new Date();
      d.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      d.setHours(0, 0, 0, 0);
      const diff = d.getTime() - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60),
        });
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const transformUser = (rawUser: any) => {
    if (!rawUser) return null;
    const transformedBlocks = (rawUser.blocks || []).map((block: any) => {
      const { id, type, order, col_span, row_span, visible, ...cleanData } = block.data || {};
      return {
        id: block.id,
        type: block.type,
        order: block.order,
        col_span: block.col_span || col_span || 1,
        row_span: block.row_span || row_span || 1,
        visible: block.visible,
        ...cleanData,
      };
    });
    return { ...rawUser, blocks: transformedBlocks };
  };

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }
    fetch("/api/social/showcase")
      .then((r) => r.json())
      .then((res) => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initialData]);

  const profilesToShow: any[] = (() => {
    if (!data) return [];
    if (data.winners && data.winners.length > 0) {
      return data.winners.map((w) => transformUser(w.user)).filter(Boolean);
    }
    if (data.randoms && data.randoms.length > 0) {
      return data.randoms.map((r) => transformUser(r)).filter(Boolean);
    }
    return [];
  })();

  // After offscreen boards are rendered, measure the tallest one
  useLayoutEffect(() => {
    if (profilesToShow.length === 0) return;

    const measure = () => {
      const heights = measureRefs.current
        .filter(Boolean)
        .map((el) => el!.scrollHeight);

      if (heights.length > 0) {
        const maxH = Math.max(...heights);
        if (maxH > 100) {
          setFrameHeight(maxH + 48); // +48 for padding inside profile-page
        }
      }
    };

    // Give one frame for the DOM to settle, then measure
    const raf = requestAnimationFrame(() => {
      setTimeout(measure, 100);
    });

    return () => cancelAnimationFrame(raf);
  }, [profilesToShow.length]);

  const isWinners = !!(data?.winners && data.winners.length > 0);
  const isMultiple = profilesToShow.length > 1;

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(idx);
  }, []);

  const next = useCallback(() => {
    if (!isMultiple) return;
    setCurrentIndex((prev) => (prev + 1) % profilesToShow.length);
  }, [isMultiple, profilesToShow.length]);

  const prev = useCallback(() => {
    if (!isMultiple) return;
    setCurrentIndex((prev) => (prev - 1 + profilesToShow.length) % profilesToShow.length);
  }, [isMultiple, profilesToShow.length]);

  // Auto-advance
  useEffect(() => {
    if (!isMultiple) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [isMultiple, next]);

  if (loading || !data || profilesToShow.length === 0) return null;

  const currentProfile = profilesToShow[currentIndex];
  if (!currentProfile) return null;

  const titleText = isWinners
    ? profilesToShow.length === 1
      ? "builder de la semana"
      : "builders de la semana"
    : "descubrí la comunidad";

  const descText = isWinners
    ? profilesToShow.length === 1
      ? `Conocé a ${currentProfile.name ?? currentProfile.username}, el builder más nominado de la semana pasada (${data.week}).`
      : `${profilesToShow.length} builders empataron como los más nominados de la semana pasada (${data.week}).`
    : "Conocé a los creadores de todo LATAM que están buildeando cosas increíbles hoy mismo.";

  const slideVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <section className="demo-section !mt-20">
      {/* Header */}
      <div className="flex flex-col items-center mb-12 text-center px-6">
        <p className="demo-label">// {titleText}</p>
        <p className="text-[var(--text-dim)] max-w-lg mx-auto leading-relaxed">
          {descText}
        </p>
      </div>

      {/*
        Offscreen measurement container.
        Rendered at the same width as the actual frame, invisible, outside viewport.
        We measure each board's scrollHeight to find the tallest.
      */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: `${FRAME_MEASURE_WIDTH}px`,
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {profilesToShow.map((profile, i) => (
          <div
            key={profile.id || i}
            ref={(el) => { measureRefs.current[i] = el; }}
            className="winner-showcase-grid w-full"
            style={{ padding: "24px" }}
          >
            <ProfileGrid
              blocks={profile.blocks}
              accentColor={profile.accent_color}
              displayName={profile.name || profile.username}
              tagline={profile.tagline || undefined}
            />
          </div>
        ))}
      </div>

      {/* Carousel wrapper */}
      <div className="relative max-w-5xl mx-auto px-0 md:px-4">

        {/* Browser frame — height driven by the tallest board */}
        <div
          className="demo-browser flex flex-col w-full !border-x-0 md:!border-x !rounded-none md:!rounded-[var(--radius-xl)] overflow-hidden"
          style={{ height: `${frameHeight}px`, minHeight: 480, maxHeight: 1400 }}
        >
          {/* Browser bar */}
          <div className="browser-bar shrink-0">
            <div className="browser-dots">
              <span className="bd1"></span>
              <span className="bd2"></span>
              <span className="bd3"></span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentProfile.username}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex justify-center"
              >
                <Link
                  href={`/${currentProfile.username}`}
                  target="_blank"
                  className="browser-url group flex items-center justify-center gap-1 hover:text-white transition-colors"
                >
                  huevsite.io/<span>{currentProfile.username}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Nav dots */}
            {isMultiple && (
              <div className="flex items-center gap-1.5 mr-2">
                {profilesToShow.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex
                      ? "bg-[var(--accent)] w-3"
                      : "bg-white/20 hover:bg-white/40 w-1.5"
                      }`}
                    aria-label={`Ir al ganador ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Board content — all boards rendered, non-current are hidden with opacity */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProfile.id || currentIndex}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide"
              >
                <div className="winner-showcase-grid w-full p-6 overflow-hidden">
                  <ProfileGrid
                    blocks={currentProfile.blocks}
                    accentColor={currentProfile.accent_color}
                    displayName={currentProfile.name || currentProfile.username}
                    tagline={currentProfile.tagline || undefined}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Arrow navigation — centered on the frame, outside scroll */}
        {isMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-6 top-16 z-20 w-10 h-10 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/90 hover:border-white/25 transition-all backdrop-blur-sm shadow-lg"
              aria-label="Anterior"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-6 top-16 z-20 w-10 h-10 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/90 hover:border-white/25 transition-all backdrop-blur-sm shadow-lg"
              aria-label="Siguiente"
            >
              <ArrowRight size={18} />
            </button>
          </>
        )}

        {/* Counter */}
        {isMultiple && (
          <div className="flex justify-center mt-4">
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {currentIndex + 1} / {profilesToShow.length}
            </span>
          </div>
        )}
      </div>

      {/* CTA / Countdown */}
      {mounted && (
        <div className="mt-16 mx-4 md:mx-auto max-w-[1400px] bg-white/[0.02] border border-[var(--border-bright)] rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-dim)] to-transparent opacity-20 pointer-events-none"></div>

          <div className="relative z-10 text-center lg:text-left flex-1 max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight flex items-center justify-center lg:justify-start gap-3">
              <Trophy size={28} className="text-[var(--accent)]" />
              Vos podés ser el próximo.
            </h3>
            <p className="text-[var(--text-dim)] text-[15px] md:text-base leading-relaxed">
              Armá tu perfil, mostrá lo que sabés hacer y pedile a tus contactos que te nominen. Cada domingo a la medianoche los builders más nominados por la comunidad pasan a la portada toda la semana.
            </p>
          </div>

          <div className="relative z-10 flex flex-col w-full lg:w-auto items-center lg:items-end shrink-0 bg-black/40 p-6 rounded-xl border border-white/5">
            <div className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
              Cierre de esta edición
            </div>

            <div className="flex gap-4 sm:gap-6 font-mono text-3xl sm:text-4xl font-bold mb-6">
              {[
                { val: timeLeft.d, label: "Días" },
                { val: timeLeft.h, label: "Hrs" },
                { val: timeLeft.m, label: "Min" },
                { val: timeLeft.s, label: "Seg" },
              ].map(({ val, label }, i) => (
                <div key={label} className="flex flex-col items-center">
                  <span className={i === 3 ? "text-[var(--text-dim)]" : ""}>
                    {val.toString().padStart(2, "0")}
                  </span>
                  <span className="text-[10px] !font-sans text-[var(--text-muted)] font-normal uppercase tracking-wider mt-2">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href={user ? "/dashboard" : "/login"}
              className="w-full px-6 py-3 bg-[var(--surface2)] hover:bg-[var(--border-bright)] border border-[var(--border-bright)] rounded-lg text-[14px] font-bold transition-all text-white text-center whitespace-nowrap hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(200,255,0,0.1)]"
            >
              {user ? "Ir a mi dashboard →" : "Subir mi perfil ahora →"}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
