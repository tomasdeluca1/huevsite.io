import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/blog-data";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return { title: 'Post no encontrado' };
  }
  return {
    title: `${post.title} | Blog huevsite.io`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      authors: [post.author.name],
      publishedTime: post.date,
      images: [
        {
          url: `/blog/${params.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`/blog/${params.slug}/opengraph-image`],
    }
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": "Person",
      "name": post.author.name,
      "url": `https://huevsite.io/${post.author.username}`,
    },
    "datePublished": post.date,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-3xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <Link href="/blog" className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] hover:text-white transition-colors">← Volver al Blog</Link>
            <Link href="/" className="logo text-lg scale-75 opacity-50 hover:opacity-100 transition-opacity">huev<span>site</span>.io</Link>
          </div>

          <div className="flex flex-col gap-6 mt-16 mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-white leading-[1.1]">
              {post.title}
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-dim)] leading-relaxed max-w-2xl font-medium">
              {post.excerpt}
            </p>
          </div>

          <div className="flex items-center gap-4 mb-10 pb-10 border-b border-[var(--border)]">
            <Image src={post.author.avatarUrl} alt={post.author.name} width={40} height={40} className="rounded-full" />
            <div>
              <div className="text-sm font-bold text-white tracking-tight">{post.author.name}</div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <span>•</span>
                <span>5 min read</span>
              </div>
            </div>
          </div>
        </header>

        <article className="prose prose-invert prose-lg max-w-none 
          prose-p:text-[var(--text-dim)] prose-p:leading-relaxed prose-p:tracking-[0.01em] 
          prose-headings:text-white prose-headings:font-extrabold prose-headings:tracking-tight
          prose-h2:mt-16 prose-h2:mb-6 prose-h2:text-3xl
          prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-2xl
          prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline prose-a:font-medium
          prose-strong:text-white prose-strong:font-bold
          prose-ul:list-disc prose-ol:list-decimal prose-li:text-[var(--text-dim)] prose-li:marker:text-[var(--text-muted)]
          prose-code:text-[var(--accent)] prose-code:bg-[var(--surface2)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:before:content-none prose-code:after:content-none
          prose-blockquote:border-l-[var(--accent)] prose-blockquote:bg-[var(--surface)] prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:text-white
        ">
          <ReactMarkdown>
            {post.content}
          </ReactMarkdown>
        </article>

        <footer className="mt-24 pt-12 border-t border-[var(--border)] text-center pb-24">
          <div className="bg-gradient-to-br from-[var(--surface2)] to-black/40 border border-[var(--border-bright)] p-10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] rounded-full group-hover:bg-[var(--accent)]/20 transition-colors pointer-events-none" />
            <h3 className="text-2xl font-extrabold text-white mb-3">¿Listo para buildear tu portfolio?</h3>
            <p className="text-[var(--text-dim)] mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Sumate a la comunidad de creadores y armá tu huevsite gratis. O pasate a PRO y dejá que nuestra IA lo arme por vos.
            </p>
            <Link href="/dashboard" className="btn btn-accent inline-flex !rounded-2xl !px-8 !py-4 shadow-[0_0_20px_rgba(200,255,0,0.15)] font-black text-black gap-2 items-center hover:scale-105 transition-transform">
              Crear mi huevsite 🚀
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
