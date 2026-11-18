"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, LayoutGroup } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { ArrowBigUp, Check, Trophy } from "lucide-react";
import type { NetworkPulse, WinnerHistoryItem } from "@/lib/showcase-service";
import { COMMUNITY_IMAGE_EXCLUDED } from "@/lib/community-exclusions";
import { proxiedAvatar } from "@/lib/landing-avatar";

// Umbral del showcase (lib/score-service: builder_score >= 300).
const SHOWCASE = 300;
// Puntos reales de la fórmula (recompute_builder_score).
const SCORE_STEPS = [
  { key: "cvScoreStepProfile", pts: 100 },
  { key: "cvScoreStepProject", pts: 75 },
  { key: "cvScoreStepGithub", pts: 150 },
] as const;

const card = "rounded-[1.6rem] border border-white/8 bg-white/[0.025]";
const linkRow = "text-[11px] font-mono uppercase tracking-[0.18em] text-white/35 transition-colors hover:text-[var(--accent)]";

function avatarSrc(src: string | null, username: string, size: number, showExcluded = false): string | null {
  if (!src || !/^https?:\/\//i.test(src)) return null;
  if (!showExcluded && COMMUNITY_IMAGE_EXCLUDED.has(username.toLowerCase())) return null;
  return proxiedAvatar(src, username, size * 2);
}

function Avatar({ src, username, name, size, className = "", showExcluded = false }: { src: string | null; username: string; name: string; size: number; className?: string; showExcluded?: boolean }) {
  const url = avatarSrc(src, username, size, showExcluded);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={size} height={size} loading="lazy" className={`shrink-0 rounded-full object-cover ${className}`} style={{ width: size, height: size }} />
  ) : (
    <span className={`grid shrink-0 place-items-center rounded-full bg-white/[0.06] font-black text-white/60 ${className}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {(name || username).charAt(0).toUpperCase()}
    </span>
  );
}

/** Un número que sube desde 0 la primera vez que entra en pantalla. Sin JS se ve el valor final. */
function CountIn({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1100);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      setShown(0);
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(frame); };
  }, [value]);
  return <span ref={ref}>{format(shown)}</span>;
}

function useCountdownToMonday() {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const next = new Date();
      next.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      next.setHours(0, 0, 0, 0);
      const diff = Math.max(0, next.getTime() - now.getTime());
      setLeft({ d: Math.floor(diff / 864e5), h: Math.floor((diff / 36e5) % 24), m: Math.floor((diff / 6e4) % 60), s: Math.floor((diff / 1e3) % 60) });
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);
  return left;
}

interface Props {
  totalBuilders: number;
  projectCount: number;
  activeThisWeek: number;
  winners: WinnerHistoryItem[];
  networkPulse?: NetworkPulse;
  loggedIn: boolean;
  onTrack: (event: string, payload?: Record<string, unknown>) => void;
}

// "La comunidad te da": la vuelta completa de estar en huevsite. Publicás
// (proyectos), te ven (el muro), te votan (Builders Hunt) y te destacan
// (Builder de la Semana). Cifras reales arriba; abajo, tres tarjetas que se
// tocan. Lo único de ejemplo es la lista de Builders Hunt, y lo dice.
export function CommunityValue({ totalBuilders, projectCount, activeThisWeek, winners, networkPulse, loggedIn, onTrack }: Props) {
  const t = useTranslations("landing");
  const locale = useLocale();
  const fmt = (n: number) => n.toLocaleString(locale === "en" ? "en-US" : "es-AR");
  const rich = { accent: (c: ReactNode) => <span className="accent">{c}</span> };

  const loop = [
    { key: "publish", value: projectCount, label: t("cvLoopPublish"), desc: t("cvLoopPublishDesc"), min: 10 },
    { key: "seen", value: totalBuilders, label: t("cvLoopSeen"), desc: t("cvLoopSeenDesc"), min: 10 },
    { key: "voted", value: activeThisWeek, label: t("cvLoopVoted"), desc: t("cvLoopVotedDesc"), min: 5 },
    { key: "featured", value: winners.length, label: t("cvLoopFeatured"), desc: t("cvLoopFeaturedDesc"), min: 3 },
  ].filter((s) => s.value >= s.min);

  return (
    <section style={{ padding: "var(--section-y) var(--section-x) 0" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }} className="flex flex-col gap-10">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="section-label" style={{ justifyContent: "center" }}>{t("cvLabel")}</div>
          <h2 className="section-title">{t.rich("cvTitle", rich)}</h2>
          <p className="section-sub mx-auto max-w-[560px]">{t("cvSub")}</p>
        </div>

        {loop.length > 0 && (
          <div className={`grid grid-cols-2 overflow-hidden ${card} ${loop.length >= 4 ? "lg:grid-cols-4" : loop.length === 3 ? "lg:grid-cols-3" : ""}`}>
            {loop.map((s, i) => (
              <div key={s.key} className={`relative flex flex-col gap-1.5 p-5 md:p-6 ${i > 0 ? "border-white/[0.06] lg:border-l" : ""} ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""}`}>
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                  <span className="text-white/30">{String(i + 1).padStart(2, "0")}</span> {s.label}
                </span>
                <span className="text-4xl font-black tracking-tight text-white tabular-nums md:text-5xl">
                  <CountIn value={s.value} format={fmt} />
                </span>
                <span className="text-sm leading-snug text-[var(--text-muted)]">{s.desc}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <WinnerCard winners={winners} fmt={fmt} onTrack={onTrack} />
          <HuntCard loggedIn={loggedIn} onTrack={onTrack} />
        </div>

        <ScoreCard top3={networkPulse?.top3 ?? []} fmt={fmt} loggedIn={loggedIn} onTrack={onTrack} />
      </div>
    </section>
  );
}

function WinnerCard({ winners, fmt, onTrack }: { winners: WinnerHistoryItem[]; fmt: (n: number) => string; onTrack: Props["onTrack"] }) {
  const t = useTranslations("landing");
  const left = useCountdownToMonday();
  const current = winners[0];
  const past = winners.slice(1, 7);
  const week = current?.week?.split("-W")[1];

  return (
    <div className={`${card} flex min-w-0 flex-col gap-6 p-6 md:p-7`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
          <Trophy size={13} /> {t("cvWinnerLabel")}
        </span>
        {week && <span className="font-mono text-[11px] text-white/35">{t("cvWinnerWeek", { week: Number(week) })}</span>}
      </div>

      {current ? (
        <Link
          href={`/${current.username}`}
          onClick={() => onTrack("landing_cv_winner_click", { username: current.username })}
          className="group flex items-center gap-4"
        >
          <span className="relative">
            <Avatar src={current.image} username={current.username} name={current.name} size={68} showExcluded className="ring-2 ring-[var(--accent)] ring-offset-4 ring-offset-[#0b0b0c]" />
            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#0b0b0c] bg-[var(--accent)] text-[#050505]">
              <Trophy size={11} strokeWidth={2.8} />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xl font-black tracking-tight text-white group-hover:underline underline-offset-4">{current.name}</span>
            <span className="block truncate font-mono text-[12px] text-[var(--accent)]">@{current.username} · {fmt(current.builderScore)} pts</span>
            {current.tagline && <span className="mt-1 line-clamp-2 block text-sm leading-snug text-[var(--text-muted)]">{current.tagline}</span>}
          </span>
        </Link>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">{t("cvWinnerEmpty")}</p>
      )}

      <p className="text-sm leading-6 text-[var(--text-dim)]">{t("cvWinnerWhat")}</p>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{t("cvWinnerNext")}</div>
          <div className="flex gap-1.5" aria-live="off">
            {(["d", "h", "m", "s"] as const).map((k) => (
              <span key={k} className="flex w-12 flex-col items-center rounded-xl bg-white/[0.04] py-2">
                <span className="text-lg font-black leading-none text-white tabular-nums">{left ? String(left[k]).padStart(k === "d" ? 1 : 2, "0") : "–"}</span>
                <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">{t(`cvCount_${k}`)}</span>
              </span>
            ))}
          </div>
        </div>

        {past.length > 0 && (
          <Link href="/builders-de-la-semana" onClick={() => onTrack("landing_cv_hall_click")} className="group flex items-center gap-2.5">
            <span className="flex">
              {past.map((w, i) => (
                <Avatar key={w.username + w.week} src={w.image} username={w.username} name={w.name} size={28} className={`border-2 border-[#0b0b0c] ${i > 0 ? "-ml-2" : ""}`} />
              ))}
            </span>
            <span className="font-mono text-[11px] text-white/45 transition-colors group-hover:text-[var(--accent)]">{t("cvWinnerHall", { n: winners.length })}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

