import Link from "next/link";
import Image from "next/image";
import {
  getPaginatedBlogPosts,
  isBuilderOfTheWeekPost,
  BLOG_POSTS_PER_PAGE,
} from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site-url";

export const metadata = {
  title: "Blog - huevsite.io",
  description: "Noticias, guías y casos de estudio de la comunidad de huevsite.io para empoderar a creadores y builders.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Blog - huevsite.io",
    description: "Noticias, guías y casos de estudio de la comunidad de huevsite.io para empoderar a creadores y builders.",
    url: `${SITE_URL}/blog`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/blog-og-image.png`,
        width: 1200,
        height: 630,
        alt: "huevsite.io blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - huevsite.io",
    description: "Noticias, guías y casos de estudio de la comunidad de huevsite.io.",
    images: [`${SITE_URL}/blog-og-image.png`],
  }
};

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
  const activeTag = searchParams.tag;
  const requestedPage = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const { posts, totalPages, page, allTags, total } = await getPaginatedBlogPosts({
    page: requestedPage,
    pageSize: BLOG_POSTS_PER_PAGE,
    tag: activeTag,
  });

  return (
    <main className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-4xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="logo">huev<span>site</span>.io</Link>
          <div className="flex items-center gap-3" />
        </div>
        <div className="section-label mb-2">// blog y novedades</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white">Detrás del producto</h1>
        <p className="text-[var(--text-dim)] mt-4 max-w-lg text-lg">
          Noticias, lanzamientos, y las historias de los Builders de la Semana. Todo lo que pasa dentro y alrededor de huevsite.
        </p>
        <div className="mt-6 text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
          {total} {total === 1 ? "post" : "posts"}
          {activeTag ? ` · filtrados por #${activeTag}` : ""}
        </div>
      </header>

      {/* Tags Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/blog"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !activeTag
              ? "bg-[var(--accent)] text-black shadow-[0_0_20px_var(--accent-dim)]"
              : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white border border-white/10"
          }`}
        >
          Todos
        </Link>
        {allTags.map((tag) => (
          <Link
            key={tag}
            href={`/blog?tag=${tag}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTag === tag
                ? "bg-[var(--accent)] text-black shadow-[0_0_20px_var(--accent-dim)]"
                : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            #{tag}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center text-[var(--text-muted)]">
          <p className="text-sm">No hay posts para mostrar con este filtro.</p>
          <Link href="/blog" className="inline-block mt-4 text-[var(--accent)] font-bold text-sm hover:underline">
            Ver todos los posts
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
                      <span>{post.readingTime} min read</span>
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
                  <Link href={`/${post.author.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-white">{post.author.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">@{post.author.username}</div>
                    </div>
                    <Image src={post.author.avatarUrl} alt={post.author.name} width={40} height={40} className="rounded-full" />
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
            Página {page} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildPageHref(page - 1, activeTag)}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={buildPageHref(n, activeTag)}
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
                href={buildPageHref(page + 1, activeTag)}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
