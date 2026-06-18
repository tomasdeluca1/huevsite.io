import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BlogPost } from "@/lib/blog-data";

interface RelatedPostsProps {
  posts: BlogPost[];
}

export async function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  const t = await getTranslations("blogUi");

  return (
    <div className="mt-16 pt-12 border-t border-[var(--border)]">
      <h3 className="text-xl font-bold text-white mb-6">{t("relatedHeading")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all hover:-translate-y-1 shadow-sm hover:shadow-[0_0_20px_rgba(200,255,0,0.05)]"
          >
            <div className="flex gap-2 mb-3">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] uppercase font-bold text-[var(--accent)] tracking-wider"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors leading-tight">
              {post.title}
            </h4>
            <p className="text-sm text-[var(--text-dim)] line-clamp-2">
              {post.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
