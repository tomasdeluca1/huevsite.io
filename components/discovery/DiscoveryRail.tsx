"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Rocket, Trophy, Flame, Radio } from "lucide-react";

interface SidebarData {
  winner: { username: string; name: string; image: string | null } | null;
  topBuilders: { username: string; name: string; image: string | null; score: number }[];
  pulse: { activeThisWeek: number; newProjects: number; endorsements: number };
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

  const card = "rounded-2xl border border-white/10 bg-white/[0.02] p-4";
  const label =
    "text-[9px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-2 flex items-center gap-1.5";

  return (
    <aside className="flex w-full flex-col gap-3 lg:w-[320px] lg:shrink-0">
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
      </div>

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
