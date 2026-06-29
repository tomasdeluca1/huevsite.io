"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Crown, Loader2, ArrowRight } from "lucide-react";

interface LbProfile {
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
  github_commits_year?: number;
  github_commits_month?: number;
  is_winner?: boolean;
}

const TABS = [
  { value: "score", emoji: "🔥" },
  { value: "commits", emoji: "⚡" },
  { value: "followers", emoji: "📈" },
  { value: "nominations", emoji: "🏆" },
  { value: "endorsements", emoji: "💬" },
] as const;

type PrimaryTab = (typeof TABS)[number]["value"];
type CommitsRange = "year" | "month";

/** The actual `sort` sent to /api/explore — commits expands into year/month. */
function effectiveSort(tab: PrimaryTab, range: CommitsRange): string {
  return tab === "commits" ? `commits_${range}` : tab;
}

function metricOf(p: LbProfile, sort: string): number {
  switch (sort) {
    case "followers": return p.followers_count || 0;
    case "nominations": return p.nominations_count || 0;
    case "endorsements": return p.endorsements_count || 0;
    case "commits_year": return p.github_commits_year || 0;
    case "commits_month": return p.github_commits_month || 0;
    default: return p.builder_score || 0;
  }
}

const PAGE_SIZE = 50;

export function LeaderboardClient({ currentUserId }: { currentUserId?: string | null }) {
  const t = useTranslations("leaderboard");
  const [tab, setTab] = useState<PrimaryTab>("score");
  const [commitsRange, setCommitsRange] = useState<CommitsRange>("year");
  const [profiles, setProfiles] = useState<LbProfile[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const sort = effectiveSort(tab, commitsRange);

  const load = useCallback(async (pageToLoad: number, reset: boolean) => {
    reset ? setIsLoading(true) : setIsFetchingMore(true);
    try {
      // Pass a non-"score" (but valid) filter so the API does NOT pin winners/Pro
      // to the top — a ranking must be pure metric order or the rank numbers lie.
      const filterParam = sort === "score" || sort.startsWith("commits") ? "created_at" : sort;
      const res = await fetch(`/api/explore?page=${pageToLoad}&limit=${PAGE_SIZE}&sort=${sort}&filter=${filterParam}&q=`);
      if (res.ok) {
        const data = await res.json();
        const incoming: LbProfile[] = data.profiles || [];
        setProfiles((prev) => (reset ? incoming : [...prev, ...incoming]));
        setHasMore(Boolean(data.hasMore));
      }
    } catch (e) {
      console.error("Leaderboard fetch error", e);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [sort]);

  useEffect(() => {
    setPage(0);
    load(0, true);
  }, [load]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, false);
  };

  const unit = t(`unit_${sort}`);
  const podium = profiles.slice(0, 3);
  const rest = profiles.slice(3);

  return (
    <div className="flex flex-col gap-10">
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.value}
            onClick={() => setTab(tabItem.value)}
            className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${
              tab === tabItem.value
                ? "bg-[var(--accent)] text-black border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20"
                : "bg-[var(--surface2)] text-[var(--text-muted)] border-[var(--border)] hover:text-white hover:border-[var(--border-bright)]"
            }`}
          >
            {t(`tab_${tabItem.value}`)} {tabItem.emoji}
          </button>
        ))}
      </div>

      {/* Commits sub-tabs (year / month) */}
      {tab === "commits" && (
        <div className="flex items-center justify-center gap-2 -mt-6">
          {(["year", "month"] as CommitsRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setCommitsRange(r)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                commitsRange === r
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/40"
                  : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:text-white"
              }`}
            >
              {t(`commits_range_${r}`)}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex justify-center text-[var(--text-muted)]">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-dim)] font-mono text-sm border-y border-dashed border-[var(--border-bright)]">
          {t("empty")}
        </div>
      ) : (
        <>
          {/* Podium */}
          {podium.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 items-end">
              {/* Natural order 1,2,3 so mobile stacks correctly; CSS order centers #1 on desktop (2,1,3). */}
              {[
                { p: podium[0], order: "order-1 sm:order-2" },
                { p: podium[1], order: "order-2 sm:order-1" },
                { p: podium[2], order: "order-3 sm:order-3" },
              ].map(({ p, order }, idx) => {
                if (!p) return <div key={`empty-${idx}`} className={`hidden sm:block ${order}`} />;
                const rank = profiles.indexOf(p) + 1;
                return (
                  <PodiumCard
                    key={p.id}
                    profile={p}
                    rank={rank}
                    value={metricOf(p, sort)}
                    unit={unit}
                    elevated={rank === 1}
                    isMe={!!currentUserId && p.id === currentUserId}
                    orderClass={order}
                  />
                );
              })}
            </div>
          )}

          {/* List */}
          {rest.length > 0 && (
            <div className="flex flex-col gap-2">
              {rest.map((p, i) => (
                <LeaderboardRow
                  key={p.id}
                  profile={p}
                  rank={i + 4}
                  value={metricOf(p, sort)}
                  unit={unit}
                  isMe={!!currentUserId && p.id === currentUserId}
                />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-4">
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
        </>
      )}
    </div>
  );
}

function PodiumCard({
  profile, rank, value, unit, elevated, isMe, orderClass = "",
}: {
  profile: LbProfile; rank: number; value: number; unit: string; elevated: boolean; isMe: boolean; orderClass?: string;
}) {
  const t = useTranslations("leaderboard");
  const accent = profile.accent_color || "var(--accent)";
  const medalColor = rank === 1 ? "#FFD600" : rank === 2 ? "#C0C0C0" : "#CD7F32";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: rank * 0.05 }}
      className={`${elevated ? "sm:-mt-6" : ""} ${orderClass}`}
    >
      <Link
        href={`/${profile.username}`}
        className={`group relative flex flex-col items-center text-center rounded-[2rem] border-2 p-6 transition-all duration-500 ${
          elevated
            ? "border-[var(--accent)]/40 bg-gradient-to-b from-[var(--surface)] to-[var(--bg)] shadow-[0_0_40px_rgba(200,255,0,0.1)]"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)]"
        } ${isMe ? "ring-2 ring-[var(--accent)]" : ""}`}
      >
        {/* Rank medal */}
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center font-black text-black text-sm shadow-lg border-2 border-[var(--bg)]"
          style={{ backgroundColor: medalColor }}
        >
          {rank}
        </div>

        {elevated && (
          <Crown size={22} className="text-[var(--accent)] mb-2 drop-shadow-[0_0_8px_rgba(200,255,0,0.5)]" />
        )}

        <div
          className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-2xl font-black text-black overflow-hidden border-2 mb-4 mt-2"
          style={{
            borderColor: accent,
            background: profile.image ? "var(--surface2)" : `linear-gradient(135deg, ${accent}, #00FF88)`,
          }}
        >
          {profile.image ? (
            <img src={profile.image} alt={profile.name || profile.username} className="w-full h-full object-cover" />
          ) : (
            (profile.name || profile.username).charAt(0).toUpperCase()
          )}
        </div>

        <p className="text-[10px] font-mono text-[var(--accent)] mb-0.5 truncate max-w-full">@{profile.username}</p>
        <h3 className="text-base font-black tracking-tight text-white group-hover:text-[var(--accent)] transition-colors truncate max-w-full">
          {profile.name || profile.username}
        </h3>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-3xl font-[950] tracking-tighter" style={{ color: accent }}>{value}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{unit}</span>
        </div>
        {isMe && <span className="mt-2 text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">{t("you")}</span>}
      </Link>
    </motion.div>
  );
}

