import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FileText, Sparkles } from "lucide-react";

interface AuthoredPost {
  slug: string;
  title: string;
  excerpt: string | null;
  date: string;
  tags: string[] | null;
}

interface Props {
  username: string;
  accentColor: string;
}

export async function AuthoredPostsCard({ username, accentColor }: Props) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, date, tags")
    .eq("author_username", username)
    .eq("is_published", true)
    .order("date", { ascending: false });

  const posts = (data || []) as AuthoredPost[];
  if (posts.length === 0) return null;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <section
      aria-label="Blog posts publicados sobre este builder"
      className="relative z-10 mb-8 md:mb-10"
    >
      <div className="huevsite-block bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8">
        <div
          className="flex items-center gap-2 mb-1 text-[10px] font-mono uppercase tracking-[0.2em]"
          style={{ color: accentColor }}
        >
          <Sparkles size={12} />
          Reconocimiento de la comunidad
        </div>
        <p className="text-xs md:text-sm text-white/50 mb-4">
          {posts.length === 1
            ? "Post escrito por el equipo de huevsite sobre este builder, a partir de las nominaciones de la comunidad. No fue escrito por ellos."
            : "Posts escritos por el equipo de huevsite sobre este builder, a partir de las nominaciones de la comunidad. No fueron escritos por ellos."}
        </p>

        <ul className="space-y-4 md:space-y-5">
          {posts.map((post) => {
            const isBdls =
              (post.tags || []).includes("builder-de-la-semana") ||
              post.slug.startsWith("builder-de-la-semana-");

            return (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:p-5 transition-colors hover:border-white/30 hover:bg-black/30"
                >
                  <div
                    className="shrink-0 grid place-items-center rounded-xl border border-white/10 bg-black/40 w-11 h-11 md:w-12 md:h-12"
                    style={{ color: accentColor }}
                  >
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isBdls && (
                        <span
                          className="inline-flex items-center text-[9px] font-mono uppercase tracking-[0.18em] rounded-full px-2 py-0.5 border"
                          style={{
                            color: accentColor,
                            borderColor: `${accentColor}55`,
                            backgroundColor: `${accentColor}1a`,
                          }}
                        >
                          Builder de la Semana
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-white/40">
                        {formatDate(post.date)}
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-extrabold text-white leading-snug truncate">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-white/60 leading-relaxed mt-1 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
