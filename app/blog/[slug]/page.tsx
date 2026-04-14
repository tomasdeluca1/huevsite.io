import { notFound } from "next/navigation";
import Link from "next/link";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import {
  getPostBySlug,
  getPostBySlugAsync,
  getAllBlogPosts,
  BLOG_POSTS,
  getBlogAuthorHref,
  PLATFORM_AUTHOR_USERNAME,
} from "@/lib/blog-data";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import Image from "next/image";
import { SITE_URL } from "@/lib/site-url";

// DB-backed BDLS posts are published ad-hoc — avoid serving cached shells
// from the previous build that don't know about them yet.
export const dynamic = "force-dynamic";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug);
  if (!post) {
    return { title: 'Post no encontrado' };
  }

  const pageUrl = `${SITE_URL}/blog/${slug}`;
  const imageUrl = `${SITE_URL}/blog/${slug}/opengraph-image`;

  return {
    title: `${post.title} | Blog huevsite.io`,
    description: post.excerpt,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: pageUrl,
      authors: [post.author.name],
      publishedTime: post.date,
      images: [
        {
          url: imageUrl,
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
      images: [imageUrl],
    }
  };
}

export default async function BlogPostPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug);

  if (!post) {
    notFound();
  }

  // Use all posts (hardcoded + DB) for navigation
  const allPosts = await getAllBlogPosts();
  const currentIndex = allPosts.findIndex(p => p.slug === post.slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null; // Older
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null; // Newer

  // Find related posts (same tags, excluding current post)
  const relatedPosts = allPosts.filter(
    (p) =>
      p.slug !== post.slug &&
      p.tags.some((tag) => post.tags.includes(tag))
  ).slice(0, 2);

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": post.author.username === PLATFORM_AUTHOR_USERNAME ? "Organization" : "Person",
      "name": post.author.name,
      "url":
        post.author.username === PLATFORM_AUTHOR_USERNAME
          ? SITE_URL
          : `${SITE_URL}/${post.author.username}`,
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
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-white leading-[1.1]">
              {post.title}
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-dim)] leading-relaxed max-w-2xl font-medium">
              {post.excerpt}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between mb-10 pb-10 border-b border-[var(--border)]">
            <div className="flex items-center gap-4">
              <Link href={getBlogAuthorHref(post.author)} className="shrink-0 hover:opacity-80 transition-opacity">
                <Image src={post.author.avatarUrl} alt={post.author.name} width={40} height={40} className="rounded-full" />
              </Link>
              <div>
                <Link href={getBlogAuthorHref(post.author)} className="text-sm font-bold text-white tracking-tight hover:underline">
                  {post.author.name}
                </Link>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                  {post.author.username !== PLATFORM_AUTHOR_USERNAME && (
                    <>
                      <span>@{post.author.username}</span>
                      <span>•</span>
                    </>
                  )}
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  <span>•</span>
                  <span>{post.readingTime} min read</span>
                </div>
              </div>
            </div>
            
            <ShareButtons url={postUrl} title={post.title} />
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        {/* Post Navigation */}
        <div className="mt-16 pt-10 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex-1">
            {prevPost ? (
              <Link href={`/blog/${prevPost.slug}`} className="group flex flex-col gap-2 max-w-[240px]">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">← Anterior</span>
                <span className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-1">{prevPost.title}</span>
              </Link>
            ) : <div />}
          </div>
          
          <div className="flex-1 flex justify-end text-right">
            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`} className="group flex flex-col gap-2 max-w-[240px]">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">Siguiente →</span>
                <span className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-1">{nextPost.title}</span>
              </Link>
            ) : <div />}
          </div>
        </div>

        <RelatedPosts posts={relatedPosts} />

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
