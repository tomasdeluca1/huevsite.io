import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Medal } from "lucide-react";
import LocaleToggle from "@/components/LocaleToggle";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";
import { DiscoveryRail } from "@/components/discovery/DiscoveryRail";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("leaderboard");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaOgDescription"),
    },
  };
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const fromDashboard = params.from === "dashboard";
  const t = await getTranslations("leaderboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display flex flex-col">
      <DiscoveryHeader currentUserId={user?.id ?? null} maxWidthClass="max-w-[1440px]" />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 md:px-10 pt-4 pb-32 flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
          {/* HERO */}
          <header className="relative py-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,0,0.06)_0%,transparent_60%)] pointer-events-none" />
            <div className="max-w-3xl mx-auto relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] text-[var(--accent)] text-xs font-mono mb-6 justify-center">
                <Medal size={14} /> {t("badge")}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter mb-4">
                {t("titleLine1")}
                <br />
                <span className="text-[var(--accent)]">{t("titleLine2")}</span>
              </h1>
              <p className="text-base md:text-lg text-[var(--text-dim)] max-w-xl mx-auto leading-relaxed">
                {t("subtitle")}
              </p>
            </div>
          </header>
          <LeaderboardClient currentUserId={user?.id} />
        </div>
        <DiscoveryRail currentUserId={user?.id ?? null} />
      </main>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1440px] mx-auto w-full">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="logo text-[var(--text-muted)] text-sm font-mono font-bold tracking-tight">huevsite.io</div>
          <div className="text-xs text-[var(--text-dim)]">{t("footerTagline")}</div>
        </div>
        <div className="flex gap-6">
          <Link href="/explore" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">{t("navExplore")}</Link>
          <Link href="/feed" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">{t("footerFeed")}</Link>
        </div>
      </footer>
    </div>
  );
}
