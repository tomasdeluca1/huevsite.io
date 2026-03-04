"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChevronUp, Activity, Compass, User } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface ActivityUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  accent_color: string;
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
  if (mins < 60) return `hace ${mins}m`;
  const hs = Math.floor(mins / 60);
  if (hs < 24) return `hace ${hs}h`;
  return `hace ${Math.floor(hs / 24)}d`;
}

export default function FeedPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<"global" | "following" | "launches">("global");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [launches, setLaunches] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const fromDashboard = searchParams.get("from") === "dashboard";
  const supabase = createClient();

  // Reset page when tab or filter changes
  useEffect(() => {
    setPage(1);
    setActivities([]);
  }, [tab, filterType]);

  useEffect(() => {
    async function loadData() {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const { data: authData } = await supabase.auth.getUser();
      setCurrentUserId(authData.user?.id || null);

      if (tab === "launches") {
        const { data, error } = await supabase
          .from("launches")
          .select(`
            *,
            profiles (username, name, image)
          `)
          .order("created_at", { ascending: false })
          .limit(50);

        if (data && !error) {
          if (authData.user) {
            const { data: upvotes } = await supabase
              .from("launch_upvotes")
              .select("launch_id")
              .eq("user_id", authData.user.id);
            const upvotedIds = new Set(upvotes?.map(u => u.launch_id) || []);
            setLaunches(data.map((l: any) => ({ ...l, hasUpvoted: upvotedIds.has(l.id) })));
          } else {
            setLaunches(data.map((l: any) => ({ ...l, hasUpvoted: false })));
          }
        }
        setLoading(false);
        setLoadingMore(false);
      } else {
        const typeParam = filterType !== "all" ? `&type=${filterType}` : "";
        fetch(`/api/social/feed?tab=${tab}&page=${page}&limit=20${typeParam}`)
          .then(r => r.json())
          .then(data => {
            if (page === 1) {
              setActivities(data.activities ?? []);
            } else {
              setActivities(prev => [...prev, ...(data.activities ?? [])]);
            }
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
  }, [tab, page, filterType, supabase]);

  const handleUpvote = async (launch: any) => {
    if (!currentUserId) {
      alert("Iniciá sesión para votar");
      return;
    }

    const newHasUpvoted = !launch.hasUpvoted;
    const change = newHasUpvoted ? 1 : -1;

    setLaunches(launches.map(l =>
      l.id === launch.id
        ? { ...l, hasUpvoted: newHasUpvoted, upvotes: l.upvotes + change }
        : l
    ));

    if (newHasUpvoted) {
      await supabase.from('launch_upvotes').insert({ launch_id: launch.id, user_id: currentUserId });
      // Assuming RLS allows it or using a simpler un-secured query for demo
      await supabase.from('launches').update({ upvotes: launch.upvotes + 1 }).eq('id', launch.id);
    } else {
      await supabase.from('launch_upvotes').delete().eq('launch_id', launch.id).eq('user_id', currentUserId);
      await supabase.from('launches').update({ upvotes: Math.max(0, launch.upvotes - 1) }).eq('id', launch.id);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-2xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <Link href={fromDashboard ? "/dashboard" : "/"} className="logo">huev<span>site</span>.io</Link>
          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className="hidden sm:flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors pr-2"
            >
              ← Explorar
            </Link>
            <Link
              href={currentUserId ? "/dashboard" : "/login"}
              className="btn btn-accent !text-[10px] !py-2 !px-4 !rounded-xl shadow-lg shadow-[var(--accent)]/10"
            >
              {currentUserId ? "Mi huevsite" : "Crear mi huevsite"}
            </Link>
          </div>
        </div>
        <div className="section-label mb-2">// actividad reciente</div>
        <h1 className="text-4xl font-extrabold tracking-tighter">Comunidad</h1>
        <p className="section-sub mt-2">Lo que está pasando ahora mismo.</p>

        <div className="flex gap-4 mt-8 bg-black/20 p-1.5 rounded-2xl border border-[var(--border)] w-full max-w-sm">
          <button
            onClick={() => setTab("launches")}
            className={`flex-1 py-3 px-2 text-center rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all ${tab === 'launches' ? 'bg-[var(--surface2)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            Lanzamientos
          </button>
          <button
            onClick={() => setTab("global")}
            className={`flex-1 py-3 px-2 text-center rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all ${tab === 'global' ? 'bg-[#C8FF00] text-black shadow-lg shadow-[#C8FF00]/20' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            Actividad
          </button>
        </div>

        {tab === "global" && (
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'new_builder', label: 'Nuevos' },
              { id: 'block_update', label: 'Bloques' },
              { id: 'new_project', label: 'Proyectos' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${filterType === f.id ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-[var(--text-muted)] hover:border-white/10'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : tab === "launches" ? (
        launches.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-[var(--border)] rounded-3xl">
            <p className="text-[var(--text-dim)] font-mono text-sm leading-relaxed mb-4">
              Aún no hay lanzamientos de la comunidad.<br />
            </p>
            <button onClick={() => alert("Próximamente: Panel de lanzamientos PRO")} className="btn btn-accent inline-flex">
              Ser el primero en lanzar 🚀
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {launches.map(launch => (
              <div key={launch.id} className="bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] p-5 md:p-6 rounded-3xl transition-colors flex flex-col md:flex-row gap-6 md:items-center group">
                <div className="flex-1 min-w-0">
                  <Link href={`/${launch.profiles.username}`} target="_blank" className="flex items-center gap-2 mb-3 max-w-max">
                    {launch.profiles.image ? (
                      <img src={launch.profiles.image} alt={launch.profiles.username} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center font-bold text-[10px] text-[var(--accent)] border border-[var(--border)] shrink-0">
                        {launch.profiles.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors">@{launch.profiles.username}</span>
                  </Link>

                  <Link href={`/${launch.profiles.username}${launch.sub_site_id ? `/project/${launch.sub_site_id}` : ''}`} className="block">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-white truncate group-hover:text-[#C8FF00] transition-colors">{launch.title}</h2>
                    <p className="text-sm md:text-base text-[var(--text-dim)] line-clamp-2 mb-4 leading-relaxed">{launch.tagline}</p>
                  </Link>

                  <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest">
                    <span>Hace {timeAgo(launch.created_at)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleUpvote(launch)}
                  className={`shrink-0 flex flex-row md:flex-col items-center justify-center gap-2 md:gap-1 px-4 py-3 md:w-20 md:h-24 rounded-2xl border transition-all ${launch.hasUpvoted ? 'bg-[#C8FF00]/10 border-[#C8FF00] text-[#C8FF00] shadow-[0_0_20px_rgba(200,255,0,0.1)]' : 'bg-black/20 border-[var(--border-bright)] text-[var(--text-dim)] hover:border-white hover:text-white hover:bg-white/5'
                    }`}
                >
                  <ChevronUp size={28} className={launch.hasUpvoted ? 'text-[#C8FF00]' : ''} />
                  <span className="font-black font-mono text-lg">{launch.upvotes}</span>
                </button>
              </div>
            ))}
          </div>
        )
      ) : activities.length === 0 ? (
        <div className="text-center py-32 border border-dashed border-[var(--border)] rounded-3xl">
          <p className="text-[var(--text-dim)] font-mono text-sm leading-relaxed">
            {filterType === 'all'
              ? 'El feed de actividad está vacío.'
              : `No hay actividad de tipo "${filterType.replace('_', ' ')}" por ahora.`}
            <br />
          </p>
          {filterType !== 'all' && (
            <button onClick={() => setFilterType('all')} className="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--accent)] hover:underline">
              Ver toda la actividad
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, i) => {
            const user = activity.user;
            const label = ACTIVITY_LABELS[activity.type]?.(activity.data, user.name ?? user.username) ?? `${user.username} hizo algo nuevo`;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-bright)] transition-all"
              >
                {/* Avatar */}
                <Link href={`/${user.username}`} className="shrink-0">
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

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    <Link
                      href={`/${user.username}`}
                      className="font-bold hover:underline"
                      style={{ color: user.accent_color }}
                    >
                      {user.name ?? user.username}
                    </Link>
                    {" "}
                    <span className="text-[var(--text-dim)]">
                      {label.replace(user.name ?? user.username, "").trim()}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                    {timeAgo(activity.created_at)}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {page < totalPages && (
            <div className="pt-8 pb-12 flex justify-center">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loadingMore}
                className="btn btn-ghost !px-8 !py-3 !rounded-2xl !text-[11px] uppercase tracking-widest font-bold border-white/10 hover:bg-white/5 disabled:opacity-50"
              >
                {loadingMore ? 'Cargando...' : 'Cargar más actividad'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
