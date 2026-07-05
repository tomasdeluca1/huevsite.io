"use client";

import { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LocaleToggle from "@/components/LocaleToggle";
import { BadgeCheck, Loader2, Activity as ActivityIcon, ArrowUpRight, Users, UserPlus, ChevronUp, ChevronLeft, ChevronRight, Rocket, Share2 } from "lucide-react";
import { currentLaunchWeek, addWeeks, weekLabel, compareWeeks, daysUntilWeekClose } from "@/lib/launch-week";
import { parseLaunchShareParams } from "@/lib/launch-share";
import { trackEvent } from "@/lib/track";
import { withHuevsiteUtm } from "@/lib/utm";
import { trackClick } from "@/components/analytics/AnalyticsTracker";
import { DiscoveryRail } from "@/components/discovery/DiscoveryRail";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";

type FeedT = ReturnType<typeof useTranslations>;

interface ActivityUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  accent_color: string;
  subscription_tier?: "free" | "pro";
  pro_since?: string | null;
}

interface Activity {
  id: string;
  type: string;
  data: Record<string, string>;
  created_at: string;
  user: ActivityUser;
}

const ACTIVITY_LABELS: Record<string, (t: FeedT, data: Record<string, string>, username: string) => string> = {
  new_project: (t, data, u) => t("activityNewProject", { u, projectName: data.projectName ?? "" }),
  new_block: (t, data, u) => t("activityNewBlock", { u, blockType: data.blockType ?? "" }),
  milestone: (t, data, u) => t("activityMilestone", { u, value: data.value ?? "", metric: data.metric ?? "" }),
  new_follow: (t, data, u) => t("activityNewFollow", { u, target: data.targetUsername ?? t("someone") }),
  new_nomination: (t, data, u) => t("activityNewNomination", { u, target: data.targetUsername ?? t("someone") }),
  new_endorsement: (t, data, u) => t("activityNewEndorsement", { u, target: data.targetUsername ?? t("someone") }),
  pro_upgrade: (t, data, u) => t("activityProUpgrade", { u }),
  new_builder: (t, data, u) => t("activityNewBuilder", { u: data.username ?? u }),
  showcase_winner: (t, data, u) => t("activityShowcaseWinner", { u }),
  block_update: (t, data, u) => t("activityBlockUpdate", { u, blockType: data.blockType ?? t("contentFallback") }),
};

function timeAgo(date: string, nowLabel: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return nowLabel;
  if (mins < 60) return `${mins}m`;
  const hs = Math.floor(mins / 60);
  if (hs < 24) return `${hs}hs`;
  return `${Math.floor(hs / 24)}d`;
}

