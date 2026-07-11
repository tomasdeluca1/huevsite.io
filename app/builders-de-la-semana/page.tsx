import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/BackButton";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";
import { getAllWinners } from "@/lib/showcase-service";
import { getBdlsSlugsByUsername } from "@/lib/blog-data";
import { BuildersHistoryViews } from "@/components/discovery/BuildersHistoryViews";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Builders de la Semana — huevsite.io";
  const description = "El salón de la fama: cada builder que ganó la semana en Builders Hunt.";
  // openGraph WITHOUT images so the file-based opengraph-image.tsx / twitter-image.tsx
  // provide the picture, while these give this page its own share title/description
  // (otherwise the root OG text cascades in). Mirrors the leaderboard/explore convention.
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BuildersDeLaSemanaPage() {
  const t = await getTranslations("winnerHistory");
  const supabase = await createClient();
  const [winners, bdlsSlugs] = await Promise.all([getAllWinners(), getBdlsSlugsByUsername()]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let username: string | null = null;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    username = prof?.username ?? null;
  }

  return (
    <main className="min-h-screen bg-[#070708]">
      <DiscoveryHeader currentUserId={user?.id ?? null} username={username} />

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-8">
        <BackButton
          label={t("back")}
          fallbackHref="/leaderboard"
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
        />

        <header className="mb-8 mt-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/badge/laurel-dark.png" alt="" className="mx-auto mb-4 h-12 w-auto" />
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{t("title")}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/55 md:text-base">{t("subtitle")}</p>
        </header>

        <BuildersHistoryViews winners={winners} noteSlugs={bdlsSlugs} />
      </div>
    </main>
  );
}
