"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ArrowRight, Search, Loader2, Sparkles, X, Trophy, ChevronDown, Globe } from "lucide-react";
import { motion } from "framer-motion";

import { ScoreInfoModal } from "@/components/social/ScoreInfoModal";
import { CONTINENTS, CONTINENT_LABELS, countriesByContinent, countryName, flagEmoji, type Continent } from "@/lib/countries";

const VALID_EXPLORE_SORTS = new Set([
  "score",
  "created_at",
  "updated_at",
  "followers",
  "nominations",
  "endorsements",
]);

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
  country?: string | null;
}

export function ExploreClient({ initialTotal }: { initialTotal: number }) {
  const t = useTranslations("explore");
  const locale = useLocale();
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

    if (!saved) return defaultValue;

    // Ignore stale Explore values from older UI variants so hidden filters
    // do not exclude valid text search results.
    if (!VALID_EXPLORE_SORTS.has(saved)) {
      localStorage.removeItem(key);
      return defaultValue;
    }

    return saved;
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
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Country / continent filter ("place"). country wins over continent.
  const [continentFilter, setContinentFilter] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("huevsite_explore_continent") || "" : ""
  );
  const [countryFilter, setCountryFilter] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("huevsite_explore_country") || "" : ""
  );
  const [isPlaceOpen, setIsPlaceOpen] = useState(false);
  const placeRef = useRef<HTMLDivElement>(null);
  const grouped = countriesByContinent(locale);

  const placeLabel = countryFilter
    ? `${flagEmoji(countryFilter)} ${countryName(countryFilter, locale)}`
    : continentFilter
      ? CONTINENT_LABELS[continentFilter as Continent]?.[locale === "en" ? "en" : "es"]
      : t("allPlaces");

  const SORT_OPTIONS = [
    { value: "score", label: t("sortScore") },
    { value: "created_at", label: t("sortNew") },
    { value: "updated_at", label: t("sortRecent") },
    { value: "followers", label: t("sortPopular") },
    { value: "nominations", label: t("sortVoted") },
    { value: "endorsements", label: t("sortRecommended") },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
      if (placeRef.current && !placeRef.current.contains(e.target as Node)) {
        setIsPlaceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    localStorage.setItem("huevsite_explore_continent", continentFilter);
    localStorage.setItem("huevsite_explore_country", countryFilter);
    localStorage.setItem("huevsite_explore_last_activity", Date.now().toString());

    const timer = setTimeout(() => {
      setPage(0);
      loadProfiles(0, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, sort, category, continentFilter, countryFilter]);

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
        `/api/explore?page=${pageToLoad}&limit=24&sort=${currentSort}&filter=${category}&q=${encodeURIComponent(search)}&country=${countryFilter}&continent=${continentFilter}`
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
      {/* Refined Toolbar - Slide down entrance */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col lg:flex-row gap-6 items-center justify-between w-full"
      >
        {/* Search Bar Group */}
        <div className="flex items-center gap-3 flex-1 w-full max-w-2xl">
          <div className="relative flex-1 group">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
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
            <span className="hidden md:block text-[11px] font-black uppercase tracking-widest">{t("scoreSystem")}</span>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none hidden md:block">
              <div className="bg-black/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl whitespace-nowrap shadow-2xl">
                <span className="text-[10px] text-[var(--accent)] font-black uppercase tracking-widest block mb-0.5 text-center">{t("scoreTooltipTitle")}</span>
                <span className="text-[9px] text-[var(--text-muted)] font-mono">{t("scoreTooltipSub")}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Sort + Place Controls */}
        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 bg-[var(--surface2)]/40 p-1.5 pl-4 rounded-[32px] border border-[var(--border)] backdrop-blur-sm">
          {/* Place (country / continent) filter */}
          <div className="flex items-center gap-2" ref={placeRef}>
            <Globe size={14} className="text-[var(--text-muted)] hidden sm:block opacity-50 shrink-0" />
            <div className="relative">
              <button
                onClick={() => setIsPlaceOpen((o) => !o)}
                className="flex items-center gap-2 bg-white/5 text-[11px] font-bold uppercase tracking-widest border border-transparent hover:border-white/10 rounded-2xl px-5 py-3 text-white transition-all cursor-pointer whitespace-nowrap max-w-[170px]"
                suppressHydrationWarning
              >
                <span className="truncate">{placeLabel}</span>
                <ChevronDown size={14} className={`transition-transform shrink-0 ${isPlaceOpen ? "rotate-180" : ""}`} />
              </button>
              {isPlaceOpen && (
                <div className="absolute right-0 top-full mt-2 z-[9999] bg-[var(--surface2)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl w-[260px] max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => { setContinentFilter(""); setCountryFilter(""); setIsPlaceOpen(false); }}
                    className={`w-full text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-white/10 ${!continentFilter && !countryFilter ? "text-[var(--accent)]" : "text-white"}`}
                  >
                    🌎 {t("allPlaces")}
                  </button>
                  {CONTINENTS.map((cont) => (
                    <div key={cont} className="border-t border-white/5">
                      <button
                        onClick={() => { setContinentFilter(cont); setCountryFilter(""); setIsPlaceOpen(false); }}
                        className={`w-full text-left px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors hover:bg-white/10 ${continentFilter === cont && !countryFilter ? "text-[var(--accent)]" : "text-white/90"}`}
                      >
                        {CONTINENT_LABELS[cont][locale === "en" ? "en" : "es"]}
                      </button>
                      {grouped[cont].map((c) => (
                        <button
                          key={c.code}
                          onClick={() => { setCountryFilter(c.code); setContinentFilter(""); setIsPlaceOpen(false); }}
                          className={`w-full text-left pl-8 pr-5 py-2 text-[12px] font-medium transition-colors hover:bg-white/10 flex items-center gap-2 ${countryFilter === c.code ? "text-[var(--accent)]" : "text-[var(--text-dim)]"}`}
                        >
                          <span>{flagEmoji(c.code)}</span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-px h-6 bg-white/10 shrink-0" aria-hidden />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] hidden sm:block opacity-50">{t("sortBy")}</span>
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen((o) => !o)}
                className="flex items-center gap-2 bg-white/5 text-[11px] font-bold uppercase tracking-widest border border-transparent hover:border-white/10 rounded-2xl px-5 py-3 text-white transition-all cursor-pointer whitespace-nowrap"
                suppressHydrationWarning
              >
                {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                <ChevronDown size={14} className={`transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
              </button>
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 z-[9999] bg-[var(--surface2)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl min-w-full">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSort(option.value);
                        setCategory(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors hover:bg-white/10 ${sort === option.value ? "text-[var(--accent)]" : "text-white"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <ScoreInfoModal isOpen={isScoreInfoOpen} onClose={() => setIsScoreInfoOpen(false)} />

      {isLoading ? (
        <div className="py-20 flex justify-center text-[var(--text-muted)]">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-dim)] font-mono text-sm border-y border-dashed border-[var(--border-bright)]">
          {t("emptySearch")}
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 pt-10">
            {profiles.map((profile, i) => (
              <ProfileCard 
                key={profile.id} 
                profile={profile} 
                index={i} 
                isMobile={isMobile} 
              />
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
                  <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {t("loading")}</span>
                ) : (
                  t("loadMore")
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileCard({ profile, index, isMobile }: { profile: ExploreProfile; index: number; isMobile: boolean }) {
  const t = useTranslations("explore");
  const [isHovered, setIsHovered] = useState(false);
  const showWinnerBadge = !!profile.is_winner;
  const accentColor = profile.accent_color || 'var(--accent)';

  return (
    <motion.div
      className="relative h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.23, 1, 0.32, 1]
      }}
      style={{ zIndex: isHovered ? 50 : 1 }}
    >
      {/* Premium Winner Badge */}
      {showWinnerBadge && (
        <motion.div
          className="absolute left-1/2 h-7 bg-gradient-to-r from-[var(--accent)] to-[#00FF88] rounded-full flex items-center justify-center pointer-events-none shadow-[0_4px_20px_rgba(200,255,0,0.3)] border border-white/20 z-30"
          initial={{ y: 10, x: "-50%", opacity: 0, scale: 0.8, width: '40px' }}
          animate={isHovered || isMobile 
            ? { y: -14, x: "-50%", opacity: 1, scale: 1, width: '180px' } 
            : { y: -4, x: "-50%", opacity: 0.8, scale: 0.9, width: '120px' } 
          }
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="flex items-center gap-1.5 px-4 overflow-hidden">
            <Sparkles size={11} className="text-black fill-black shrink-0" />
            <span className="text-black font-black text-[9px] uppercase tracking-[0.15em] whitespace-nowrap">
              {(isHovered || isMobile) ? t("winnerBadge") : t("featuredBadge")}
            </span>
          </div>
        </motion.div>
      )}

      {/* Main Card Container */}
      <motion.div 
        className={`h-full relative z-10 rounded-[2rem] transition-all duration-500 overflow-hidden ${
          showWinnerBadge && !isHovered 
            ? 'shadow-[0_0_30px_rgba(200,255,0,0.08)]' 
            : 'shadow-2xl'
        }`}
        animate={{
          scale: isHovered ? 1.02 : 1,
        }}
      >
        <Link
          href={`/${profile.username}`}
          onClick={() => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("huevsite_from_explore", "true");
            }
          }}
          className={`group h-full relative border-2 rounded-[2rem] p-8 transition-all duration-500 flex flex-col min-h-[240px] ${
            showWinnerBadge 
              ? 'border-[var(--accent)]/30 bg-gradient-to-b from-[var(--surface)] to-[var(--bg)]' 
              : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)]'
          }`}
        >
          {/* Winner Aura */}
          {showWinnerBadge && (
            <div 
              className="absolute inset-x-0 -top-24 h-48 opacity-[0.07] pointer-events-none blur-3xl rounded-full"
              style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
            />
          )}

          {/* Background Interactive Glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none"
            style={{ background: `radial-gradient(circle at center, ${accentColor}, transparent 70%)` }}
          />

          {/* Pro Badge - More minimalist */}
          {profile.pro_since && !profile.is_winner && (
            <div className="absolute top-6 right-6 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <span className="text-[9px] font-black tracking-widest text-white/50">PRO</span>
            </div>
          )}

          <div className="flex flex-col h-full relative z-10">
            <div className="mb-auto">
              <div className="flex items-center gap-5 mb-6">
                {/* Avatar with dynamic border */}
                <div className="relative shrink-0">
                  <div 
                    className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black text-black overflow-hidden relative z-10 border-2" 
                    style={{ 
                      borderColor: isHovered ? accentColor : 'transparent',
                      background: profile.image ? 'var(--surface2)' : `linear-gradient(135deg, ${accentColor}, #00FF88)`,
                      transition: 'border-color 0.4s ease'
                    }}
                  >
                    {profile.image ? (
                      <img 
                        src={profile.image} 
                        alt={profile.name || profile.username} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      (profile.name || profile.username).charAt(0).toUpperCase()
                    )}
                  </div>
                  {showWinnerBadge && (
                    <div className="absolute -inset-1 bg-[var(--accent)]/20 blur-md rounded-[1.5rem] -z-10 animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono text-[var(--accent)] mb-1 truncate">
                    @{profile.username}
                  </p>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-xl font-bold tracking-tight text-white group-hover:text-[var(--accent)] transition-colors truncate">
                      {profile.name || profile.username}
                    </h2>
                    {profile.country && (
                      <span className="text-base leading-none shrink-0" title={profile.country}>{flagEmoji(profile.country)}</span>
                    )}
                    {showWinnerBadge && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      >
                        <Trophy size={16} className="text-[var(--accent)] drop-shadow-[0_0_8px_rgba(200,255,0,0.5)]" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-[13px] text-[var(--text-dim)] font-mono line-clamp-2 leading-tight">
                    {profile.tagline || t("creatorFallback")}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats - More refined grid */}
            <div className="grid grid-cols-4 gap-2 mb-8 bg-black/20 backdrop-blur-sm border border-white/5 rounded-2xl p-4">
              <StatItem label={t("statFollowers")} value={profile.followers_count || 0} />
              <StatItem label={t("statVotes")} value={profile.nominations_count || 0} />
              <StatItem label={t("statComments")} value={profile.endorsements_count || 0} />
              <StatItem label={t("statScore")} value={profile.builder_score || 0} isAccent />
            </div>

            {/* Footer */}
            <div className="pt-6 mt-auto flex items-center justify-between border-t border-white/5 transition-colors">
              <div className="font-mono text-[11px] text-[var(--text-muted)] flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ 
                    backgroundColor: accentColor, 
                    boxShadow: `0 0 10px ${accentColor}80` 
                  }}
                />
                <span className="group-hover:text-white transition-colors">/{profile.username}</span>
              </div>
              
              <div
                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 border border-white/10"
                style={{ color: accentColor }}
              >
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

function StatItem({ label, value, isAccent = false }: { label: string; value: number; isAccent?: boolean }) {
  return (
    <div className={`flex flex-col items-center flex-1 ${!isAccent ? 'border-r border-white/5' : ''}`}>
      <span className={`text-[15px] font-black leading-none mb-1.5 ${isAccent ? 'text-[var(--accent)]' : 'text-white'}`}>
        {value}
      </span>
      <span className="text-[7px] text-[var(--text-muted)] uppercase tracking-[0.15em] font-black text-center">
        {label}
      </span>
    </div>
  );
}
