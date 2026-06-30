"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { BadgeCheck, Trophy } from "lucide-react";
import { HeroBlockData, ProfileBadge, getContrastColor } from "@/lib/profile-types";
import { weekLabel } from "@/lib/launch-week";
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
  const locale = useLocale();
  // Ever won Builder de la Semana → show the laurel on the board (hover for details).
  const everWonBdls = badges.some((b) => b.key === "builder_of_the_week");
  const bdlsHover = `🏆 ${t('hero.builderOfWeek')}${winnerWeek ? ` · ${weekLabel(winnerWeek, locale)} ${winnerWeek.slice(0, 4)}` : ""}`;
  const roles = data.roles || [];
  const name = data.name || t('hero.fallbackName');
  const tagline = data.tagline || t('hero.fallbackTagline');
  const status = data.status || "";
  const location = data.location || "";
  const avatarUrl = data.avatarUrl || "";
  const rowSpan = (data as any).row_span || 2;

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
      className="huevsite-block block-hero relative h-full flex flex-col group overflow-hidden p-6 md:p-8"
      style={{
        '--accent': accentColor,
      } as any}
    >
      {everWonBdls && (
        <a
          href="/leaderboard"
          title={bdlsHover}
          className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-black/40 px-2.5 py-1.5 backdrop-blur-sm transition-colors hover:border-[var(--accent)]/60"
        >
          <img src="/badge/laurel-dark.png" alt="" className="h-5 w-auto sm:h-6" />
          <div className="flex flex-col leading-tight">
            <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-wide text-[var(--accent)] sm:text-[11px]">
              {t('hero.builderOfWeek')}
            </span>
            {winnerWeek && (
              <span className="text-[9px] font-medium text-white/45">
                {weekLabel(winnerWeek, locale)} {winnerWeek.slice(0, 4)}
              </span>
            )}
          </div>
        </a>
      )}

      <div className="flex flex-col h-full w-full">
        {/* ROW 1: Imagen y Nombre */}
        <div className={`flex flex-col sm:flex-row items-start gap-4 md:gap-5 ${everWonBdls ? "sm:pr-44" : ""}`}>
          <div className="shrink-0 relative">
            <div
              className={`absolute inset-0 rounded-full blur-xl transition-opacity ${isWinner ? 'opacity-40 animate-pulse' : 'opacity-30 group-hover:opacity-50'}`}
              style={{ backgroundColor: accentColor }}
            />
            <div
              className={`hero-avatar w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 border-2 shadow-xl rounded-full flex items-center justify-center font-black overflow-hidden relative z-10 ${isWinner ? 'border-[var(--accent)]' : 'border-white/10'}`}
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
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#121212] bg-[#00FF88] z-20 shadow-lg" />
          </div>

          <div className="flex flex-col min-w-0 pt-0 px-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight break-all sm:break-words flex flex-wrap items-center gap-2">
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
        <div className="mt-6 flex-1 min-w-0">
          {badges.length > 0 && (
            <div className="mb-4 flex items-end gap-3">
              {badges.map((badge) => (
                <BadgeItem key={badge.key} badge={badge} earned size="sm" />
              ))}
            </div>
          )}
          {data.description && (
            <p className="text-sm md:text-base text-[var(--text-dim)] leading-relaxed break-words font-medium">
              {data.description}
            </p>
          )}
        </div>

        {/* ROW 3: Estado y Lugar */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/5">
          {status && (
            <span className="tag accent flex items-center gap-1.5 bg-[var(--accent-dim)] border border-[var(--accent-mid)] text-[var(--accent)] text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {status}
            </span>
          )}
          {location && (
            <span className="tag bg-white/5 border border-white/10 text-[var(--text-muted)] text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
              {location}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
