"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Share2, Trophy, X } from "lucide-react";
import type { ProfileData } from "@/lib/profile-types";
import { BADGE_CATALOG } from "@/lib/profile-badges";
import { CountUp } from "./CountUp";

// Umbral del showcase de la home (lib/score-service: builder_score >= 300).
const SHOWCASE_SCORE = 300;
// Badges que se renuevan solos cada semana: no se festejan como nuevos.
const TRANSIENT_BADGES = new Set(["active_this_week"]);

type Moment =
  | { kind: "score"; from: number; to: number }
  | { kind: "showcase"; score: number }
  | { kind: "badge"; key: string };

function fireConfetti() {
  import("canvas-confetti")
    .then(({ default: confetti }) => confetti({ particleCount: 110, spread: 80, origin: { y: 0.85 }, disableForReducedMotion: true }))
    .catch(() => {});
}

function readSeen(key: string): string[] | null {
  try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function writeSeen(key: string, value: string[]) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin storage: no se festeja */ }
}

interface Props {
  profile: ProfileData;
  onShare: () => void;
}

// Festeja lo que el builder acaba de lograr, en el momento: los puntos que
// sumó al guardar, entrar al showcase y cada badge nuevo. Siempre datos reales,
// nunca inventados, y cada logro termina en "Compartir".
export function Celebrations({ profile, onShare }: Props) {
  const t = useTranslations("dashboard.shell");
  const [moment, setMoment] = useState<Moment | null>(null);
  const prevScore = useRef<number | null>(null);
  const timer = useRef<number | null>(null);

  const show = (m: Moment, ms = 4200) => {
    setMoment(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMoment(null), ms);
  };

  // Puntos: compara con el score anterior; el primero que llega es la base.
  const score = profile.builderScore || 0;
  useEffect(() => {
    const prev = prevScore.current;
    prevScore.current = score;
    if (prev === null || score <= prev) return;
    if (prev < SHOWCASE_SCORE && score >= SHOWCASE_SCORE) {
      fireConfetti();
      show({ kind: "showcase", score }, 6500);
    } else {
      show({ kind: "score", from: prev, to: score });
    }
  }, [score]);

  // Badges: los que no estaban la última vez que entraste. La primera vez solo
  // se guardan, para no festejar de golpe lo que ya tenías.
  const badgeKeys = (profile.badges || []).map((b) => b.key).filter((k) => !TRANSIENT_BADGES.has(k));
  const badgeSig = badgeKeys.slice().sort().join(",");
  useEffect(() => {
    const storageKey = `huevsite_seen_badges_${profile.id}`;
    const seen = readSeen(storageKey);
    writeSeen(storageKey, Array.from(new Set([...(seen || []), ...badgeKeys])));
    if (!seen) return;
    const fresh = badgeKeys.find((k) => !seen.includes(k));
    if (fresh) {
      const id = window.setTimeout(() => { fireConfetti(); show({ kind: "badge", key: fresh }, 7000); }, 900);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badgeSig, profile.id]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const share = () => { setMoment(null); onShare(); };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[150] flex justify-center px-4 md:bottom-8" aria-live="polite">
      <AnimatePresence>
        {moment && (
          <motion.div
            key={moment.kind + (moment.kind === "badge" ? moment.key : "")}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="pointer-events-auto flex max-w-[440px] items-center gap-3.5 rounded-[20px] border border-white/10 bg-[#111112]/95 py-3 pl-3 pr-2 shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          >
            {moment.kind === "score" ? (
              <>
                <span className="grid h-11 min-w-11 place-items-center rounded-2xl bg-[var(--accent)]/12 px-2 font-mono text-[15px] font-extrabold text-[var(--accent)]">
                  +{moment.to - moment.from}
                </span>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[14px] font-extrabold text-white">{t("celebrateScoreTitle")}</div>
                  <div className="text-[12.5px] text-white/55">
                    {t.rich("celebrateScoreBody", { score: moment.to, strong: () => <CountUp from={moment.from} value={moment.to} className="font-bold tabular-nums text-white" /> })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-[20px] text-[#050505]">
                  {moment.kind === "badge" ? BADGE_CATALOG[moment.key as keyof typeof BADGE_CATALOG]?.icon ?? "✦" : <Trophy size={18} strokeWidth={2.6} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                    {moment.kind === "badge" ? t("celebrateBadgeLabel") : t("celebrateShowcaseLabel")}
                  </div>
                  <div className="truncate text-[14px] font-extrabold text-white">
                    {moment.kind === "badge" ? BADGE_CATALOG[moment.key as keyof typeof BADGE_CATALOG]?.label ?? moment.key : t("celebrateShowcaseTitle")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={share}
                  className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-[13px] font-extrabold text-[#050505] transition-transform active:scale-95"
                >
                  <Share2 size={13} /> {t("celebrateShare")}
                </button>
              </>
            )}
            <button type="button" onClick={() => setMoment(null)} aria-label={t("dismiss")} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/35 hover:bg-white/5 hover:text-white">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