function LeaderboardRow({
  profile, rank, value, unit, isMe,
}: {
  profile: LbProfile; rank: number; value: number; unit: string; isMe: boolean;
}) {
  const t = useTranslations("leaderboard");
  const accent = profile.accent_color || "var(--accent)";
  return (
    <Link
      href={`/${profile.username}`}
      className={`group flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all ${
        isMe
          ? "border-[var(--accent)]/50 bg-[var(--accent)]/[0.06]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)] hover:bg-[var(--surface2)]"
      }`}
    >
      <span className="w-7 text-center font-mono font-black text-sm text-[var(--text-muted)] shrink-0">{rank}</span>

      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-black text-black overflow-hidden border shrink-0"
        style={{
          borderColor: `${accent}40`,
          background: profile.image ? "var(--surface2)" : `linear-gradient(135deg, ${accent}, #00FF88)`,
        }}
      >
        {profile.image ? (
          <img src={profile.image} alt={profile.name || profile.username} className="w-full h-full object-cover" />
        ) : (
          (profile.name || profile.username).charAt(0).toUpperCase()
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-white truncate group-hover:text-[var(--accent)] transition-colors">
            {profile.name || profile.username}
          </h3>
          {profile.is_winner && <Trophy size={13} className="text-[var(--accent)] shrink-0" />}
          {profile.pro_since && !profile.is_winner && (
            <span className="text-[8px] font-black tracking-widest text-amber-400/70 shrink-0">PRO</span>
          )}
          {isMe && <span className="text-[8px] font-black uppercase tracking-widest text-[var(--accent)] shrink-0">{t("you")}</span>}
        </div>
        <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">@{profile.username}</p>
      </div>

      <div className="flex items-baseline gap-1 shrink-0">
        <span className="text-lg font-[900] tracking-tight" style={{ color: accent }}>{value}</span>
        <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{unit}</span>
      </div>

      <ArrowRight size={16} className="text-[var(--text-muted)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
    </Link>
  );
}
