import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Medal } from "lucide-react";
import LocaleToggle from "@/components/LocaleToggle";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";
import { HallOfFameButton } from "@/components/discovery/HallOfFameButton";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { canonical, keywordsFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import { safeJsonLd } from "@/lib/json-ld";
import { breadcrumbLd, collectionPageLd } from "@/lib/structured-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("leaderboard");
  const locale = await getLocale();
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: keywordsFor("leaderboard", locale),
    // ?from=dashboard must not fork the URL.
    alternates: { canonical: canonical("/leaderboard") },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaOgDescription"),
      url: canonical("/leaderboard"),
      siteName: "huevsite.io",
      type: "website",
    },
    twitter: { card: "summary_large_image", title: t("metaTitle"), description: t("metaOgDescription") },
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

  // The ranking rows are fetched client-side by LeaderboardClient, so there's
  // no ItemList to emit here — collectionPageLd omits mainEntity when empty
  // rather than declaring a zero-item list.
  const jsonLd = [
    collectionPageLd({
      name: t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE_URL}/leaderboard`,
      items: [],
    }),
    breadcrumbLd([
      { name: "huevsite.io", path: "/" },
      { name: t("metaTitle"), path: "/leaderboard" },
    ]),
  ];

  return (
    <div
      className="min-h-screen font-display flex flex-col"
      style={{ background: "radial-gradient(circle at 50% 0%, rgba(200,255,0,0.06), transparent 720px), var(--bg)" }}
    >
      {/* Plain <script>, NOT next/script: next/script with
          strategy="beforeInteractive" only ships the tag in the RSC flight
          payload and injects it client-side, leaving the JSON-LD out of the
          server HTML that non-JS crawlers read. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <DiscoveryHeader currentUserId={user?.id ?? null} />
      <HallOfFameButton />

      {/* HERO (full-width; gradient lives on the page wrapper so it never cuts) */}
      <header className="relative py-12 px-6 text-center">
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

      {/* CONTENT (full-width, no rail) */}
      <main className="flex-1 px-6 md:px-10 pb-32 max-w-[1440px] mx-auto w-full pt-4">
        <LeaderboardClient currentUserId={user?.id} />
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
