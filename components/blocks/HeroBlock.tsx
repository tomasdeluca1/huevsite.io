"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BadgeCheck, Trophy } from "lucide-react";
import { HeroBlockData, ProfileBadge, getContrastColor } from "@/lib/profile-types";
import { useBlockPreview } from "@/lib/block-preview-context";
import { BadgeItem } from "@/components/profile/BadgeItem";

interface Props {
  data: HeroBlockData;
  accentColor: string;
  subscriptionTier?: "free" | "pro";
  isWinner?: boolean;
  badges?: ProfileBadge[];
  username?: string;
  winnerWeek?: string | null;
}

export function HeroBlock({ data, accentColor, subscriptionTier, isWinner = false, badges = [], username, winnerWeek }: Props) {
  const isPreview = useBlockPreview();
  const t = useTranslations('blocks');
  const roles = data.roles || [];
  const name = data.name || t('hero.fallbackName');
  const tagline = data.tagline || t('hero.fallbackTagline');
  const status = data.status || "";
  const location = data.location || "";
  const avatarUrl = data.avatarUrl || "";
  const rowSpan = (data as any).row_span || 2;
  const showBio = data.showBio !== false && !!data.description;

  // Bio en celular: 2 líneas + "ver más" que expande en el lugar. El botón solo aparece si
  // el texto realmente se recorta; en md+ no hay recorte, así que el botón queda oculto por CSS.
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioOverflows, setBioOverflows] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = bioRef.current;
    if (!el || bioExpanded) return;
    const measure = () => setBioOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [data.description, bioExpanded, showBio]);

  if (isPreview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="huevsite-block block-hero h-full flex flex-col overflow-hidden p-4 text-left"
        style={{ '--accent': accentColor } as any}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 relative">
            <div className="absolute inset-0 rounded-full blur-md opacity-40" style={{ backgroundColor: accentColor }} />
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-black overflow-hidden relative z-10 border"
              style={{
                background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}, #00FF88)`,
                borderColor: `${accentColor}60`,
                color: getContrastColor(accentColor),
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center min-w-0 text-left ml-2 mt-4">
            <h1 className="!text-[28px] font-black !tracking-wide text-white truncate !mb-3">{name}</h1>
            <p className="text-[11px] font-mono opacity-70 truncate !pt-0 !mt-0" style={{ color: accentColor }}>
              {tagline}
            </p>
          </div>
        </div>
        {(status || location) && (
          <div className="mt-3 flex flex-wrap gap-1">
            {status && (
              <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-dim)] border border-[var(--accent-mid)] truncate max-w-full" style={{ color: accentColor }}>
                <div className="w-1 h-1 rounded-full bg-current shrink-0" />
                <span className="truncate">{status}</span>
              </span>
            )}
            {location && (
              <span className="bg-white/5 border border-white/10 text-[var(--text-muted)] text-[9px] font-bold px-2 py-0.5 rounded-full truncate max-w-full">
                {location}
              </span>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="huevsite-block block-hero h-full flex flex-col group overflow-hidden p-4 md:p-8"
      style={{
        '--accent': accentColor,
      } as any}
    >
      <div className="flex flex-col h-full w-full">
        {/* ROW 1: Imagen y Nombre */}
        <div className="flex flex-row items-center md:items-start gap-3 md:gap-5">
          <div className="shrink-0 relative">
            <div
              className={`absolute inset-0 rounded-full blur-xl transition-opacity ${isWinner ? 'opacity-40 animate-pulse' : 'opacity-30 group-hover:opacity-50'}`}
              style={{ backgroundColor: accentColor }}
            />
            <div
              className={`hero-avatar w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 border-2 shadow-xl rounded-full flex items-center justify-center font-black overflow-hidden relative z-10 ${isWinner ? 'border-[var(--accent)]' : 'border-white/10'}`}
              style={{
                background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}, #00FF88)`,
                color: getContrastColor(accentColor)
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg md:text-xl lg:text-2xl">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {/* Status dot */}
            <div className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full border-2 border-[#121212] bg-[#00FF88] z-20 shadow-lg" />
          </div>

          <div className="flex flex-col min-w-0 pt-0 px-0 md:px-1">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight break-words flex flex-wrap items-center gap-2">
              {name}
              {isWinner && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="shrink-0"
                  title={t('hero.builderOfWeek')}
                >
                  <Trophy size={18} className="text-[var(--accent)] drop-shadow-[0_0_8px_rgba(200,255,0,0.5)] md:w-6 md:h-6" />
                </motion.div>
              )}
              {subscriptionTier === "pro" && (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="shrink-0"
                  title={t('hero.builderPro')}
                >
                  <BadgeCheck size={20} className="md:w-6 md:h-6" style={{ color: accentColor }} />
                </motion.span>
              )}
            </h1>
            {/* TAGLINE: Justo debajo del nombre */}
            <p className="mt-1 text-xs md:text-sm lg:text-base text-[var(--accent)] font-mono opacity-80 break-words leading-snug">
              {tagline}
            </p>
          </div>
        </div>

        {/* ROW 2: Descripción (con un espacio según el diagrama) */}
        <div className="mt-3 md:mt-6 flex-1 min-w-0">
          {badges.length > 0 && (
            <div className="mb-2 md:mb-4 flex items-end gap-3">
              {badges.map((badge) => (
                <BadgeItem key={badge.key} badge={badge} earned size="sm" />
              ))}
            </div>
          )}
          {showBio && (
            <>
              <p
                ref={bioRef}
                className={`text-sm md:text-base text-[var(--text-dim)] leading-relaxed break-words font-medium ${
                  bioExpanded ? "" : "line-clamp-2 md:line-clamp-none"
                }`}
              >
                {data.description}
              </p>
              {(bioOverflows || bioExpanded) && (
                <button
                  type="button"
                  onClick={() => setBioExpanded((v) => !v)}
                  aria-expanded={bioExpanded}
                  className="md:hidden mt-1 text-xs font-bold text-[var(--accent)]"
                >
                  {bioExpanded ? t("hero.bioLess") : t("hero.bioMore")}
                </button>
              )}
            </>
          )}
        </div>

        {/* ROW 3: Estado y Lugar */}
        <div className="mt-3 md:mt-6 flex flex-wrap gap-1.5 md:gap-2 pt-3 md:pt-4 border-t border-white/5">
          {status && (
            <span className="tag accent flex items-center gap-1.5 bg-[var(--accent-dim)] border border-[var(--accent-mid)] text-[var(--accent)] text-[9px] md:text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full max-w-full md:whitespace-nowrap">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {status}
            </span>
          )}
          {location && (
            <span className="tag bg-white/5 border border-white/10 text-[var(--text-muted)] text-[9px] md:text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full max-w-full md:whitespace-nowrap">
              {location}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
