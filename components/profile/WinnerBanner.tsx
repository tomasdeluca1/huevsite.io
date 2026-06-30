"use client";

import { useLocale, useTranslations } from "next-intl";
import { weekLabel } from "@/lib/launch-week";

/**
 * Full-width "Builder de la Semana" banner above the board (winners only).
 * Shows the award + the week won, a button to the builder's BDLS blog post
 * (when it exists), and a CTA to the hall-of-fame history page.
 */
export function WinnerBanner({
  winnerWeek,
  notaHref,
  historyHref,
}: {
  winnerWeek: string;
  notaHref: string | null;
  historyHref: string;
}) {
  const t = useTranslations("winnerBanner");
  const locale = useLocale();
  const week = `${weekLabel(winnerWeek, locale)} ${winnerWeek.slice(0, 4)}`;

  return (
    <div className="relative z-10 mb-4 md:mb-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--accent)]/35 bg-gradient-to-r from-[var(--accent)]/[0.14] via-[var(--accent)]/[0.05] to-transparent px-4 py-3 sm:flex-row sm:items-center sm:gap-4 md:px-6 md:py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badge/laurel-dark.png" alt="" className="h-8 w-auto shrink-0 md:h-10" />

        <div className="min-w-0 flex-1">
          <div className="text-sm font-black uppercase tracking-wide text-[var(--accent)] md:text-base">
            {t("title")}
          </div>
          <div className="font-mono text-[11px] text-white/55 md:text-xs">
            {t("wonWeek", { week })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {notaHref && (
            <a
              href={notaHref}
              className="rounded-xl border border-white/15 px-3.5 py-2 text-[11px] font-bold text-white/80 transition-colors hover:border-white/30 hover:text-white md:text-xs"
            >
              {t("readPost")}
            </a>
          )}
          <a
            href={historyHref}
            className="rounded-xl bg-[var(--accent)] px-3.5 py-2 text-[11px] font-black text-black transition-transform hover:scale-[1.03] md:text-xs"
          >
            {t("history")} →
          </a>
        </div>
      </div>
    </div>
  );
}
