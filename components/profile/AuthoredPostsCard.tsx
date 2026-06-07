import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Trophy, Sparkles, ArrowUpRight } from "lucide-react";

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

function isBdls(post: AuthoredPost) {
  return (post.tags || []).includes("builder-de-la-semana") || post.slug.startsWith("builder-de-la-semana-");
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

  // Feature the Builder de la Semana post if there is one; otherwise the latest.
  const featured = posts.find(isBdls) || posts[0];
  const extras = posts.filter((p) => p.slug !== featured.slug);
  const featuredIsBdls = isBdls(featured);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <section aria-label="Reconocimiento de la comunidad" className="relative z-10 mb-6 md:mb-8">
      {/* Compact spotlight: one elegant row instead of a heavy full-width list. */}
      <Link
        href={`/blog/${featured.slug}`}
        className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[var(--surface)] p-4 md:p-5 transition-colors hover:border-white/25"
        style={{ borderColor: `${accentColor}33` }}
      >
        <div
          className="shrink-0 grid place-items-center rounded-xl w-11 h-11 md:w-12 md:h-12"
          style={{ color: accentColor, backgroundColor: `${accentColor}1a`, border: `1px solid ${accentColor}40` }}
        >
          {featuredIsBdls ? <Trophy size={20} /> : <Sparkles size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="inline-flex items-center text-[9px] font-mono uppercase tracking-[0.18em] font-bold"
              style={{ color: accentColor }}
            >
              {featuredIsBdls ? "★ Builder de la Semana" : "Reconocido por la comunidad"}
            </span>
            <span className="text-[10px] font-mono text-white/35">{formatDate(featured.date)}</span>
          </div>
          <h3 className="text-base md:text-lg font-extrabold text-white leading-snug line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
            {featured.title}
          </h3>
          <p className="text-[11px] md:text-xs text-white/40 mt-0.5 line-clamp-1">
            Escrito por el equipo de huevsite a partir de las nominaciones de la comunidad.
          </p>
        </div>

        <ArrowUpRight
          size={18}
          className="shrink-0 text-white/30 group-hover:text-white transition-colors"
        />
      </Link>

      {/* Extra notes, as light inline links — no second heavy card. */}
      {extras.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-white/35">
          <span className="font-mono uppercase tracking-widest text-[9px] text-white/25">Más notas</span>
          {extras.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="hover:text-white transition-colors line-clamp-1 max-w-[220px]"
            >
              {p.title}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