function ActivityGroup({ group, index }: { group: Activity[]; index: number }) {
  const t = useTranslations("feed");
  const [isExpanded, setIsExpanded] = useState(false);
  const main = group[0];
  const user = main.user;
  const isMultiple = group.length > 1;
  const profileHref = `/${user.username}?from=feed&return_to=/feed`;

  const getLabel = (activity: Activity) => {
    const label = ACTIVITY_LABELS[activity.type]?.(t, activity.data, user.name ?? user.username) ?? t("activityFallback", { u: user.username });
    return label.replace(user.name ?? user.username, "").trim();
  };

  return (
    <div className="relative group/group-item">
      {isMultiple && !isExpanded && (
        <>
          <div className="absolute inset-x-2 -bottom-1 h-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl opacity-40 z-0" />
          <div className="absolute inset-x-4 -bottom-2 h-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl opacity-20 z-0" />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`relative z-10 p-4 rounded-2xl bg-[var(--surface)] border transition-all cursor-pointer ${
          isExpanded ? 'border-[var(--accent)]/30 ring-1 ring-[var(--accent)]/10 shadow-2xl' : 'border-[var(--border)] hover:border-[var(--border-bright)]'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <Link href={profileHref} onClick={(e) => e.stopPropagation()} className="shrink-0">
            {user.image ? (
              <img
                src={user.image}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
                style={{ borderColor: user.accent_color, borderWidth: 2, borderStyle: "solid" }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black"
                style={{ backgroundColor: user.accent_color }}
              >
                {(user.name ?? user.username)[0]?.toUpperCase()}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  href={profileHref}
                  className="font-bold hover:underline truncate"
                  style={{ color: user.accent_color }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {user.name ?? user.username}
                </Link>
                {(user.subscription_tier === 'pro' || !!user.pro_since) && (
                  <BadgeCheck size={14} className="shrink-0 text-[var(--accent)]" />
                )}
                {isMultiple && !isExpanded && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-[8px] font-black uppercase tracking-tighter border border-[var(--accent)]/20 whitespace-nowrap">
                    {t("moreUpdates", { count: group.length - 1 })}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                {timeAgo(main.created_at, t("now"))}
              </span>
            </div>
            
            <p className="text-sm text-[var(--text-dim)] leading-snug">
              {getLabel(main)}
            </p>

            <AnimatePresence>
              {isExpanded && isMultiple && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                    {group.slice(1).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between gap-4 group/sub">
                        <p className="text-xs text-[var(--text-muted)] group-hover/sub:text-[var(--text-dim)] transition-colors">
                          <span className="opacity-30 mr-2">•</span>
                          {getLabel(activity)}
                        </p>
                        <span className="text-[9px] text-[var(--text-muted)] font-mono opacity-40">
                          {timeAgo(activity.created_at, t("now"))}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FeedContent() {
  const t = useTranslations("feed");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<"activity" | "launches">("launches");
  const [audienceFilter, setAudienceFilter] = useState<"all" | "following">("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [launches, setLaunches] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const fromDashboard = searchParams.get("from") === "dashboard";
  // Shared launch deep-link: /feed?launch=<id>&week=<YYYY-Wxx> scrolls to the
  // card and lights it up so shared links land on the product itself.
  // Lenient parse: some apps percent-encode the `&`, gluing week into launch.
  const { launchId: sharedLaunchId, week: sharedWeek } = parseLaunchShareParams(
    searchParams.get("launch"),
    searchParams.get("week")
  );
  const [launchWeek, setLaunchWeek] = useState<string>(sharedWeek || "");
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [stackFilter, setStackFilter] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const highlightDone = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    setPage(1);
    setActivities([]);
    setLaunches([]);
    setError(null);
  }, [tab, filterType, audienceFilter]);

  useEffect(() => {
    async function loadData() {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const { data: authData } = await supabase.auth.getUser();
      setCurrentUserId(authData.user?.id || null);

      if (tab === "launches") {
        const wk = launchWeek || "";
        fetch(`/api/launches${wk ? `?week=${wk}` : ""}`)
          .then(r => r.json())
          .then(data => {
            setLaunches(data.launches ?? []);
            setVotedIds(data.votedIds ?? []);
            if (!launchWeek && data.week) setLaunchWeek(data.week);
            setTotalPages(1);
          })
          .catch(console.error)
          .finally(() => {
            setLoading(false);
            setLoadingMore(false);
          });
      } else {
        const typeParam = filterType !== "all" ? `&type=${filterType}` : "";
        const activityTab = audienceFilter === "following" ? "following" : "global";
        // Fetch more items to ensure we can group them into at least 5 users
        fetch(`/api/social/feed?tab=${activityTab}&page=${page}&limit=25${typeParam}`)
          .then(r => r.json())
          .then(data => {
            if (data.error) {
              setError(data.error);
              if (page === 1) setActivities([]);
              return;
            }
            const newActivities = data.activities ?? [];
            if (page === 1) setActivities(newActivities);
            else setActivities(prev => [...prev, ...newActivities]);
            setTotalPages(data.totalPages ?? 1);
          })
          .catch(console.error)
          .finally(() => {
            setLoading(false);
            setLoadingMore(false);
          });
      }
    }
    loadData();
  }, [tab, page, filterType, audienceFilter, supabase, launchWeek]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading || loadingMore || page >= totalPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(p => p + 1);
        }
      },
      { threshold: 1.0 }
    );

    const target = document.querySelector("#feed-end-marker");
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages]);

  const activityGroups = useMemo(() => {
    const groups: Activity[][] = [];
    activities.forEach((acc: Activity) => {
      const last = groups[groups.length - 1];
      if (last && last[0].user.id === acc.user.id) last.push(acc);
      else groups.push([acc]);
    });
    return groups;
  }, [activities]);

  const toggleUpvote = async (launchId: string, voted: boolean) => {
    if (!currentUserId) {
      window.location.href = "/login";
      return;
    }
    // optimistic
    setVotedIds(prev => (voted ? prev.filter(id => id !== launchId) : [...prev, launchId]));
    setLaunches(prev => prev.map((l: any) =>
      l.id === launchId ? { ...l, upvoteCount: (l.upvoteCount || 0) + (voted ? -1 : 1) } : l
    ));
    try {
      const res = await fetch(`/api/launches/${launchId}/upvote`, { method: voted ? "DELETE" : "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.upvoteCount === "number") {
        setLaunches(prev => prev.map((l: any) =>
          l.id === launchId ? { ...l, upvoteCount: data.upvoteCount } : l
        ));
      }
    } catch {
      /* keep optimistic state */
    }
  };

  // Scroll to + highlight the shared launch once its card is in the DOM.
  useEffect(() => {
    if (!sharedLaunchId || highlightDone.current || loading || tab !== "launches") return;
    if (!launches.some((l: any) => l.id === sharedLaunchId)) return;
    highlightDone.current = true;
    const target = () => document.getElementById(`launch-${sharedLaunchId}`);
    const isCentered = () => {
      const el = target();
      if (!el) return true;
      const r = el.getBoundingClientRect();
      return Math.abs(r.top + r.height / 2 - window.innerHeight / 2) < window.innerHeight * 0.25;
    };
    requestAnimationFrame(() => {
      target()?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(sharedLaunchId);
      setTimeout(() => setHighlightId(null), 6000);
    });
    // The global `html { scroll-behavior: smooth }` turns every programmatic
    // scroll into an animation, and late re-renders can cancel it mid-flight —
    // re-assert with instant (uncancellable) jumps until the card is centered.
    [900, 2000].forEach((ms) =>
      setTimeout(() => {
        if (!isCentered())
          target()?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "center" });
      }, ms)
    );
  }, [sharedLaunchId, loading, tab, launches]);

  const shareLaunch = async (launch: any) => {
    const url = `${window.location.origin}/feed?launch=${launch.id}&week=${launchWeek || currentLaunchWeek()}`;
    trackEvent("launch_share_click", { launchId: launch.id });
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: launch.title, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const isCurrentWeek = !launchWeek || compareWeeks(launchWeek, currentLaunchWeek()) >= 0;
  const closeDays = daysUntilWeekClose();

  const stackChips = useMemo(() => {
    const freq = new Map<string, number>();
    launches.forEach((l: any) => (l.stack || []).forEach((s: string) => freq.set(s, (freq.get(s) || 0) + 1)));
    return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map((e) => e[0]);
  }, [launches]);
  const shownLaunches = stackFilter
    ? launches.filter((l: any) => (l.stack || []).includes(stackFilter))
    : launches;

  return (
    <div
      className="min-h-screen font-display"
      style={{ background: "radial-gradient(circle at 50% 0%, rgba(200,255,0,0.06), transparent 720px), var(--bg)" }}
    >
      <DiscoveryHeader currentUserId={currentUserId} />
      <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-10 py-10 flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 min-w-0">
      <header className="mb-8 max-w-2xl">
        <div className="section-label mb-2">{t("sectionLabel")}</div>
        <h1 className="text-4xl font-extrabold tracking-tighter">{t("title")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">
          {t("subtitle")}
        </p>
      </header>

      <div className="mb-6 inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-black/20 p-1">
        {(["launches", "activity"] as const).map((tabId) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${tab === tabId ? 'bg-[var(--surface2)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            {tabId === "launches" ? t("tabLaunchesShort") : t("tabActivity")}
          </button>
        ))}
      </div>

        {tab === "activity" && (
        <div className="mt-4 mb-6 flex gap-2">
          {[
            { id: "all", label: t("filterAll"), icon: Users },
            { id: "following", label: t("filterFollowing"), icon: UserPlus },
          ].map((option) => {
            const Icon = option.icon;
            const active = audienceFilter === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setAudienceFilter(option.id as "all" | "following")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  active
                    ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-white/10 bg-white/[0.03] text-[var(--text-muted)] hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon size={14} />
                {option.label}
              </button>
            );
          })}
        </div>
        )}


      {loading ? (
        tab === "launches" ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 sm:gap-4 p-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] animate-pulse">
                <div className="w-7 shrink-0" />
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.06] shrink-0" />
                <div className="flex-1 min-w-0 space-y-2 py-1">
                  <div className="h-4 w-1/2 rounded bg-white/10" />
                  <div className="h-3 w-4/5 rounded bg-white/[0.05]" />
                  <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
                </div>
                <div className="w-12 shrink-0 rounded-xl bg-white/[0.05]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] animate-pulse">
                <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3.5 w-1/3 rounded bg-white/10" />
                  <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
                </div>
                <div className="h-3 w-8 rounded bg-white/[0.05] shrink-0" />
              </div>
            ))}
          </div>
        )
      ) : error && audienceFilter === "following" && !currentUserId ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 px-8 border border-dashed border-[var(--border)] rounded-[2.5rem] bg-black/10"
        >
          <div className="w-16 h-16 bg-[var(--surface2)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--accent)] shadow-xl shadow-[var(--accent)]/5">
            <UserPlus size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">{t("followingLoginTitle")}</h3>
          <p className="text-sm text-[var(--text-dim)] font-mono leading-relaxed mb-8 max-w-sm mx-auto">
            {t("followingLoginBody")}
          </p>
          <Link href="/login" className="btn btn-accent inline-flex !rounded-2xl shadow-lg shadow-[var(--accent)]/20">
            {t("login")}
          </Link>
        </motion.div>
      ) : tab === "launches" ? (
        <div className="space-y-5">
          {/* Week navigation */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => launchWeek && setLaunchWeek(addWeeks(launchWeek, -1))}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <ChevronLeft size={14} /> {t("prevWeek")}
            </button>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest font-mono text-[var(--text-muted)]">{t("launchesOfWeek")}</div>
              <div className="text-sm font-black text-white">{launchWeek ? weekLabel(launchWeek) : "…"}</div>
            </div>
            <button
              onClick={() => { if (!isCurrentWeek && launchWeek) setLaunchWeek(addWeeks(launchWeek, 1)); }}
              disabled={isCurrentWeek}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors disabled:opacity-30"
            >
              {t("nextWeek")} <ChevronRight size={14} />
            </button>
          </div>

          {stackChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStackFilter(null)}
                className={`text-[10px] px-3 py-1 rounded-full border transition-all ${!stackFilter ? "bg-[var(--accent)] text-black border-[var(--accent)] font-black" : "border-white/10 text-white/55 hover:text-white"}`}
              >
                {t("filterStackAll")}
              </button>
              {stackChips.map((s) => (
                <button
                  key={s}
                  onClick={() => setStackFilter(s === stackFilter ? null : s)}
                  className={`text-[10px] px-3 py-1 rounded-full border transition-all ${stackFilter === s ? "bg-[var(--accent)] text-black border-[var(--accent)] font-black" : "border-white/10 text-white/55 hover:text-white"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {shownLaunches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 px-8 border border-dashed border-[var(--border)] rounded-[2.5rem] bg-black/10"
            >
              <div className="w-16 h-16 bg-[var(--surface2)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--accent)] shadow-xl shadow-[var(--accent)]/5">
                <Rocket size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{t("launchesEmptyTitle")}</h3>
              <p className="text-sm text-[var(--text-dim)] font-mono leading-relaxed mb-4 max-w-xs mx-auto">
                {t("launchesEmptyBody")}
              </p>
              {isCurrentWeek && closeDays > 0 && (
                <p className="text-xs font-black uppercase tracking-widest text-[var(--accent)] mb-6">
                  {t("emptyUrgency", { days: closeDays })}
                </p>
              )}
              <Link href="/dashboard" className="btn btn-accent inline-flex !rounded-2xl shadow-lg shadow-[var(--accent)]/20">
                {t("addProject")}
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {shownLaunches.map((launch: any, i: number) => {
                const voted = votedIds.includes(launch.id);
                const rank = i + 1;
                const live = launch.launch?.live || 0;
                return (
                  <div
                    key={launch.id}
                    id={`launch-${launch.id}`}
                    className={`flex gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-3xl border transition-all ${
                      launch.featured
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.04]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)]"
                    }${highlightId === launch.id ? " launch-highlight" : ""}`}
                  >
                    <div className="flex flex-col items-center justify-center w-6 sm:w-7 shrink-0">
                      <span className="text-sm font-black text-[var(--text-muted)]">
                        {!isCurrentWeek && rank === 1 ? "🏆" : rank}
                      </span>
                    </div>

                    {launch.imageUrl ? (
                      <img
                        src={launch.imageUrl}
                        alt={launch.title}
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover border border-white/10 bg-black shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center text-[var(--text-muted)] shrink-0">
                        <Rocket size={20} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-white tracking-tight truncate">{launch.title}</h2>
                        {launch.user.pro && <BadgeCheck size={15} className="shrink-0 text-[var(--accent)]" />}
                        {launch.featured && (
                          <span className="text-[8px] font-black tracking-widest text-[var(--accent)] border border-[var(--accent)]/30 rounded px-1">PRO</span>
                        )}
                      </div>
                      {launch.description && (
                        <p className="text-xs text-[var(--text-dim)] line-clamp-2 mt-0.5 leading-relaxed">{launch.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-2 text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)]">
                        <Link href={`/${launch.user.username}?from=feed&return_to=/feed`} className="hover:text-white transition-colors">
                          @{launch.user.username}
                        </Link>
                        {live > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-[var(--accent)]">🚀 {t("liveBadge", { n: live })}</span>
                          </>
                        )}
                        {launch.link && (
                          <>
                            <span>•</span>
                            <a
                              href={withHuevsiteUtm(launch.link, "feed")}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => launch.userId && launch.blockId && trackClick(launch.userId, launch.blockId)}
                              className="hover:text-white transition-colors inline-flex items-center gap-1"
                            >
                              {t("viewProject")} <ArrowUpRight size={11} />
                            </a>
                          </>
                        )}
                      </div>
                      {launch.stack && launch.stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {launch.stack.slice(0, 4).map((item: string) => (
                            <span key={item} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/50 text-[9px] font-mono">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-stretch gap-1.5 w-11 sm:w-12 shrink-0">
                      <button
                        onClick={() => toggleUpvote(launch.id, voted)}
                        className={`flex flex-col items-center justify-center flex-1 min-h-[3rem] rounded-xl border transition-all ${
                          voted
                            ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-white/10 text-white/60 hover:text-white hover:border-white/30"
                        }`}
                        title={t("upvote")}
                      >
                        <ChevronUp size={16} />
                        <span className="text-xs font-black">{launch.upvoteCount || 0}</span>
                      </button>
                      <button
                        onClick={() => shareLaunch(launch)}
                        className="flex items-center justify-center rounded-xl border border-white/10 py-1.5 text-white/40 transition-all hover:text-white hover:border-white/30"
                        title={t("shareLaunch")}
                        aria-label={t("shareLaunch")}
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activityGroups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 px-8 border border-dashed border-[var(--border)] rounded-[2.5rem] bg-black/10"
            >
              <div className="w-16 h-16 bg-[var(--surface2)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--accent)] shadow-xl shadow-[var(--accent)]/5">
                <ActivityIcon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">
                {audienceFilter === "following" ? t("activityEmptyFollowingTitle") : t("activityEmptyTitle")}
              </h3>
              <p className="text-sm text-[var(--text-dim)] font-mono leading-relaxed max-w-sm mx-auto">
                {audienceFilter === "following"
                  ? t("activityEmptyFollowingBody")
                  : t("activityEmptyBody")}
              </p>
            </motion.div>
          ) : (
            activityGroups.map((group, i) => (
              <ActivityGroup key={group[0].id} group={group} index={i} />
            ))
          )}
          
          {loadingMore && (
             <div className="space-y-4">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] animate-pulse">
                   <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                   <div className="flex-1 min-w-0 space-y-2">
                     <div className="h-3.5 w-1/3 rounded bg-white/10" />
                     <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
                   </div>
                 </div>
               ))}
             </div>
          )}

          <div id="feed-end-marker" className="h-20 flex items-center justify-center">
            {page >= totalPages && activities.length > 0 && (
              <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest opacity-40">
                {t("endOfActivity")}
              </span>
            )}
          </div>
        </div>
      )}
      </div>
      <DiscoveryRail
        currentUserId={currentUserId}
        weekLaunches={launches.map((l: any) => ({ id: l.id, userId: l.userId, title: l.title, upvoteCount: l.upvoteCount, featured: !!l.featured }))}
        week={launchWeek || undefined}
      />
      </div>
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-black text-black shadow-2xl">
          {t("shareLaunchCopied")}
        </div>
      )}
    </div>
  );
}

/** Full-page skeleton that mirrors the real /feed layout (header + 2-col + rail)
 *  so the loading state fills the screen instead of a lonely spinner on black. */
function FeedSkeleton() {
  return (
    <div
      className="min-h-screen font-display"
      style={{ background: "radial-gradient(circle at 50% 0%, rgba(200,255,0,0.06), transparent 720px), var(--bg)" }}
    >
      <div className="border-b border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto w-full px-6 py-5 flex items-center justify-between gap-4">
          <div className="h-5 w-28 rounded bg-white/10 animate-pulse" />
          <div className="h-9 w-72 rounded-xl bg-white/[0.04] animate-pulse hidden md:block" />
          <div className="h-8 w-24 rounded-xl bg-white/10 animate-pulse" />
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-10 py-10 flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
            <div className="h-9 w-80 max-w-full rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-[28rem] max-w-full rounded bg-white/[0.05] animate-pulse" />
          </div>
          <div className="h-8 w-44 rounded-xl bg-white/[0.05] animate-pulse" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] animate-pulse">
                <div className="w-7 shrink-0" />
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.06] shrink-0" />
                <div className="flex-1 min-w-0 space-y-2 py-1">
                  <div className="h-4 w-1/2 rounded bg-white/10" />
                  <div className="h-3 w-4/5 rounded bg-white/[0.05]" />
                  <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
                </div>
                <div className="w-12 shrink-0 rounded-xl bg-white/[0.05]" />
              </div>
            ))}
          </div>
        </div>
        <aside className="w-full lg:w-[320px] lg:shrink-0 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 animate-pulse">
              <div className="mb-3 h-3 w-24 rounded bg-white/10" />
              <div className="h-10 w-full rounded bg-white/[0.05]" />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

export default function FeedPageClient() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent />
    </Suspense>
  );
}