type HuntRow = { id: string; mark: string; name: string; tag: string; votes: number; you?: boolean };

function HuntCard({ loggedIn, onTrack }: { loggedIn: boolean; onTrack: Props["onTrack"] }) {
  const t = useTranslations("landing");
  const [voted, setVoted] = useState(false);
  const base: HuntRow[] = [
    { id: "a", mark: "🛠️", name: t("bhEx2Name"), tag: t("bhEx2Tag"), votes: 31 },
    { id: "b", mark: "⚡", name: t("bhEx3Name"), tag: t("bhEx3Tag"), votes: 29 },
    { id: "you", mark: "🚀", name: t("bhCardYouName"), tag: t("bhCardYouTag"), votes: 27, you: true },
  ];
  // Al votar, tu lanzamiento junta los votos de la comunidad y pasa al #1.
  const rows = base
    .map((r) => (r.you && voted ? { ...r, votes: 34 } : r))
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className={`${card} flex min-w-0 flex-col gap-5 p-6 md:p-7`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
          <ArrowBigUp size={14} /> {t("cvHuntLabel")}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          </span>
          {t("cvHuntExample")}
        </span>
      </div>

      <div>
        <h3 className="text-xl font-black tracking-tight text-white">{t("cvHuntTitle")}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{t("cvHuntSub")}</p>
      </div>

      <LayoutGroup>
        <ol className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <motion.li
              key={r.id}
              layout
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className={`flex items-center gap-3 rounded-2xl p-2.5 ${r.you ? "bg-[rgba(200,255,0,0.07)] ring-1 ring-[rgba(200,255,0,0.4)]" : "bg-white/[0.02]"}`}
            >
              <span className="w-4 shrink-0 text-center text-xs font-black text-white/30">{i + 1}</span>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base ${r.you ? "bg-[var(--accent)]" : "bg-white/[0.06]"}`}>{r.mark}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold text-white">{r.name}</span>
                <span className="block truncate text-[11.5px] text-[var(--text-muted)]">{r.tag}</span>
              </span>
              {r.you ? (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={() => { setVoted((v) => !v); if (!voted) onTrack("landing_cv_hunt_vote"); }}
                  aria-pressed={voted}
                  aria-label={t("cvHuntVote")}
                  className={`flex w-12 shrink-0 flex-col items-center rounded-xl border py-1 transition-colors ${voted ? "border-[var(--accent)] bg-[var(--accent)] text-[#050505]" : "border-[rgba(200,255,0,0.5)] bg-[rgba(200,255,0,0.1)] text-[var(--accent)] hover:bg-[rgba(200,255,0,0.2)]"}`}
                >
                  <ArrowBigUp size={16} className={voted ? "fill-[#050505]" : ""} />
                  <span className="text-[11px] font-black leading-none tabular-nums">{r.votes}</span>
                </motion.button>
              ) : (
                <span className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-white/10 py-1 text-[var(--text-muted)]">
                  <ArrowBigUp size={16} />
                  <span className="text-[11px] font-black leading-none tabular-nums">{r.votes}</span>
                </span>
              )}
            </motion.li>
          ))}
        </ol>
      </LayoutGroup>

      <p className={`min-h-5 font-mono text-[11.5px] transition-colors ${voted ? "text-[var(--accent)]" : "text-white/35"}`}>
        {voted ? t("cvHuntVoted") : t("cvHuntHint")}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3">
        <Link href={loggedIn ? "/dashboard" : "/login"} onClick={() => onTrack("landing_cv_hunt_launch")} className={linkRow}>{t("cvHuntLaunch")}</Link>
        <Link href="/feed" onClick={() => onTrack("landing_cv_hunt_feed")} className={linkRow}>{t("cvHuntFeed")}</Link>
      </div>
    </div>
  );
}

function ScoreCard({ top3, fmt, loggedIn, onTrack }: { top3: NetworkPulse["top3"]; fmt: (n: number) => string; loggedIn: boolean; onTrack: Props["onTrack"] }) {
  const t = useTranslations("landing");
  const [done, setDone] = useState<Set<string>>(new Set());
  const score = SCORE_STEPS.reduce((s, step) => s + (done.has(step.key) ? step.pts : 0), 0);
  const reached = score >= SHOWCASE;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!reached || firedRef.current) return;
    firedRef.current = true;
    onTrack("landing_cv_score_showcase");
    import("canvas-confetti")
      .then(({ default: confetti }) => confetti({ particleCount: 90, spread: 70, origin: { y: 0.75 }, colors: ["#C8FF00", "#ffffff", "#00FF88"], disableForReducedMotion: true }))
      .catch(() => {});
  }, [reached, onTrack]);

  const toggle = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const max = 400;
  return (
    <div className={`${card} grid min-w-0 grid-cols-1 gap-8 p-6 md:p-8 ${top3.length >= 3 ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" : ""}`}>
      <div className="flex min-w-0 flex-col gap-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">{t("cvScoreLabel")}</span>
        <h3 className="max-w-md text-xl font-black tracking-tight text-white md:text-2xl">{t.rich("cvScoreTitle", { accent: (c: ReactNode) => <span className="accent">{c}</span> })}</h3>

        <div className="flex items-baseline gap-3">
          <motion.span key={score} initial={{ scale: 1.12 }} animate={{ scale: 1 }} className="text-5xl font-black tracking-tight text-white tabular-nums">{score}</motion.span>
          <span className={`font-mono text-[12px] ${reached ? "text-[var(--accent)]" : "text-white/35"}`}>
            {reached ? t("cvScoreReached") : t("cvScoreToGo", { n: SHOWCASE - score })}
          </span>
        </div>

        <div className="relative h-2 rounded-full bg-white/[0.06]">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]"
            animate={{ width: `${Math.min(100, (score / max) * 100)}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
          />
          <span className="absolute -top-1.5 h-5 w-px bg-white/40" style={{ left: `${(SHOWCASE / max) * 100}%` }} aria-hidden />
          <span className="absolute top-4 -translate-x-1/2 font-mono text-[9.5px] text-white/35" style={{ left: `${(SHOWCASE / max) * 100}%` }}>300</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SCORE_STEPS.map((step) => {
            const on = done.has(step.key);
            return (
              <motion.button
                key={step.key}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => toggle(step.key)}
                aria-pressed={on}
                className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-bold transition-colors ${on ? "border-[rgba(200,255,0,0.6)] bg-[rgba(200,255,0,0.1)] text-white" : "border-white/10 text-[var(--text-dim)] hover:border-white/25"}`}
              >
                {on ? <Check size={13} className="text-[var(--accent)]" /> : <span className="text-white/35">+</span>}
                {t(step.key)}
                <span className={`font-mono text-[11px] ${on ? "text-[var(--accent)]" : "text-white/35"}`}>+{step.pts}</span>
              </motion.button>
            );
          })}
        </div>

        <Link href={loggedIn ? "/dashboard" : "/login"} onClick={() => onTrack("landing_cv_score_cta")} className="btn btn-accent mt-1 w-full !px-6 !py-3 text-sm sm:w-auto sm:self-start">
          {loggedIn ? t("heroDashboardCta") : t("cvScoreCta")}
        </Link>
      </div>

      {top3.length >= 3 && (
        <div className="flex min-w-0 flex-col gap-4 lg:border-l lg:border-white/[0.06] lg:pl-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{t("cvRankLabel")}</span>
          <ol className="flex flex-col gap-3">
            {top3.map((b, i) => (
              <li key={b.username}>
                <Link href={`/${b.username}`} onClick={() => onTrack("landing_cv_rank_click", { username: b.username })} className="group flex items-center gap-3">
                  <span className={`w-5 text-sm font-black ${i === 0 ? "text-[var(--accent)]" : "text-white/30"}`}>{i + 1}</span>
                  <Avatar src={b.image} username={b.username} name={b.name || b.username} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-white group-hover:underline underline-offset-4">{b.name || b.username}</span>
                  <span className="font-mono text-xs text-[var(--accent)]">{fmt(b.builder_score)}</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/leaderboard" onClick={() => onTrack("landing_cv_rank_all")} className={`${linkRow} mt-auto`}>{t("cvRankAll")}</Link>
        </div>
      )}
    </div>
  );
}
