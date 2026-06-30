"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LayoutList, GitCommitVertical } from "lucide-react";
import { weekLabel } from "@/lib/launch-week";
import type { WinnerHistoryItem } from "@/lib/showcase-service";

type View = "timeline" | "list";

export function BuildersHistoryViews({
  winners,
  noteSlugs,
}: {
  winners: WinnerHistoryItem[];
  noteSlugs: Record<string, string>;
}) {
  const t = useTranslations("winnerHistory");
  const locale = useLocale();
  const [view, setView] = useState<View>("timeline");

  if (winners.length === 0) {
    return <p className="text-center text-sm text-white/40">{t("empty")}</p>;
  }

  const week = (w: WinnerHistoryItem) => `${weekLabel(w.week, locale)} ${w.week.slice(0, 4)}`;

  const avatar = (w: WinnerHistoryItem, size: string) =>
    w.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={w.image} alt={w.name} className={`${size} shrink-0 rounded-full border border-white/10 object-cover transition-transform group-hover:scale-105`} />
    ) : (
      <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C8FF00] to-[#00FF88] font-black text-black`}>
        {w.name.charAt(0).toUpperCase()}
      </span>
    );

  const ctas = (w: WinnerHistoryItem) => {
    const noteSlug = noteSlugs[w.username.toLowerCase()];
    return (
      <div className="mt-auto flex items-center gap-2 pt-1">
        {noteSlug && (
          <Link
            href={`/blog/${noteSlug}`}
            className="flex-1 rounded-lg border border-white/12 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/70 transition-colors hover:border-white/30 hover:text-white"
          >
            {t("readPost")}
          </Link>
        )}
        <Link
          href={`/${w.username}`}
          className="flex-1 rounded-lg bg-[#C8FF00] py-2 text-center text-[10px] font-black uppercase tracking-wide text-black transition-transform hover:scale-[1.02]"
        >
          {t("profile")}
        </Link>
      </div>
    );
  };

  const builder = (w: WinnerHistoryItem) => (
    <Link href={`/${w.username}`} className="flex items-center gap-3">
      {avatar(w, "h-12 w-12 text-base")}
      <span className="min-w-0">
        <span className="block truncate text-base font-bold text-white group-hover:text-[#C8FF00]">{w.name}</span>
        <span className="block truncate font-mono text-[11px] text-white/40">@{w.username} · {w.builderScore} score</span>
      </span>
    </Link>
  );

  return (
    <div>
      {/* view toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {(
            [
              ["timeline", t("viewTimeline"), GitCommitVertical],
              ["list", t("viewList"), LayoutList],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                view === key ? "bg-[#C8FF00] text-black" : "text-white/55 hover:text-white"
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <ol className="grid gap-3 sm:grid-cols-2">
          {winners.map((w) => (
            <li
              key={`${w.week}-${w.username}`}
              className="group flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-[#C8FF00]/30"
            >
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/badge/laurel-dark.png" alt="" className="h-5 w-auto" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#C8FF00]/80">{week(w)}</span>
              </div>
              {builder(w)}
              {w.tagline && <p className="line-clamp-2 text-xs leading-relaxed text-white/55">{w.tagline}</p>}
              {ctas(w)}
            </li>
          ))}
        </ol>
      ) : (
        <div className="relative ml-3 border-l border-white/10 pl-6 sm:ml-4 sm:pl-8">
          {winners.map((w) => (
            <div key={`${w.week}-${w.username}`} className="relative pb-5 last:pb-0">
              <span className="absolute -left-[31px] top-1 sm:-left-[39px]">
                <span className="block h-3 w-3 rounded-full bg-[#C8FF00] ring-4 ring-[#070708]" />
              </span>
              <div className="mb-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/badge/laurel-dark.png" alt="" className="h-4 w-auto" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-[#C8FF00]/80">{week(w)}</span>
              </div>
              <div className="group flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-[#C8FF00]/30">
                {builder(w)}
                {w.tagline && <p className="line-clamp-2 text-xs leading-relaxed text-white/55">{w.tagline}</p>}
                {ctas(w)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
