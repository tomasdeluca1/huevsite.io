"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { notFound } from "next/navigation";
import Link from "next/link";

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
  new_endorsement: (data, u) => `${u} dejó un endorsement a ${data.targetUsername ?? "alguien"}`,
  pro_upgrade: (data, u) => `${u} se pasó a PRO 🚀`,
  new_builder: (data, u) => `${data.username ?? u} se acaba de unir a huevsite.io 🎉`,
  showcase_winner: (data, u) => `${u} ganó como builder de la semana 🏆🥚`,
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

  useEffect(() => {
    fetch("/api/social/feed")
      .then(r => r.json())
      .then(data => setActivities(data.activities ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-2xl mx-auto">
      <header className="mb-12">
        <Link href="/" className="logo mb-8 block">huev<span>site</span>.io</Link>
        <div className="section-label mb-2">// actividad reciente</div>
        <h1 className="text-4xl font-extrabold tracking-tighter">Tu feed</h1>
        <p className="section-sub mt-2">Lo que está pasando ahora mismo en la comunidad.</p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-32">
          <p className="text-[var(--text-dim)] font-mono text-sm leading-relaxed">
            El feed global está vacío de momento. La comunidad está muy tranquila.<br />
            <span className="text-[var(--accent)]">Sé el primero en aportar actividad interactuando o editando tu perfil 🇦🇷</span>
          </p>
          <Link href="/explore" className="btn btn-ghost mt-8 inline-flex">
            Explorar builders →
          </Link>
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
                      {ACTIVITY_LABELS[activity.type]?.(activity.data, "") ?? "hizo algo nuevo"}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                    {timeAgo(activity.created_at)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
