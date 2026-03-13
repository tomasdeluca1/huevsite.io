"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Search, Loader2, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";

import { ScoreInfoModal } from "@/components/social/ScoreInfoModal";

interface ExploreProfile {
  id: string;
  username: string;
  name: string;
  image?: string | null;
  tagline: string;
  accent_color: string;
  pro_since: string | null;
  followers_count?: number;
  nominations_count?: number;
  endorsements_count?: number;
  builder_score?: number;
  is_winner?: boolean;
}

export function ExploreClient({ initialTotal }: { initialTotal: number }) {
  const [profiles, setProfiles] = useState<ExploreProfile[]>([]);
  const [page, setPage] = useState(0);

  const getInitialState = (key: string, defaultValue: string) => {
    if (typeof window === "undefined") return defaultValue;
    const saved = localStorage.getItem(key);
    const savedTime = localStorage.getItem("huevsite_explore_last_activity");

    if (savedTime) {
      const isExpired = Date.now() - parseInt(savedTime) > 20 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem("huevsite_explore_sort");
        localStorage.removeItem("huevsite_explore_category");
        localStorage.removeItem("huevsite_explore_search");
        sessionStorage.removeItem("huevsite_explore_list");
        return key === "huevsite_explore_category" ? "score" : defaultValue;
      }
    }

    return saved || defaultValue;
  };

  const [search, setSearch] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("huevsite_explore_search") || "" : ""
  );
  const [sort, setSort] = useState(() => getInitialState("huevsite_explore_sort", "score"));
  const [category, setCategory] = useState(() => getInitialState("huevsite_explore_category", "score"));

  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isScoreInfoOpen, setIsScoreInfoOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update activity timestamp and save filters
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Clear the "from explore" flag on mount so navigation doesn't stick
    sessionStorage.removeItem("huevsite_from_explore");

    localStorage.setItem("huevsite_explore_search", search);
    localStorage.setItem("huevsite_explore_sort", sort);
    localStorage.setItem("huevsite_explore_category", category);
    localStorage.setItem("huevsite_explore_last_activity", Date.now().toString());

    const timer = setTimeout(() => {
      setPage(0);
      loadProfiles(0, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, sort, category]);

  // Store profile list for navigation context
  useEffect(() => {
    if (profiles.length > 0) {
      const usernames = profiles.map(p => p.username);
      sessionStorage.setItem("huevsite_explore_list", JSON.stringify(usernames));
    }
  }, [profiles]);

  const loadProfiles = async (pageToLoad: number, reset = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const currentSort = category === 'created_at' ? 'created_at' : (category === 'score' ? 'score' : sort);
      const res = await fetch(
        `/api/explore?page=${pageToLoad}&limit=24&sort=${currentSort}&filter=${category}&q=${encodeURIComponent(search)}`
      );
      if (res.ok) {
        const data = await res.json();
        // The API sorts pro_since first, then created_at/updated_at.
        if (reset) {
          setProfiles(data.profiles || []);
        } else {
          setProfiles((prev) => [...prev, ...(data.profiles || [])]);
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
    <div className="flex flex-col gap-10 font-display">
      {/* Refined Toolbar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between w-full">
        {/* Search Bar Group */}
        <div className="flex items-center gap-3 flex-1 w-full max-w-2xl">
          <div className="relative flex-1 group">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
            <input
              type="text"
              placeholder="Buscar builders, proyectos o palabras clave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-12 py-5 rounded-[32px] bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)]/50 focus:ring-4 focus:ring-[var(--accent)]/5 outline-none text-[16px] transition-all text-white placeholder-[var(--text-dim)] shadow-xl shadow-black/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-muted)] transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsScoreInfoOpen(true)}
            className="flex items-center gap-2 h-[60px] px-6 rounded-[32px] bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--accent)]/50 hover:text-white transition-all group shrink-0 relative"
          >
            <Sparkles size={18} className="text-[var(--accent)] group-hover:scale-110 transition-transform" />
            <span className="hidden md:block text-[11px] font-black uppercase tracking-widest">Score System</span>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none hidden md:block">
              <div className="bg-black/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl whitespace-nowrap shadow-2xl">
                <span className="text-[10px] text-[var(--accent)] font-black uppercase tracking-widest block mb-0.5 text-center">Cómo sumás puntos?</span>
                <span className="text-[9px] text-[var(--text-muted)] font-mono">Ver desglose del ranking</span>
              </div>
            </div>
          </button>
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-4 w-full lg:w-auto shrink-0 bg-[var(--surface2)]/40 p-1.5 pl-6 rounded-[32px] border border-[var(--border)] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] hidden sm:block opacity-50">Ordenar por:</span>
            <div className="relative w-48 sm:w-64">
              <select
                value={sort}
                onChange={(e) => {
                  const newSort = e.target.value;
                  setSort(newSort);
                  setCategory(newSort);
                }}
                className="w-full bg-white/5 text-[11px] font-bold uppercase tracking-widest border border-transparent hover:border-white/10 rounded-2xl px-5 py-3 text-white outline-none focus:bg-white/10 transition-all cursor-pointer appearance-none pr-10"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.1em",
                }}
              >
                <option value="score">Destacados por Builder Score 🔥</option>
                <option value="created_at">Nuevos Builders en la comunidad ⚡</option>
                <option value="updated_at">Actividad más reciente 🔄</option>
                <option value="followers">Tendencias y más populares 📈</option>
                <option value="nominations">Más votados por la comunidad 🏆</option>
                <option value="endorsements">Perfiles con más recomendaciones 💬</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <ScoreInfoModal isOpen={isScoreInfoOpen} onClose={() => setIsScoreInfoOpen(false)} />

      {isLoading ? (
        <div className="py-20 flex justify-center text-[var(--text-muted)]">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-dim)] font-mono text-sm border-y border-dashed border-[var(--border-bright)]">
          No encontramos perfiles que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 pt-10">
            {profiles.map((profile, i) => {
              const showWinnerBadge = !!profile.is_winner;
              return (
                <motion.div
                  key={profile.id}
                  className="relative group/wrapper h-full pt-10"
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  variants={{
                    initial: { opacity: 0, y: 15 },
                    animate: { opacity: 1, y: 0 },
                    hover: { zIndex: 50 },
                  }}
                  transition={{
                    duration: 0.4,
                    delay: Math.min(i * 0.05, 0.5),
                    ease: "easeOut"
                  }}
                >
                  {showWinnerBadge && (
                    <motion.div
                      className="absolute left-8 right-8 h-10 bg-[var(--accent)] rounded-t-xl flex items-start justify-center pt-2 pointer-events-none z-0 shadow-[0_-5px_20px_rgba(200,255,0,0.15)]"
                      style={{ top: '40px' }} // Exactly at the card's top edge
                      variants={{
                        hover: { 
                          y: -36, 
                          transition: { type: "spring", stiffness: 400, damping: 25 } 
                        },
                        initial: { y: 0 },
                        animate: {
                          y: [-3, -10, -3],
                          transition: {
                            y: {
                              repeat: Infinity,
                              duration: 2.5,
                              ease: "easeInOut"
                            }
                          }
                        },
                        mobile: { y: -36 }
                      }}
                      animate={isMobile ? "mobile" : "animate"}
                    >
                      <div className="flex items-center gap-1.5 px-3">
                        <Sparkles size={11} className="text-black fill-black" />
                        <span className="text-black font-black text-[10px] uppercase tracking-[0.1em] whitespace-nowrap">
                          Creador de la semana
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <motion.div className="h-full relative z-10 bg-[var(--bg)] rounded-[1.5rem]">
                    <Link
                      href={`/${profile.username}`}
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          sessionStorage.setItem("huevsite_from_explore", "true");
                        }
                      }}
                      className="group h-full relative border border-[var(--border)] bg-[var(--surface)] rounded-[1.5rem] p-8 hover:border-[var(--border-bright)] transition-all overflow-hidden flex flex-col min-h-[220px] shadow-2xl"
                    >
                      {/* Accent glow on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
                        style={{ backgroundColor: profile.accent_color || 'var(--accent)' }}
                      />

                      {/* Pro Badge */}
                      {profile.pro_since && !profile.is_winner && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] z-20 backdrop-blur-sm">
                          <Sparkles size={12} className="text-amber-400 animate-pulse" />
                          PRO
                        </div>
                      )}

                      <div className="flex flex-col h-full relative z-10">
                        <div className="mb-auto">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-lg font-black text-black shadow-sm" style={{ background: profile.image ? 'transparent' : `linear-gradient(135deg, ${profile.accent_color || 'var(--accent)'}, #00FF88)` }}>
                              {profile.image ? (
                                <img src={profile.image} alt={profile.name || profile.username} className="w-full h-full object-cover rounded-full border border-[var(--border)] bg-[var(--surface2)]" />
                              ) : (
                                (profile.name || profile.username).charAt(0).toUpperCase()
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h2 className="text-xl font-bold tracking-tight mb-1 group-hover:text-white transition-colors truncate pr-8">
                                {profile.name || profile.username}
                              </h2>
                              <p className="text-[13px] text-[var(--text-dim)] font-mono line-clamp-2 leading-relaxed">
                                {profile.tagline || "Creator"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-8 mb-6 p-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl">
                          <div className="flex flex-col items-center flex-1 px-1 border-r border-white/5">
                            <span className="text-white font-black text-sm leading-none mb-1">{profile.followers_count || 0}</span>
                            <span className="text-[7px] text-[var(--text-muted)] uppercase tracking-[0.1em] font-mono">Seguidores</span>
                          </div>

                          <div className="flex flex-col items-center flex-1 px-1 border-r border-white/5">
                            <span className="text-white font-black text-sm leading-none mb-1">{profile.nominations_count || 0}</span>
                            <span className="text-[7px] text-[var(--text-muted)] uppercase tracking-[0.1em] font-mono">Votos</span>
                          </div>

                          <div className="flex flex-col items-center flex-1 px-1 border-r border-white/5">
                            <span className="text-white font-black text-sm leading-none mb-1">{profile.endorsements_count || 0}</span>
                            <span className="text-[7px] text-[var(--text-muted)] uppercase tracking-[0.1em] font-mono">Comentarios</span>
                          </div>

                          <div className="flex flex-col items-center flex-1 px-1">
                            <span className="text-[var(--accent)] font-black text-sm leading-none mb-1">{profile.builder_score || 0}</span>
                            <span className="text-[7px] text-[var(--accent)]/60 uppercase tracking-[0.1em] font-mono">Score</span>
                          </div>
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
                      {/* Special border for Winner or PRO */}
                      {profile.is_winner ? (
                        <div className="absolute inset-0 border-2 border-[var(--accent)]/30 rounded-[1.5rem] pointer-events-none transition-colors shadow-[inset_0_0_20px_rgba(200,255,0,0.05)]" />
                      ) : profile.pro_since ? (
                        <div className="absolute inset-0 border border-amber-500/20 rounded-[1.5rem] pointer-events-none group-hover:border-amber-500/50 transition-colors shadow-[inset_0_0_15px_rgba(245,158,11,0.05)]" />
                      ) : null}
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
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
        </div>
      )}
    </div>
  );
}
