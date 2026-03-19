"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BadgeCheck, Loader2, Activity as ActivityIcon, ArrowUpRight, Users, UserPlus } from "lucide-react";

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

const ACTIVITY_LABELS: Record<string, (data: Record<string, string>, username: string) => string> = {
  new_project: (data, u) => `${u} lanzó un proyecto: ${data.projectName ?? ""}`,
  new_block: (data, u) => `${u} agregó un nuevo bloque: ${data.blockType ?? ""}`,
  milestone: (data, u) => `${u} llegó a ${data.value ?? ""} ${data.metric ?? ""}`,
  new_follow: (data, u) => `${u} empezó a seguir a ${data.targetUsername ?? "alguien"}`,
  new_nomination: (data, u) => `${u} nominó a ${data.targetUsername ?? "alguien"} como creador de la semana 🏆`,
  new_endorsement: (data, u) => `${u} dejó un comentario a ${data.targetUsername ?? "alguien"}`,
  pro_upgrade: (data, u) => `${u} se pasó a PRO 🚀`,
  new_builder: (data, u) => `${data.username ?? u} se acaba de unir a huevsite.io 🎉`,
  showcase_winner: (data, u) => `${u} ganó como builder de la semana 🏆🥚`,
  block_update: (data, u) => `${u} hizo cambios en su bloque de ${data.blockType ?? "contenido"} 🛠️`,
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hs = Math.floor(mins / 60);
  if (hs < 24) return `${hs}hs`;
  return `${Math.floor(hs / 24)}d`;
}

