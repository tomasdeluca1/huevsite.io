import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import LocaleToggle from "@/components/LocaleToggle";
import {
  getPaginatedBlogPosts,
  isBuilderOfTheWeekPost,
  BLOG_POSTS_PER_PAGE,
  BLOG_CATEGORIES,
  getBlogAuthorHref,
  PLATFORM_AUTHOR_USERNAME,
} from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site-url";

// Always render fresh: the listing combines static MDX + DB rows (new Builder
// de la Semana posts get published frequently) and uses searchParams for tag
// filter + page number. Without this, Next.js may serve a stale cached shell
// that predates the latest published BDLS posts.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blogUi");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${SITE_URL}/blog`,
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE_URL}/blog`,
      type: "website",
      // og:image is provided by the file-based app/blog/opengraph-image.tsx (the
      // branded dynamic OG, consistent with the rest of the site). Do NOT set a
      // static `images` here — a config-based images array OVERRIDES the file-based
      // OG in Next, silently shadowing the dynamic image.
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescriptionShort"),
      // twitter:image comes from app/blog/twitter-image.tsx — same reason as above.
    },
  };
}

function buildPageHref(page: number, tag?: string) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: { tag?: string; page?: string };
}) {
  const t = await getTranslations("blogUi");

  // `?tag=` now carries a curated category slug (kept as `tag` for URL stability).
  const activeCategory = searchParams.tag;
  const requestedPage = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const { posts, totalPages, page, categoryCounts, total, totalAll } = await getPaginatedBlogPosts({
    page: requestedPage,
    pageSize: BLOG_POSTS_PER_PAGE,
    category: activeCategory,
  });

  const activeCategoryLabel = activeCategory && BLOG_CATEGORIES.some((c) => c.slug === activeCategory)
    ? t(`cat.${activeCategory}`)
    : undefined;

  const pillClass = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active
        ? "bg-[var(--accent)] text-black shadow-[0_0_20px_var(--accent-dim)]"
        : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white border border-white/10"
    }`;

  return (
    <main className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-4xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="logo">huev<span>site</span>.io</Link>
          <div className="flex items-center gap-3">
            <LocaleToggle />
          </div>
        </div>
        <div className="section-label mb-2">{t("sectionLabel")}</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white">{t("indexTitle")}</h1>
        <p className="text-[var(--text-dim)] mt-4 max-w-lg text-lg">
          {t("indexSubtitle")}
        </p>
        <div className="mt-6 text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
          {total} {total === 1 ? t("postSingular") : t("postPlural")}
          {activeCategoryLabel ? ` · ${activeCategoryLabel}` : ""}
        </div>
      </header>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/blog" className={pillClass(!activeCategory)}>
          {t("filterAll")} <span className="opacity-50">· {totalAll}</span>
        </Link>
        {BLOG_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.slug] || 0;
          if (count === 0) return null;
          return (
            <Link key={cat.slug} href={`/blog?tag=${cat.slug}`} className={pillClass(activeCategory === cat.slug)}>
              {t(`cat.${cat.slug}`)} <span className="opacity-50">· {count}</span>
            </Link>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center text-[var(--text-muted)]">
          <p className="text-sm">{t("emptyFilter")}</p>
          <Link href="/blog" className="inline-block mt-4 text-[var(--accent)] font-bold text-sm hover:underline">
            {t("seeAllPosts")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {posts.map((post) => {
            const isBOTW = isBuilderOfTheWeekPost(post);
            return (
              <article
                key={post.slug}
                className="group relative p-6 md:p-8 rounded-[2rem] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(200,255,0,0.05)] flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
              >
                <div className="flex-1">
                  <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                    <span className="absolute inset-0 z-0 rounded-[2rem]" aria-hidden="true" />

                    <div className="relative z-10 flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-3">
                      {isBOTW && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] font-black tracking-[0.15em]">
                          ◆ BDLS
                        </span>
                      )}
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
                      </time>
                      <span>•</span>
                      <span>{t("readingTime", { minutes: post.readingTime })}</span>
                    </div>
                    <div className="relative z-10 flex flex-wrap gap-2 mb-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-wider">#{tag}</span>
                      ))}
                    </div>
                    <h2 className="relative z-10 text-2xl font-bold mb-2 group-hover:text-[var(--accent)] transition-colors text-white tracking-tight">
                      {post.title}
                    </h2>
                    <p className="relative z-10 text-[var(--text-dim)] text-sm leading-relaxed max-w-2xl">
                      {post.excerpt}
                    </p>
                  </Link>
                </div>
                <div className="shrink-0 relative z-20">
                  <Link
                    href={getBlogAuthorHref(post.author)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-white">{post.author.name}</div>
                      {post.author.username !== PLATFORM_AUTHOR_USERNAME && (
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">@{post.author.username}</div>
                      )}
                    </div>
                    {/* unoptimized: builder avatars come from arbitrary hosts (Linktree/Twitter/etc.)
                        not in next.config remotePatterns; the optimizer 400s on them (see article page). */}
                    <Image src={post.author.avatarUrl} alt={post.author.name} width={40} height={40} className="rounded-full object-cover" unoptimized />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-8">
          <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
            {t("pageOf", { page, totalPages })}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildPageHref(page - 1, activeCategory)}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors"
              >
                {t("prev")}
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={buildPageHref(n, activeCategory)}
                className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  n === page
                    ? "bg-[var(--accent)] text-black"
                    : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {n}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={buildPageHref(page + 1, activeCategory)}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors"
              >
                {t("next")}
              </Link>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
