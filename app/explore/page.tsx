import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import LocaleToggle from "@/components/LocaleToggle";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";
import { DiscoveryRail } from "@/components/discovery/DiscoveryRail";

export const revalidate = 60; // Revalidate simple cache every 60s

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const fromDashboard = params.from === "dashboard";

  // Fetch profiles that have a username set, order by created_at latest
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, name, tagline, accent_color")
    .not("username", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  // NOTE: select("id", ...) instead of select("*", ...) so the column-level
  // grants from migration 20260411000000 don't reject this query (it would
  // try to read every column including the now-restricted email,
  // lemon_squeezy_*, etc.). Count queries only need any single granted column.
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("username", "is", null);

  const totalRegistered = count || 0;
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("explore");

  if (error) {
    console.error("Error fetching explore profiles:", error);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display flex flex-col">
      <DiscoveryHeader currentUserId={user?.id ?? null} maxWidthClass="max-w-[1440px]" />

      {/* HEADER */}
      <header className="relative py-12 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,0,0.05)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] text-[var(--accent)] text-xs font-mono mb-8 justify-center">
            <Sparkles size={14} /> {t("badge", { count: totalRegistered })}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">
            {t("titlePrefix")}
            <br />
            <span className="text-[var(--text-muted)] line-through mr-2 inline-block -rotate-1 decoration-[var(--accent)] text-4xl md:text-6xl">
              {t("titleStrikethrough")}
            </span>
            {t("titleSuffix")}
          </h1>
          <p className="text-base md:text-lg text-[var(--text-dim)] max-w-xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </header>

      {/* GRID */}
      <main className="flex-1 px-6 md:px-10 pb-32 max-w-[1440px] mx-auto w-full pt-12">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">
            <ExploreClient initialTotal={totalRegistered} />
          </div>
          <DiscoveryRail currentUserId={user?.id ?? null} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1440px] mx-auto w-full">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="logo text-[var(--text-muted)] text-sm font-mono font-bold tracking-tight">
            huevsite.io
          </div>
          <div className="text-xs text-[var(--text-dim)]">{t("footerTagline")}</div>
        </div>
        <div className="flex gap-6">
          <Link href="https://x.com/i/communities/2026312282527932637" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">X Community</Link>
          <Link href="https://discord.gg/qE4CWG6D" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">Discord Community</Link>
          <Link href="https://github.com/tomasdeluca1" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