function ActivityGroup({ group, index }: { group: Activity[]; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const main = group[0];
  const user = main.user;
  const isMultiple = group.length > 1;
  const profileHref = `/${user.username}?from=feed&return_to=/feed`;

  const getLabel = (activity: Activity) => {
    const label = ACTIVITY_LABELS[activity.type]?.(activity.data, user.name ?? user.username) ?? `${user.username} hizo algo nuevo`;
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
                    +{group.length - 1} updates
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                {timeAgo(main.created_at)}
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
                          {timeAgo(activity.created_at)}
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<"activity" | "launches">("activity");
  const [audienceFilter, setAudienceFilter] = useState<"all" | "following">("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [launches, setLaunches] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const fromDashboard = searchParams.get("from") === "dashboard";
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
        fetch(`/api/social/feed?tab=launches&audience=${audienceFilter}&page=${page}&limit=24`)
          .then(r => r.json())
          .then(data => {
            if (data.error) {
              setError(data.error);
              if (page === 1) setLaunches([]);
              return;
            }
            const newLaunches = data.launches ?? [];
            if (page === 1) setLaunches(newLaunches);
            else setLaunches(prev => [...prev, ...newLaunches]);
            setTotalPages(data.totalPages ?? 1);
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
  }, [tab, page, filterType, audienceFilter, supabase]);

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

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-2xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <Link href={fromDashboard ? "/dashboard" : "/"} className="logo">huev<span>site</span>.io</Link>
          <div className="flex items-center gap-3">
             <Link href="/explore" className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors">← Explorar</Link>
             <Link href={currentUserId ? "/dashboard" : "/login"} className="btn btn-accent !text-[10px] !py-2 !px-4 !rounded-xl">{currentUserId ? "Mi huevsite" : "Crear mi huevsite"}</Link>
          </div>
        </div>
        <div className="section-label mb-2">// comunidad</div>
        <h1 className="text-4xl font-extrabold tracking-tighter">Qué está pasando?</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-dim)]">
          Seguí la actividad real de la comunidad y descubrí proyectos publicados directamente desde los bloques de los builders.
        </p>
        
        <div className="flex gap-2 mt-8 bg-black/20 p-1 rounded-2xl border border-[var(--border)] overflow-hidden">
          {["launches", "activity"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`flex-1 py-3 px-2 text-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-[var(--surface2)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              {t === "launches" ? "Lanzamientos" : "Actividad"}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          {[
            { id: "all", label: "Todos", icon: Users },
            { id: "following", label: "Seguidos", icon: UserPlus },
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
      </header>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : error && audienceFilter === "following" && !currentUserId ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 px-8 border border-dashed border-[var(--border)] rounded-[2.5rem] bg-black/10"
        >
          <div className="w-16 h-16 bg-[var(--surface2)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--accent)] shadow-xl shadow-[var(--accent)]/5">
            <UserPlus size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">Entrá para ver a quién seguís</h3>
          <p className="text-sm text-[var(--text-dim)] font-mono leading-relaxed mb-8 max-w-sm mx-auto">
            El filtro de seguidos arma un feed más relevante con la actividad y los proyectos de tu propia red.
          </p>
          <Link href="/login" className="btn btn-accent inline-flex !rounded-2xl shadow-lg shadow-[var(--accent)]/20">
            Iniciar sesión
          </Link>
        </motion.div>
      ) : tab === "launches" ? (
        launches.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 px-8 border border-dashed border-[var(--border)] rounded-[2.5rem] bg-black/10"
          >
            <div className="w-16 h-16 bg-[var(--surface2)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--accent)] shadow-xl shadow-[var(--accent)]/5">
              <ActivityIcon size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">
              {audienceFilter === "following" ? "Tus seguidos todavía no publicaron proyectos" : "Todavía no encontramos proyectos publicados"}
            </h3>
            <p className="text-sm text-[var(--text-dim)] font-mono leading-relaxed mb-8 max-w-xs mx-auto">
              {audienceFilter === "following"
                ? "Seguí más builders o volvé a Todos para descubrir proyectos públicos del resto de la comunidad."
                : "Cuando un builder agrega un bloque de proyecto, debería aparecer acá automáticamente."}
            </p>
            <Link href="/dashboard" className="btn btn-accent inline-flex !rounded-2xl shadow-lg shadow-[var(--accent)]/20">
              Agregar un proyecto
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {launches.map(launch => (
              <div key={launch.id} className="bg-[var(--surface)] border border-[var(--border)] p-5 md:p-6 rounded-3xl group overflow-hidden">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="w-full md:w-40 lg:w-48 shrink-0">
                    {launch.imageUrl ? (
                      <img
                        src={launch.imageUrl}
                        alt={launch.title}
                        className="w-full aspect-[1.2/1] rounded-2xl object-cover border border-white/10 bg-black"
                      />
                    ) : (
                      <div className="w-full aspect-[1.2/1] rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest">
                        Sin preview
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2 text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)]">
                      <Link href={`/${launch.user.username}?from=feed&return_to=/feed`} className="hover:text-white transition-colors">
                        @{launch.user.username}
                      </Link>
                      <span>•</span>
                      <span>{timeAgo(launch.created_at)}</span>
                      {launch.subSite?.slug && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--accent)]">/{launch.subSite.slug}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold group-hover:text-[var(--accent)] transition-colors text-white tracking-tight">
                          {launch.title}
                        </h2>
                        {launch.description && (
                          <p className="text-sm text-[var(--text-dim)] line-clamp-3 mt-2 leading-relaxed">
                            {launch.description}
                          </p>
                        )}
                      </div>

                      {(launch.user.subscription_tier === 'pro' || !!launch.user.pro_since) && (
                        <BadgeCheck size={18} className="shrink-0 text-[var(--accent)] mt-1" />
                      )}
                    </div>

                    {(launch.metrics || (launch.stack && launch.stack.length > 0)) && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {launch.metrics && (
                          <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest">
                            {launch.metrics}
                          </span>
                        )}
                        {(launch.stack || []).slice(0, 4).map((item: string) => (
                          <span key={item} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wide">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-5">
                      {launch.link && (
                        <Link
                          href={launch.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-accent !rounded-2xl !px-5 !py-3 !text-[11px] uppercase tracking-widest"
                        >
                          Ver proyecto <ArrowUpRight size={14} className="ml-2" />
                        </Link>
                      )}
                      <Link
                        href={`/${launch.user.username}?from=feed&return_to=/feed`}
                        className="btn btn-ghost !rounded-2xl !px-5 !py-3 !text-[11px] uppercase tracking-widest"
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
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
                {audienceFilter === "following" ? "Todavía no hay actividad de tus seguidos" : "Todavía no hay actividad para mostrar"}
              </h3>
              <p className="text-sm text-[var(--text-dim)] font-mono leading-relaxed max-w-sm mx-auto">
                {audienceFilter === "following"
                  ? "Seguí builders para armar un feed más personal con sus movimientos recientes."
                  : "Cuando la comunidad publique cambios, proyectos o hitos, vas a empezar a verlos acá."}
              </p>
            </motion.div>
          ) : (
            activityGroups.map((group, i) => (
              <ActivityGroup key={group[0].id} group={group} index={i} />
            ))
          )}
          
          {loadingMore && (
             <div className="space-y-4">
               {[...Array(2)].map((_, i) => (
                 <div key={i} className="h-24 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
               ))}
             </div>
          )}

          <div id="feed-end-marker" className="h-20 flex items-center justify-center">
            {page >= totalPages && activities.length > 0 && (
              <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest opacity-40">
                — fin de la actividad —
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-[var(--text-dim)]">Cargando comunidad...</div>}>
      <FeedContent />
    </Suspense>
  );
}
