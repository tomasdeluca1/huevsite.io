"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Trophy, Globe } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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


export function WinnerSection({ initialData, user }: WinnerSectionProps) {
  const t = useTranslations("landing");
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);
  const [frameHeight, setFrameHeight] = useState<number>(700);

  // Refs for offscreen measurement
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [measureWidth, setMeasureWidth] = useState<number>(920);

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
      // Update measurement width to match actual container
      if (containerRef.current) {
        setMeasureWidth(containerRef.current.offsetWidth);
      }

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
      setTimeout(measure, 200);
    });

    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [profilesToShow.length, mounted]);

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
    if (!isMultiple || isPaused) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [isMultiple, next, isPaused]);

  if (loading || !data || profilesToShow.length === 0) return null;

  const currentProfile = profilesToShow[currentIndex];
  if (!currentProfile) return null;

  const titleText = isWinners
    ? profilesToShow.length === 1
      ? t("winnerTitleSingle")
      : t("winnerTitlePlural")
    : t("winnerTitleCommunity");

  const descText = isWinners
    ? profilesToShow.length === 1
      ? t("winnerDescSingle", { name: currentProfile.name ?? currentProfile.username, week: data.week })
      : t("winnerDescPlural", { count: profilesToShow.length, week: data.week })
    : t("winnerDescCommunity");

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
          width: `${measureWidth}px`,
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
              {/* Medición oculta de ecosistema por si cambia el alto */}
              {profile.sub_sites && profile.sub_sites.length > 0 && (
                <div className="mt-8 md:mt-12 backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-5 sm:p-6 pb-20">
                  <div className="h-10"></div>
                </div>
              )}
            </div>
        ))}
      </div>

      {/* Carousel wrapper */}
      <div className="relative max-w-5xl mx-auto px-0 md:px-4">

        {/* Browser frame — height driven by the tallest board */}
        <div
          ref={containerRef}
          className="demo-browser flex flex-col w-full !border-x-0 md:!border-x !rounded-none md:!rounded-[var(--radius-xl)] overflow-hidden"
          style={{ height: `${frameHeight}px`, minHeight: 480, maxHeight: 1400 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
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
                    aria-label={t("winnerGoToWinner", { index: i + 1 })}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Board content — all boards rendered, non-current are hidden with opacity */}
          <div className="flex-1 min-h-0 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProfile.id || currentIndex}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-y-auto"
              >
                <div className="winner-showcase-grid w-full p-4 md:p-6 overflow-hidden">
                  <ProfileGrid
                    blocks={currentProfile.blocks}
                    accentColor={currentProfile.accent_color}
                    displayName={currentProfile.name || currentProfile.username}
                    tagline={currentProfile.tagline || undefined}
                    subSites={currentProfile.sub_sites}
                    username={currentProfile.username}
                  />

                  {currentProfile.sub_sites && currentProfile.sub_sites.length > 0 && !currentProfile.blocks.some((b: any) => b.type === 'ecosystem' && b.visible) && (
                    <div className="mt-8 md:mt-12 backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-5 sm:p-6 overflow-hidden relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-5 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <Globe size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                          </div>
                          <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] group-hover:text-white transition-colors">{t("winnerEcosystem")}</h3>
                        </div>
                        <div className="text-[9px] text-[var(--text-dim)] font-mono uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">
                          {currentProfile.sub_sites.length} {currentProfile.sub_sites.length === 1 ? t("winnerProjectSingle") : t("winnerProjectPlural")}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 relative z-10 pb-6">
                        {currentProfile.sub_sites.map((site: any) => (
                          <Link
                            key={site.id}
                            href={`/${currentProfile.username}/${site.slug}`}
                            target="_blank"
                            className="group/item flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/[0.08] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 hover:shadow-[0_8px_32px_-12px_var(--accent-dim)] transition-all duration-300 text-left relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/20 blur-[30px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                            
                            {site.avatarUrl ? (
                              <img src={site.avatarUrl} alt={site.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-black border border-white/10 shadow-sm relative z-10" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-wider relative z-10 shadow-sm">
                                {site.title.substring(0, 2)}
                              </div>
                            )}

                            <div className="flex flex-col min-w-0 flex-1 relative z-10 justify-center h-full">
                              <span className="text-[13px] font-bold text-white group-hover/item:text-[var(--accent)] transition-colors truncate w-full leading-tight mb-1">
                                {site.title}
                              </span>
                              {site.description && (
                                <span className="text-[10px] text-[var(--text-muted)] truncate w-full group-hover/item:text-[var(--text-dim)] transition-colors leading-tight block">
                                  {site.description}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

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
              aria-label={t("winnerPrev")}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-6 top-16 z-20 w-10 h-10 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/90 hover:border-white/25 transition-all backdrop-blur-sm shadow-lg"
              aria-label={t("winnerNext")}
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
              {t("winnerCtaTitle")}
            </h3>
            <p className="text-[var(--text-dim)] text-[15px] md:text-base leading-relaxed">
              {t("winnerCtaDesc")}
            </p>
          </div>

          <div className="relative z-10 flex flex-col w-full lg:w-auto items-center lg:items-end shrink-0 bg-black/40 p-6 rounded-xl border border-white/5">
            <div className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
              {t("winnerCountdownLabel")}
            </div>

            <div className="flex gap-4 sm:gap-6 font-mono text-3xl sm:text-4xl font-bold mb-6">
              {[
                { val: timeLeft.d, label: t("winnerCountdownDays") },
                { val: timeLeft.h, label: t("winnerCountdownHours") },
                { val: timeLeft.m, label: t("winnerCountdownMinutes") },
                { val: timeLeft.s, label: t("winnerCountdownSeconds") },
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
              {user ? t("winnerCtaButtonUser") : t("winnerCtaButtonGuest")}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
