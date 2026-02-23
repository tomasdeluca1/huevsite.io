import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export const revalidate = 60; // Revalidate simple cache every 60s

export default async function ExplorePage() {
  const supabase = await createClient();

  // Fetch profiles that have a username set, order by created_at latest
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, name, tagline, accent_color")
    .not("username", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching explore profiles:", error);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display flex flex-col">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-[var(--border)] sticky top-0 z-50 bg-[rgba(8,8,8,0.85)] backdrop-blur-xl">
        <Link href="/" className="logo text-lg font-mono font-bold tracking-tight">
          huev<span className="text-[var(--accent)]">site</span>.io
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="btn btn-accent text-sm font-bold">
            Crear mi huevsite →
          </Link>
        </div>
      </nav>

      {/* HEADER */}
      <header className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,0,0.05)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] text-[var(--accent)] text-xs font-mono mb-8 justify-center">
            <Sparkles size={14} /> // HALL OF FAME
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
            Inspirate con
            <br />
            <span className="text-[var(--text-muted)] line-through mr-2 inline-block -rotate-1 decoration-[var(--accent)]">
              portfolios
            </span>
            huevsites.
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-dim)] max-w-xl mx-auto leading-relaxed">
            Mirá los perfiles de los builders más piolas de LATAM. Buscá inspiración y armá el tuyo en 3 minutos.
          </p>
        </div>
      </header>

      {/* GRID */}
      <main className="flex-1 px-6 md:px-10 pb-32 max-w-7xl mx-auto w-full">
        {(!profiles || profiles.length === 0) ? (
          <div className="text-center py-20 text-[var(--text-dim)] font-mono text-sm border-y border-dashed border-[var(--border-bright)]">
            Aún no hay perfiles para mostrar. ¡Sé el primero!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Link
                href={`/${profile.username}`}
                key={profile.id}
                className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-[1.5rem] p-8 hover:border-[var(--border-bright)] transition-all overflow-hidden flex flex-col min-h-[220px]"
              >
                {/* Accent glow on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
                  style={{ backgroundColor: profile.accent_color || 'var(--accent)' }}
                />

                <div className="flex flex-col h-full relative z-10">
                  <div className="mb-auto">
                    <h2 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-white transition-colors">
                      {profile.name || profile.username}
                    </h2>
                    <p className="text-sm text-[var(--text-dim)] line-clamp-2 leading-relaxed">
                      {profile.tagline || "// builder en modo incógnito"}
                    </p>
                  </div>

                  <div className="pt-8 mt-auto flex items-center justify-between border-t border-[var(--border-bright)]/30 group-hover:border-[var(--border-bright)] transition-colors">
                    <div className="font-mono text-xs text-[var(--text-muted)] flex items-center gap-2">
                       <span 
                         className="w-2 h-2 rounded-full inline-block" 
                         style={{ backgroundColor: profile.accent_color || 'var(--accent)' }} 
                       />
                       @{profile.username}
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full bg-[var(--surface2)] flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all border border-[var(--border-bright)]"
                      style={{ color: profile.accent_color || 'var(--accent)' }}
                    >
                       <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="logo text-[var(--text-muted)] text-sm font-mono font-bold tracking-tight">
            huevsite.io
          </div>
          <div className="text-xs text-[var(--text-dim)]">Mostrá lo que buildás.</div>
        </div>
        <div className="flex gap-6">
           <Link href="#" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">Twitter/X</Link>
           <Link href="#" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">Discord</Link>
           <Link href="#" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
