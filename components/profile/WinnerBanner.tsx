"use client";

import { useLocale, useTranslations } from "next-intl";
import { weekLabel } from "@/lib/launch-week";

/**
 * Compact "Builder de la Semana" chip above the board (winners only).
 *
 * The full laurel wreath (`laurel-dark.png`) + the award label + won-week, plus
 * a link to the builder's BDLS blog post (when it exists) and the hall-of-fame
 * history.
 *
 * NOTE: the wreath sits at a fixed height inside a `flex-row items-center` row
 * so it keeps its aspect ratio. The old layout rendered it in a mobile
 * `flex-col` whose default `align-items: stretch` stretched the image
 * horizontally, pulling the two leaf clusters apart — that "laurel roto" is what
 * this replaces.
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent)]/[0.12] via-[var(--accent)]/[0.04] to-transparent px-3 py-2.5 md:px-4 md:py-3">
        {/* Full laurel wreath */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badge/laurel-dark.png" alt="" className="h-9 w-auto shrink-0 md:h-10" />

        <div className="min-w-0 flex-1">
          <div className="text-xs font-black uppercase tracking-wide text-[var(--accent)] leading-tight md:text-sm">
            {t("title")}
          </div>
          <div className="font-mono text-[10px] leading-tight text-white/50 md:text-[11px]">
            {t("wonWeek", { week })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {notaHref && (
            <a
              href={notaHref}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-[10px] font-bold text-white/80 transition-colors hover:border-white/30 hover:text-white md:text-[11px]"
            >
              {t("readPost")}
            </a>
          )}
          <a
            href={historyHref}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[10px] font-black text-black transition-transform hover:scale-[1.03] md:text-[11px]"
          >
            {t("history")} →
          </a>
        </div>
      </div>
    </div>
  );
}
