import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllWinners } from "@/lib/showcase-service";
import { getBdlsSlugsByUsername } from "@/lib/blog-data";
import { weekLabel } from "@/lib/launch-week";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Builders de la Semana — huevsite.io",
    description: "El salón de la fama: cada builder que ganó la semana en Builders Hunt.",
  };
}

export default async function BuildersDeLaSemanaPage() {
  const locale = await getLocale();
  const t = await getTranslations("winnerHistory");
  const [winners, bdlsSlugs] = await Promise.all([getAllWinners(), getBdlsSlugsByUsername()]);

  return (
    <main className="min-h-screen bg-[#070708] px-4 pb-24 pt-10 md:pt-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
        >
          ← {t("backToRanking")}
        </Link>

        <header className="mb-10 mt-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/badge/laurel-dark.png" alt="" className="mx-auto mb-4 h-12 w-auto" />
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{t("title")}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/55 md:text-base">{t("subtitle")}</p>
        </header>

        {winners.length === 0 ? (
          <p className="text-center text-sm text-white/40">{t("empty")}</p>
        ) : (
          <ol className="space-y-2.5">
            {winners.map((w) => {
              const noteSlug = bdlsSlugs[w.username.toLowerCase()];
              const hasNote = !!noteSlug;
              return (
                <li
                  key={`${w.week}-${w.username}`}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:border-[#C8FF00]/30"
                >
                  <span className="w-28 shrink-0 font-mono text-[11px] font-bold text-[#C8FF00]/80">
                    {weekLabel(w.week, locale)} {w.week.slice(0, 4)}
                  </span>

                  <Link href={`/${w.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                    {w.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.image} alt={w.name} className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C8FF00] to-[#00FF88] text-sm font-black text-black">
                        {w.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white">{w.name}</span>
                      <span className="block truncate font-mono text-[11px] text-white/40">@{w.username} · {w.builderScore} score</span>
                    </span>
                  </Link>

                  <div className="flex shrink-0 items-center gap-2">
                    {hasNote && (
                      <Link
                        href={`/blog/${noteSlug}`}
                        className="rounded-lg border border-white/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/70 transition-colors hover:border-white/30 hover:text-white"
                      >
                        {t("readPost")}
                      </Link>
                    )}
                    <Link
                      href={`/${w.username}`}
                      className="rounded-lg bg-[#C8FF00] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black"
                    >
                      {t("profile")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </main>
  );
}
