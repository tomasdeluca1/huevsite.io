"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Rocket, Trophy, Flame, Radio, Zap, Newspaper } from "lucide-react";
import { daysUntilWeekClose } from "@/lib/launch-week";

interface SidebarData {
  winner: { username: string; name: string; image: string | null } | null;
  topBuilders: { username: string; name: string; image: string | null; score: number }[];
  pulse: { activeThisWeek: number; newProjects: number; endorsements: number };
  weekTopLaunches: { title: string; username: string; upvoteCount: number }[];
  topCommits: {
    year: { username: string; name: string; image: string | null; commits: number }[];
    month: { username: string; name: string; image: string | null; commits: number }[];
  };
  latestPosts: { slug: string; title: string }[];
}

export interface RailWeekLaunch {
  id: string;
  userId: string;
  upvoteCount: number;
}

export function DiscoveryRail({
  currentUserId,
  weekLaunches,
}: {
  currentUserId?: string | null;
  weekLaunches?: RailWeekLaunch[];
}) {
  const t = useTranslations("discovery");
  const [data, setData] = useState<SidebarData | null>(null);
  const [commitsRange, setCommitsRange] = useState<"year" | "month">("year");

  useEffect(() => {
    let alive = true;
    fetch("/api/feed/sidebar")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const myIdx =
    weekLaunches && currentUserId ? weekLaunches.findIndex((l) => l.userId === currentUserId) : -1;
  const myLaunch = myIdx >= 0 ? weekLaunches![myIdx] : null;
  const pathname = usePathname() || "";
  const onFeed = pathname === "/feed";
  const closeDays = daysUntilWeekClose();

  const card = "rounded-2xl border border-white/10 bg-white/[0.02] p-4";
  const label =
    "text-[9px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-2 flex items-center gap-1.5";

  return (
    <aside className="flex w-full flex-col gap-3 lg:w-[320px] lg:shrink-0 lg:sticky lg:top-6 lg:self-start">
      {/* Tu lanzamiento (context-aware) */}
      <div className={`${card} !border-[var(--accent)]/20 bg-[var(--accent)]/[0.04]`}>
        <div className={label}>
          <Rocket size={12} /> {t("railYourLaunchLabel")}
        </div>
        {myLaunch ? (
          <div>
            <div className="text-sm font-semibold text-white">
              {t("railYourRank", { rank: myIdx + 1 })}
            </div>
            <div className="mt-0.5 text-xs text-white/50">
              ▲ {myLaunch.upvoteCount} · {t("railShareNudge")}
            </div>
          </div>
        ) : currentUserId ? (
          <>
            <div className="mb-2 text-xs text-white/60">{t("railNotLaunched")}</div>
            <Link
              href="/dashboard"
              className="block rounded-xl bg-[var(--accent)] py-2.5 text-center text-xs font-black text-black"
            >
              🚀 {t("railLaunchCta")}
            </Link>
          </>
        ) : (
          <>
            <div className="mb-2 text-xs text-white/60">{t("railLoggedOut")}</div>
            <Link
              href="/login"
              className="block rounded-xl bg-[var(--accent)] py-2.5 text-center text-xs font-black text-black"
            >
              {t("railCreateCta")}
            </Link>
          </>
        )}
        {closeDays > 0 && (
          <div className="mt-2 text-[10px] text-white/30">{t("railWeekClose", { days: closeDays })}</div>
        )}
      </div>

      {/* Loading skeletons for the data widgets */}
      {!data &&
        [0, 1, 2].map((i) => (
          <div key={i} className={card}>
            <div className="mb-3 h-3 w-24 rounded bg-white/10 animate-pulse" />
            <div className="h-10 w-full rounded bg-white/5 animate-pulse" />
          </div>
        ))}

      {/* Builders Hunt — esta semana (cross-promo; hidden on /feed) */}
      {!onFeed && data && data.weekTopLaunches.length > 0 && (
        <div className={card}>
          <div className={label}>
            <Rocket size={12} /> {t("railWeekLaunchesLabel")}
          </div>
          <div className="space-y-1.5">
            {data.weekTopLaunches.map((l, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-white/70">
                <span className="truncate">
                  <span className="mr-1.5 text-white/30">{i + 1}</span>
                  {l.title}
                </span>
                <span className="ml-2 shrink-0 font-black text-[var(--accent)]">▲ {l.upvoteCount}</span>
              </div>
            ))}
          </div>
          <Link href="/feed" className="mt-2 block text-[10px] font-bold text-[var(--accent)]">
            {t("railWeekLaunchesMore")} →
          </Link>
        </div>
      )}

      {/* Builder de la semana */}
      {data?.winner && (
        <div className={card}>
          <div className={label}>
            <Trophy size={12} /> {t("railWinnerLabel")}
          </div>
          <Link href={`/${data.winner.username}`} className="group flex items-center gap-2.5">
            {data.winner.image ? (
              <img src={data.winner.image} className="h-9 w-9 rounded-lg object-cover" alt="" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#00FF88]" />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white group-hover:text-[var(--accent)]">
                {data.winner.name}
              </div>
              <div className="text-[10px] text-white/40">@{data.winner.username}</div>
            </div>
          </Link>
          <Link
            href="/builders-de-la-semana"
            className="mt-2.5 flex items-center justify-center gap-1 rounded-lg border border-[var(--accent)]/20 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]/80 transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          >
            {t("railWinnerHistory")} →
          </Link>
        </div>
      )}

      {/* Top builders */}
      {data && data.topBuilders.length > 0 && (
        <div className={card}>
          <div className={label}>
            <Flame size={12} /> {t("railTopLabel")}
          </div>
          <div className="space-y-1.5">
            {data.topBuilders.map((b, i) => (
              <Link
                key={b.username}
                href={`/${b.username}`}
                className="flex items-center justify-between text-xs text-white/70 hover:text-white"
              >
                <span className="truncate">
                  <span className="mr-1.5 text-white/30">{i + 1}</span>
                  {b.name}
                </span>
                <span className="ml-2 shrink-0 font-black text-white/90">{b.score}</span>
              </Link>
            ))}
          </div>
          <Link href="/leaderboard" className="mt-2 block text-[10px] font-bold text-[var(--accent)]">
            {t("railTopMore")} →
          </Link>
        </div>
      )}

      {/* Top por commits (distinct ranking, year/month toggle) */}
      {data && (data.topCommits.year.length > 0 || data.topCommits.month.length > 0) && (
        <div className={card}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              <Zap size={12} /> {t("railCommitsLabel")}
            </div>
            <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
              {(["year", "month"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setCommitsRange(r)}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
                    commitsRange === r ? "bg-[var(--accent)] text-black" : "text-white/40 hover:text-white"
                  }`}
                >
                  {r === "year" ? t("railCommitsYear") : t("railCommitsMonth")}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {data.topCommits[commitsRange].length === 0 ? (
              <div className="text-[10px] text-white/30">{t("railCommitsEmpty")}</div>
            ) : (
              data.topCommits[commitsRange].map((b, i) => (
                <Link
                  key={b.username}
                  href={`/${b.username}`}
                  className="flex items-center justify-between text-xs text-white/70 hover:text-white"
                >
                  <span className="truncate">
                    <span className="mr-1.5 text-white/30">{i + 1}</span>
                    {b.name}
                  </span>
                  <span className="ml-2 shrink-0 font-black text-[var(--accent)]">{b.commits}</span>
                </Link>
              ))
            )}
          </div>
          <Link href="/leaderboard" className="mt-2 block text-[10px] font-bold text-[var(--accent)]">
            {t("railCommitsMore")} →
          </Link>
        </div>
      )}

      {/* Últimas del blog */}
      {data && data.latestPosts.length > 0 && (
        <div className={card}>
          <div className={label}>
            <Newspaper size={12} /> {t("railBlogLabel")}
          </div>
          <div className="divide-y divide-white/10">
            {data.latestPosts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block py-2.5 text-xs leading-snug text-white/70 hover:text-white first:pt-0 last:pb-0"
              >
                {p.title}
              </Link>
            ))}
          </div>
          <Link href="/blog" className="mt-2 block text-[10px] font-bold text-[var(--accent)]">
            {t("railBlogMore")} →
          </Link>
        </div>
      )}

      {/* Pulso de la red */}
      {data && (
        <div className={card}>
          <div className={label}>
            <Radio size={12} /> {t("railPulseLabel")}
          </div>
          <div className="space-y-1 text-xs text-white/60">
            <div className="flex justify-between">
              <span>{t("railPulseActive")}</span>
              <span className="font-black text-white">{data.pulse.activeThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("railPulseProjects")}</span>
              <span className="font-black text-white">{data.pulse.newProjects}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("railPulseEndorsements")}</span>
              <span className="font-black text-white">{data.pulse.endorsements}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
