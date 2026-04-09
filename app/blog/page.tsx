import Link from "next/link";
import { BLOG_POSTS, BlogPost, getAllBlogPosts } from "@/lib/blog-data";
import Image from "next/image";
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

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const allPosts = await getAllBlogPosts();
  const activeTag = searchParams.tag;
  const filteredPosts = activeTag
    ? allPosts.filter((post) => post.tags.includes(activeTag))
    : allPosts;

  const allTags = Array.from(new Set(allPosts.flatMap(post => post.tags)));

  return (
    <main className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-4xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="logo">huev<span>site</span>.io</Link>
          <div className="flex items-center gap-3">
          </div>
        </div>
        <div className="section-label mb-2">// blog y novedades</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white">Detrás del producto</h1>
        <p className="text-[var(--text-dim)] mt-4 max-w-lg text-lg">
          Noticias, lanzamientos de features y mejores prácticas para armar el portfolio perfecto y destacarte en internet.
        </p>
      </header>

      {/* Tags Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/blog"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!activeTag
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
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTag === tag
                ? "bg-[var(--accent)] text-black shadow-[0_0_20px_var(--accent-dim)]"
                : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white border border-white/10"
              }`}
          >
            #{tag}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {filteredPosts.map((post) => (
          <article
            key={post.slug}
            className="group relative p-6 md:p-8 rounded-[2rem] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(200,255,0,0.05)] flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
          >
            <div className="flex-1">
              <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                {/* CSS Magic: Mapea el click a toda el area del article pero permite excepciones por z-index */}
                <span className="absolute inset-0 z-0 rounded-[2rem]" aria-hidden="true" />

                <div className="relative z-10 flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-3">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  <span>•</span>
                  <span>{post.readingTime} min read</span>
                </div>
                <div className="relative z-10 flex gap-2 mb-2">
                  {post.tags.map(tag => (
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
              {/* Author Info (sobrepuesto con un Mayor Z-index) */}
              <Link href={`/${post.author.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">{post.author.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">@{post.author.username}</div>
                </div>
                <Image src={post.author.avatarUrl} alt={post.author.name} width={40} height={40} className="rounded-full" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
