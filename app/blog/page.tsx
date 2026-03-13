import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-data";
import Image from "next/image";

export const metadata = {
  title: "Blog - huevsite.io",
  description: "Noticias, guías y casos de estudio de la comunidad de huevsite.io para empoderar a creadores y builders.",
  openGraph: {
    title: "Blog - huevsite.io",
    description: "Noticias, guías y casos de estudio de la comunidad de huevsite.io para empoderar a creadores y builders.",
    type: "website",
    images: [
      {
        url: "/blog-og-image.png",
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
    images: ["/blog-og-image.png"],
  }
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-4xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="logo">huev<span>site</span>.io</Link>
          <div className="flex items-center gap-3">
            <Link href="/explore" className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] hover:text-white transition-colors">← Explorar</Link>
          </div>
        </div>
        <div className="section-label mb-2">// blog y novedades</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white">Detrás del producto</h1>
        <p className="text-[var(--text-dim)] mt-4 max-w-lg text-lg">
          Noticias, lanzamientos de features y mejores prácticas para armar el portfolio perfecto y destacarte en internet.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block p-6 md:p-8 rounded-[2rem] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(200,255,0,0.05)]"
          >
            <article className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex-1">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                </div>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-[var(--accent)] transition-colors text-white tracking-tight">
                  {post.title}
                </h2>
                <p className="text-[var(--text-dim)] text-sm leading-relaxed max-w-2xl">
                  {post.excerpt}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">{post.author.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">@{post.author.username}</div>
                </div>
                <Image src={post.author.avatarUrl} alt={post.author.name} width={40} height={40} className="rounded-full" />
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
