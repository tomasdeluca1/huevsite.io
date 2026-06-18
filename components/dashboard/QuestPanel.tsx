"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Target, ChevronDown, ChevronRight } from "lucide-react";
import { ProfileData, BlockType } from "@/lib/profile-types";
import { getBadgeProgress, summarizeQuests, BadgeProgress, QuestAction } from "@/lib/badge-progress";

interface QuestPanelProps {
  profile: ProfileData;
  visibleBlockCount: number;
  accentColor: string;
  borderRadius?: string;
  onAddBlock: (type: BlockType) => void;
  onEditProfile: () => void;
  onShare: () => void;
  onUpgrade: () => void;
}

export function QuestPanel({
  profile,
  visibleBlockCount,
  accentColor,
  borderRadius = "1.5rem",
  onAddBlock,
  onEditProfile,
  onShare,
  onUpgrade,
}: QuestPanelProps) {
  const t = useTranslations("dashboard");
  const [expanded, setExpanded] = useState(true);

  const { nextUp, earnedBadges, earned, total } = useMemo(() => {
    const progress = getBadgeProgress({
      name: profile.displayName,
      avatarUrl: profile.avatarUrl,
      githubHandle: profile.githubHandle,
      tagline: profile.tagline,
      builderScore: profile.builderScore,
      hasProAccess: profile.hasProAccess,
      proReferralsCount: profile.proReferralsCount,
      isWinner: profile.isWinner,
      blocks: profile.blocks as any[],
      visibleBlockCount,
    });
    const summary = summarizeQuests(progress);
    return {
      nextUp: summary.nextUp,
      earnedBadges: progress.filter((p) => p.earned),
      earned: summary.earned,
      total: summary.total,
    };
  }, [profile, visibleBlockCount]);

  const runAction = (action?: QuestAction) => {
    if (!action) return;
    switch (action.kind) {
      case "addBlock":
        onAddBlock(action.blockType);
        break;
      case "editProfile":
        onEditProfile();
        break;
      case "share":
        onShare();
        break;
      case "upgrade":
        onUpgrade();
        break;
    }
  };

  const allDone = nextUp.length === 0;

  return (
    <div
      className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] overflow-hidden"
      style={{ borderRadius: `calc(${borderRadius} + 0.5rem)` }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
            <Target size={16} />
          </div>
          <div className="text-left">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block">{t("questPanel.nextAchievements")}</span>
            <span className="text-sm font-black text-white">
              {earned}<span className="text-white/30">/{total}</span> <span className="text-white/40 font-bold text-xs">{t("questPanel.unlocked")}</span>
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-white/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2.5">
              {allDone ? (
                <p className="text-[11px] text-white/40 leading-relaxed italic py-2">
                  {t("questPanel.allDone")}
                </p>
              ) : (
                nextUp.slice(0, 4).map((q) => (
                  <QuestRow key={q.key} quest={q} accentColor={accentColor} onAction={runAction} />
                ))
              )}

              {earnedBadges.length > 0 && (
                <div className="pt-3 mt-1 border-t border-white/5">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">{t("questPanel.earned")}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {earnedBadges.map((b) => (
                      <div
                        key={b.key}
                        title={b.label}
                        className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-sm"
                        style={{ color: accentColor }}
                      >
                        {b.icon}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestRow({
  quest,
  accentColor,
  onAction,
}: {
  quest: BadgeProgress;
  accentColor: string;
  onAction: (action?: QuestAction) => void;
}) {
  const pct = Math.round(quest.ratio * 100);
  const showProgress = quest.target > 1;

  return (
    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-start gap-2.5">
        <div
          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm shrink-0"
          style={{ color: accentColor }}
        >
          {quest.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-white/80 truncate">{quest.label}</span>
            {showProgress && (
              <span className="text-[9px] font-mono font-bold text-white/30 shrink-0">
                {quest.current}/{quest.target}
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/40 leading-snug mt-0.5">{quest.hint}</p>

          {showProgress && (
            <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}80` }}
              />
            </div>
          )}

          {quest.action && (
            <div className="mt-2.5">
              {quest.action.kind === "link" ? (
                <Link
                  href={quest.action.href}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:gap-2 transition-all"
                >
                  {quest.action.label} <ChevronRight size={11} />
                </Link>
              ) : (
                <button
                  onClick={() => onAction(quest.action)}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:gap-2 transition-all"
                >
                  {quest.action.label} <ChevronRight size={11} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
