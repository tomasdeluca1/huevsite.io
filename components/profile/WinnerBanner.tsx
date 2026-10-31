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
    <div className="relative z-10 mb-3 md:mb-6">
      {/* En celular no es una tarjeta: sin recuadro, sin degradé y sin botones, una sola
          línea (laurel + título + semana + un link de texto). En md+ vuelve a ser el
          cartel de siempre. */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-none border-0 bg-none px-0 py-0 md:gap-x-3 md:gap-y-2 md:rounded-2xl md:border md:border-[var(--accent)]/30 md:bg-gradient-to-r md:from-[var(--accent)]/[0.12] md:via-[var(--accent)]/[0.04] md:to-transparent md:px-4 md:py-3">
        {/* Full laurel wreath */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badge/laurel-dark.png" alt="" className="h-7 w-auto shrink-0 md:h-10" />

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-black uppercase tracking-wide text-[var(--accent)] leading-tight md:text-sm">
            {t("title")}
          </div>
          {/* La semana sola en celular: "Ganó la semana del …" no entra en una línea. */}
          <div className="font-mono text-[10px] leading-tight text-white/45 md:text-[11px] md:text-white/50">
            <span className="md:hidden">{week}</span>
            <span className="hidden md:inline">{t("wonWeek", { week })}</span>
          </div>
        </div>

        {/* Un solo link en celular: la nota si existe, si no el historial. */}
        <div className="flex shrink-0 items-center gap-2">
          {notaHref && (
            <a
              href={notaHref}
              className="rounded-none border-0 px-0 py-2 text-[11px] font-bold text-[var(--accent)] transition-colors md:rounded-lg md:py-1.5 md:border md:border-white/15 md:px-3 md:text-white/80 md:hover:border-white/30 md:hover:text-white"
            >
              {t("readPost")} <span className="md:hidden" aria-hidden="true">→</span>
            </a>
          )}
          <a
            href={historyHref}
            className={`${notaHref ? "hidden md:inline-block" : ""} rounded-none bg-transparent px-0 py-2 text-[11px] font-bold text-[var(--accent)] transition-transform md:rounded-lg md:bg-[var(--accent)] md:px-3 md:py-1.5 md:font-black md:text-black md:hover:scale-[1.03]`}
          >
            {t("history")} →
          </a>
        </div>
      </div>
    </div>
  );
}
