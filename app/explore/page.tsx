import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ExploreClient } from "@/components/explore/ExploreClient";

export const revalidate = 60; // Revalidate simple cache every 60s

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const fromDashboard = params.from === "dashboard";

  // Fetch profiles that have a username set, order by created_at latest
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, name, tagline, accent_color")
    .not("username", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("username", "is", null);

  const totalRegistered = count || 0;
  const { data: { user } } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching explore profiles:", error);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display flex flex-col">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-10 max-w-7xl mx-auto w-full relative z-50">
        <Link href={fromDashboard ? "/dashboard" : "/"} className="logo text-2xl">
          huev<span>site</span>.io
        </Link>
        <div className="flex items-center gap-2">
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-accent text-xs md:text-sm font-bold !px-6 !py-3 !rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--accent)]/20">
            {user ? "Mi huevsite" : "Crear mi huevsite"}
          </Link>
        </div>
      </nav>

      {/* HEADER */}
      <header className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,0,0.05)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] text-[var(--accent)] text-xs font-mono mb-8 justify-center">
            <Sparkles size={14} /> // HALL OF FAME — {totalRegistered} BUILDERS
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
            Inspirate con
            <br />
            <span className="text-[var(--text-muted)] line-through mr-2 inline-block -rotate-1 decoration-[var(--accent)] text-4xl md:text-6xl">
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
      <main className="flex-1 px-6 md:px-10 pb-32 max-w-7xl mx-auto w-full pt-12">
        <ExploreClient initialTotal={totalRegistered} />
      </main>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="logo text-[var(--text-muted)] text-sm font-mono font-bold tracking-tight">
            huevsite.io
          </div>
          <div className="text-xs text-[var(--text-dim)]">Mostrá lo que buildeás.</div>
        </div>
        <div className="flex gap-6">
          <Link href="https://x.com/i/communities/2026312282527932637" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">X Community</Link>
          <Link href="https://discord.gg/qE4CWG6D" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">Discord Community</Link>
          <Link href="https://github.com/tomasdeluca1" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
