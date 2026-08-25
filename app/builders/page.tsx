import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/lib/locale";
import { SITE_URL } from "@/lib/site-url";
import { canonical, keywordsFor } from "@/lib/seo";
import { safeJsonLd } from "@/lib/json-ld";
import { breadcrumbLd, collectionPageLd } from "@/lib/structured-data";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";
import { flagEmoji } from "@/lib/countries";

/**
 * /builders — the crawlable builder directory.
 *
 * Why this exists next to /explore: /explore renders its list client-side
 * (ExploreClient fetches /api/explore), so the server HTML contains ZERO links
 * to any profile. Crawlers arriving at /explore find no path to a single
 * builder — profiles were discoverable only through the sitemap, which gives
 * discovery but no internal link equity.
 *
 * This page is the opposite trade: no interactivity, every builder is a real
 * <a href="/{username}"> in the server HTML, paginated so the whole roster is
 * reachable in a few hops. /explore stays as the interactive search/filter app.
 */

const PER_PAGE = 60;

type DirectoryProfile = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  tagline: string | null;
  accent_color: string | null;
  country: string | null;
  builder_score: number | null;
  is_winner: boolean | null;
};

function parsePage(raw?: string) {
  const n = parseInt(raw || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Only builders with something to show. A directory that lists empty profiles
 * is a thin-content page, and thin listing pages drag down the whole
 * directory's quality signal — the opposite of what this page is for.
 */
const QUALITY_FILTER = "builder_score.gt.0,tagline.not.is.null";

/**
 * Total indexable builders. Deliberately a standalone head query and NOT the
 * `count` rider on the paged select: PostgREST answers an out-of-range
 * .range() with a 416, so supabase-js hands back an error AND a null count.
 * Deriving the total from that response made every out-of-range page look
 * like an empty directory instead of a page past the end.
 */
async function countBuilders() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles_explore")
    .select("id", { count: "exact", head: true })
    .not("username", "is", null)
    .or(QUALITY_FILTER);
  return count || 0;
}

async function getBuilders(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PER_PAGE;

  const total = await countBuilders();
  if (from >= total) {
    return { builders: [] as DirectoryProfile[], total };
  }

  const { data, error } = await supabase
    .from("profiles_explore")
    .select("id, username, name, image, tagline, accent_color, country, builder_score, is_winner")
    .not("username", "is", null)
    .or(QUALITY_FILTER)
    .order("builder_score", { ascending: false, nullsFirst: false })
    .order("username", { ascending: true })
    .range(from, from + PER_PAGE - 1);

  if (error) {
    console.error("[builders] query error:", error.message);
    return { builders: [] as DirectoryProfile[], total };
  }

  return { builders: (data || []) as DirectoryProfile[], total };
}

function pageHref(page: number) {
  return page <= 1 ? "/builders" : `/builders?page=${page}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { page?: string };
}): Promise<Metadata> {
  const t = await getTranslations("builders");
  const locale = await getLocale();
  const page = parsePage(searchParams.page);

  const title = page > 1 ? t("metaTitlePaged", { page }) : t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    keywords: keywordsFor("explore", locale),
    // Self-referencing canonical on EVERY page, including 2..n. Pointing
    // the paginated pages back at page 1 (a common reflex) would drop them from
    // the index — and with them the only internal links to the builders that
    // live past the first 60, which is the entire reason this page exists.
    alternates: { canonical: canonical(pageHref(page)) },
    openGraph: {
      title,
      description,
      url: canonical(pageHref(page)),
      type: "website",
      siteName: "huevsite.io",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BuildersDirectoryPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const t = await getTranslations("builders");
  const page = parsePage(searchParams.page);
  const { builders, total } = await getBuilders(page);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Past the last page is a real 404. This segment deliberately has NO
  // loading.tsx: one would wrap it in a Suspense boundary, Next would flush the
  // shell with a committed 200, and notFound() could then only swap the UI.
  // See components/RouteLoader for the whole story.
  if (page > totalPages) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const jsonLd = [
    collectionPageLd({
      name: page > 1 ? t("metaTitlePaged", { page }) : t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE_URL}${pageHref(page)}`,
      items: builders.map((b) => ({
        name: b.name || `@${b.username}`,
        url: `${SITE_URL}/${b.username}`,
        description: b.tagline || undefined,
      })),
    }),
    breadcrumbLd([
      { name: "huevsite.io", path: "/" },
      { name: t("breadcrumb"), path: "/builders" },
    ]),
  ];

  // Window of numbered page links around the current one, always including the
  // first and last, so every page is reachable within two clicks from any other.
  const pageWindow = Array.from(
    new Set<number>([1, totalPages, page - 1, page, page + 1])
  )
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  return (
    <div
      className="min-h-screen font-display flex flex-col"
      style={{ background: "radial-gradient(circle at 50% 0%, rgba(200,255,0,0.06), transparent 720px), var(--bg)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <DiscoveryHeader currentUserId={user?.id ?? null} />

      <header className="relative py-12 px-6 text-center">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] text-[var(--accent)] text-xs font-mono mb-6 justify-center">
            <Compass size={14} /> {t("badge", { count: total })}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">
            {t("titleLine1")}{" "}
            <span className="text-[var(--accent)]">{t("titleLine2")}</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-dim)] max-w-xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </header>

      <main className="flex-1 px-6 md:px-10 pb-24 max-w-[1440px] mx-auto w-full">
        {builders.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[var(--text-dim)]">{t("empty")}</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 list-none p-0">
            {builders.map((b) => {
              const accent = b.accent_color || "var(--accent)";
              const display = b.name || b.username;
              return (
                <li key={b.id}>
                  <Link
                    href={`/${b.username}`}
                    className="group flex h-full flex-col gap-3 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--border-bright)]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] text-base font-black text-black"
                        style={{
                          background: b.image ? "var(--surface2)" : `linear-gradient(135deg, ${accent}, #00FF88)`,
                        }}
                      >
                        {b.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.image}
                            alt={display}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          display.charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[11px] text-[var(--accent)]">
                          @{b.username}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <h2 className="truncate text-base font-bold tracking-tight text-white transition-colors group-hover:text-[var(--accent)]">
                            {display}
                          </h2>
                          {b.country && (
                            <span className="shrink-0 text-sm leading-none">{flagEmoji(b.country)}</span>
                          )}
                        </span>
                      </span>
                    </div>

                    {/* The tagline is the unique, indexable text each card
                        contributes — never collapse it to an icon. */}
                    <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-[var(--text-dim)]">
                      {b.tagline || t("noTagline")}
                    </p>

                    <span className="mt-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                      {t("scoreLabel")} {b.builder_score ?? 0}
                      {b.is_winner && (
                        <span className="text-[var(--accent)]">· {t("winnerLabel")}</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          // Real <a> links, not a client-side "load more". This is the ladder a
          // crawler climbs to reach every builder past the first page.
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label={t("paginationLabel")}>
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-dim)] transition-colors hover:border-[var(--border-bright)] hover:text-white">
                {t("prev")}
              </Link>
            )}
            {pageWindow.map((n, i) => (
              <span key={n} className="flex items-center gap-2">
                {i > 0 && pageWindow[i - 1] !== n - 1 && (
                  <span className="text-[var(--text-muted)]">…</span>
                )}
                <Link
                  href={pageHref(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    n === page
                      ? "bg-[var(--accent)] text-black font-bold"
                      : "border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-bright)] hover:text-white"
                  }`}
                >
                  {n}
                </Link>
              </span>
            ))}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-dim)] transition-colors hover:border-[var(--border-bright)] hover:text-white">
                {t("next")}
              </Link>
            )}
          </nav>
        )}
      </main>

      <footer className="mx-auto w-full max-w-[1440px] border-t border-[var(--border)] px-6 py-10 text-center">
        <p className="mb-4 text-sm text-[var(--text-dim)]">{t("ctaSub")}</p>
        <Link href="/login" className="btn btn-primary">
          {t("ctaButton")}
        </Link>
      </footer>
    </div>
  );
}
