"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Lock, Trophy } from "lucide-react";
import { getContrastColor, type BlockType, type ProfileData } from "@/lib/profile-types";
import { ALL_BADGE_KEYS, BADGE_CATALOG } from "@/lib/profile-badges";
import { BadgeItem } from "@/components/profile/BadgeItem";
import { BadgeSnippetCard } from "@/components/dashboard/BadgeSnippetCard";
import { QuestPanel } from "@/components/dashboard/QuestPanel";

interface Props {
  profile: ProfileData;
  canSeeInsights: boolean;
  insights: ReactNode;
  visibleBlockCount: number;
  claiming: boolean;
  onClaimTrial?: () => void;
  onUpgrade: () => void;
  onScoreInfo: MouseEventHandler<HTMLButtonElement>;
  onAddBlock: (type: BlockType) => void;
  onEditProfile: () => void;
  onShare: () => void;
}

// Estadísticas: lo que mide. Las de visitas son Pro; sin Pro se ve la pantalla
// borrosa con lo que hay adentro y un solo botón. Score, progreso y badges son
// de todos.
export function StatsTab({ profile, canSeeInsights, insights, visibleBlockCount, claiming, onClaimTrial, onUpgrade, onScoreInfo, onAddBlock, onEditProfile, onShare }: Props) {
  const t = useTranslations("dashboard.shell");
  const ink = getContrastColor(profile.accentColor);
  const score = profile.builderScore || 0;
  const earned = profile.badges || [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      {canSeeInsights ? (
        insights
      ) : (
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.02]">
          <div aria-hidden className="pointer-events-none select-none p-6 blur-[6px] md:p-8">
            <div className="grid grid-cols-3 gap-3">
              {["1.204", "318", "26%"].map((v) => (
                <div key={v} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="text-3xl font-extrabold tracking-tight text-white">{v}</div>
                  <div className="mt-1 h-2 w-16 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
            <svg viewBox="0 0 600 160" className="mt-6 h-40 w-full" preserveAspectRatio="none">
              <polyline fill="none" stroke={profile.accentColor} strokeWidth="3" points="0,130 60,118 120,124 180,92 240,100 300,70 360,80 420,52 480,62 540,34 600,40" />
            </svg>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#050505]/55 p-6 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]"><Lock size={18} className="text-white/70" /></span>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">{t("statsLockedTitle")}</h2>
            <p className="max-w-sm text-[14px] leading-relaxed text-white/60">{t("statsLockedBody")}</p>
            <button
              type="button"
              onClick={onClaimTrial || onUpgrade}
              disabled={claiming}
              className="mt-1 min-h-11 rounded-xl px-5 text-[14px] font-extrabold disabled:opacity-60"
              style={{ background: profile.accentColor, color: ink }}
            >
              {onClaimTrial ? t("statsTryCta") : t("statsUpgradeCta")}
            </button>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">{t("statsProgress")}</h2>
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="flex flex-col gap-6 rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/40">{t("statsScore")}</div>
                <div className="mt-2 text-5xl font-extrabold tracking-tight text-white tabular-nums">{score}</div>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]"><Trophy size={17} /></span>
            </div>
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min((score / 1000) * 100, 100)}%` }} />
              </div>
              <button type="button" onClick={onScoreInfo} className="mt-3 text-[13px] font-bold text-white/55 underline-offset-4 hover:text-white hover:underline">
                {t("statsScoreHow")}
              </button>
            </div>
          </div>
          <QuestPanel
            profile={profile}
            visibleBlockCount={visibleBlockCount}
            accentColor={profile.accentColor}
            borderRadius="28px"
            onAddBlock={onAddBlock}
            onEditProfile={onEditProfile}
            onShare={onShare}
            onUpgrade={onUpgrade}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">{t("statsBadges")}</h2>
          <span className="font-mono text-[11px] text-white/35">{t("statsBadgesCount", { earned: earned.length, total: ALL_BADGE_KEYS.length })}</span>
        </div>
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6">
          <div className="flex flex-wrap gap-x-6 gap-y-5">
            {ALL_BADGE_KEYS.map((key) => (
              <BadgeItem key={key} badge={{ key, ...BADGE_CATALOG[key] }} earned={earned.some((b) => b.key === key)} size="md" />
            ))}
          </div>
          <div className="mt-5 empty:hidden">
            <BadgeSnippetCard username={profile.username} />
          </div>
        </div>
      </section>
    </div>
  );
}
