"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Search, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ExploreProfile {
  id: string;
  username: string;
  name: string;
  tagline: string;
  accent_color: string;
  pro_since: string | null;
  followers_count?: number;
  nominations_count?: number;
  endorsements_count?: number;
}

export function ExploreClient({ initialTotal }: { initialTotal: number }) {
  const [profiles, setProfiles] = useState<ExploreProfile[]>([]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadProfiles(0, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, sort]);

  const loadProfiles = async (pageToLoad: number, reset = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const res = await fetch(`/api/explore?page=${pageToLoad}&limit=25&sort=${sort}&q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        // The API sorts pro_since first, then created_at/updated_at.
        if (reset) {
          setProfiles(data.profiles || []);
        } else {
          setProfiles(prev => [...prev, ...(data.profiles || [])]);
        }
        setHasMore(data.hasMore);
      }
    } catch (e) {
      console.error("Error fetching explore profiles:", e);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadProfiles(nextPage);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nombre o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-sm transition-colors text-white placeholder-[var(--text-muted)]"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-[var(--text-dim)] uppercase tracking-wider">Ordenar:</span>
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="bg-[var(--surface)] text-sm border border-[var(--border)] rounded-full px-4 py-2 text-white outline-none focus:border-[var(--accent)] transition-colors appearance-none pr-8 relative cursor-pointer"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px' }}
          >
            <option value="created_at">Más nuevos</option>
            <option value="updated_at">Actualizados hace poco</option>
            <option value="nominations">Más nominados 🏆</option>
            <option value="followers">Más seguidos 👥</option>
            <option value="endorsements">Más endorsements ✨</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center text-[var(--text-muted)]">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-dim)] font-mono text-sm border-y border-dashed border-[var(--border-bright)]">
          No encontramos perfiles que coincidan con tu búsqueda.
        </div>
      ) : (
        <>
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

                {/* Pro Badge */}
                {profile.pro_since && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-yellow-500 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <Sparkles size={10} className="text-yellow-400" />
                    PRO
                  </div>
                )}

                <div className="flex flex-col h-full relative z-10">
                  <div className="mb-auto">
                    <h2 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-white transition-colors pr-8">
                      {profile.name || profile.username}
                    </h2>
                    <p className="text-sm text-[var(--text-dim)] line-clamp-2 leading-relaxed">
                      {profile.tagline || "// builder en modo incógnito"}
                    </p>
                  </div>

                  <div className="flex gap-4 mb-4">
                    {Number(profile.followers_count) > 0 && (
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-xs">{profile.followers_count}</span>
                        <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter">Followers</span>
                      </div>
                    )}
                    {Number(profile.nominations_count) > 0 && (
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-xs">{profile.nominations_count}</span>
                        <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter">Nominado</span>
                      </div>
                    )}
                    {Number(profile.endorsements_count) > 0 && (
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-xs">{profile.endorsements_count}</span>
                        <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter">Endorsed</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 mt-auto flex items-center justify-between border-t border-[var(--border-bright)]/30 group-hover:border-[var(--border-bright)] transition-colors">
                    <div className="font-mono text-xs text-[var(--text-muted)] flex items-center gap-2">
                       <span 
                         className="w-2 h-2 rounded-full inline-block shadow-sm" 
                         style={{ backgroundColor: profile.accent_color || 'var(--accent)', boxShadow: `0 0 8px ${profile.accent_color || 'var(--accent)'}40` }} 
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
                {/* Special border for PRO */}
                {profile.pro_since && (
                   <div className="absolute inset-0 border border-yellow-500/10 rounded-[1.5rem] pointer-events-none group-hover:border-yellow-500/30 transition-colors" />
                )}
              </Link>
            ))}
          </div>

          {hasMore && (
           <div className="flex justify-center mt-8">
             <button
               onClick={handleLoadMore}
               disabled={isFetchingMore}
               className="btn btn-outline border-dashed text-sm font-mono hover:text-white disabled:opacity-50"
             >
               {isFetchingMore ? (
                 <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Cargando...</span>
               ) : (
                 "Cargar más huevsites"
               )}
             </button>
           </div>
          )}
        </>
      )}
    </div>
  );
}
