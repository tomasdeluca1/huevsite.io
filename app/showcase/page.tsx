"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Loader2 } from "lucide-react";
import Link from "next/link";

interface ShowcaseUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  accent_color: string;
  tagline?: string | null;
}

interface ShowcaseData {
  month: string;
  winner: { month: string; user: ShowcaseUser } | null;
  finalists: Array<{ userId: string; count: number; user: ShowcaseUser }>;
}

import { NominateButton } from "@/components/social/NominateButton";


export default function ShowcasePage() {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/social/showcase")
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display">
      <main className="max-w-4xl mx-auto px-4 pt-12 pb-24">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <Link href="/" className="logo">huev<span>site</span>.io</Link>
          <Link href="/login" className="btn btn-ghost !px-5 !text-xs !py-2.5">
            Buildeá el tuyo 🇦🇷
          </Link>
        </header>

        <div className="mb-16 text-center">
          <div className="section-label mb-3 justify-center">// showcase mensual</div>
          <h1 className="text-5xl font-extrabold tracking-tighter mb-4">
            El builder del mes.
          </h1>
          <p className="section-sub mx-auto max-w-md">
            El builder más nominado de Argentina y LATAM.<br />
            {data?.month && <span className="font-mono text-xs text-[var(--accent)]">{data.month}</span>}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
          </div>
        ) : !data ? (
          <p className="text-center text-[var(--text-dim)] font-mono">Error cargando datos.</p>
        ) : (
          <>
            {/* Winner */}
            {data.winner ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-16 p-8 rounded-[2.5rem] border-2 overflow-hidden"
                style={{ borderColor: data.winner.user.accent_color }}
              >
                {/* Glow */}
                <div
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 30% 50%, ${data.winner.user.accent_color}, transparent 70%)` }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* Avatar */}
                  <div className="shrink-0 relative">
                    {data.winner.user.image ? (
                      <img
                        src={data.winner.user.image}
                        alt={data.winner.user.username}
                        className="w-28 h-28 rounded-3xl object-cover"
                        style={{ border: `3px solid ${data.winner.user.accent_color}` }}
                      />
                    ) : (
                      <div
                        className="w-28 h-28 rounded-3xl flex items-center justify-center text-4xl font-black text-black"
                        style={{ backgroundColor: data.winner.user.accent_color }}
                      >
                        {(data.winner.user.name ?? data.winner.user.username)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div
                      className="absolute -top-3 -right-3 w-10 h-10 rounded-xl flex items-center justify-center text-black"
                      style={{ backgroundColor: data.winner.user.accent_color }}
                    >
                      <Trophy size={20} />
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div
                      className="inline-block text-xs font-bold px-3 py-1 rounded-lg mb-4 text-black"
                      style={{ backgroundColor: data.winner.user.accent_color }}
                    >
                      🏆 Winner — {data.winner.month}
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2">
                      {data.winner.user.name ?? data.winner.user.username}
                    </h2>
                    <p className="text-[var(--text-dim)] text-sm mb-4 font-mono">@{data.winner.user.username}</p>
                    {data.winner.user.tagline && (
                      <p className="text-base text-[var(--text-dim)] leading-relaxed mb-6 max-w-md">
                        {data.winner.user.tagline}
                      </p>
                    )}
                    <Link
                      href={`/${data.winner.user.username}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-black transition-all hover:opacity-90"
                      style={{ backgroundColor: data.winner.user.accent_color }}
                    >
                      Ver su huevsite →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="mb-16 p-12 rounded-[2.5rem] border border-dashed border-[var(--border-bright)] text-center">
                <Trophy size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
                <p className="text-[var(--text-dim)] font-mono text-sm">
                  El winner de esta semana todavía no fue elegido.<br />
                  <span className="text-[var(--accent)]">Nominá a tu builder favorito 🇦🇷</span>
                </p>
              </div>
            )}

            {/* Finalists */}
            {data.finalists.length > 0 && (
              <div>
                <div className="section-label mb-6">// finalistas del mes</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.finalists.map((finalist, i) => (
                    <motion.div
                      key={finalist.userId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-bright)] transition-all"
                    >
                      {finalist.user.image ? (
                        <img
                          src={finalist.user.image}
                          alt={finalist.user.username}
                          className="w-12 h-12 rounded-2xl object-cover shrink-0"
                          style={{ border: `2px solid ${finalist.user.accent_color}` }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black text-black shrink-0"
                          style={{ backgroundColor: finalist.user.accent_color }}
                        >
                          {(finalist.user.name ?? finalist.user.username)[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/${finalist.user.username}`}
                          className="font-bold text-sm hover:underline block truncate"
                          style={{ color: finalist.user.accent_color }}
                        >
                          {finalist.user.name ?? finalist.user.username}
                        </Link>
                        <p className="text-xs text-[var(--text-muted)] font-mono">
                          {finalist.count} nominación{finalist.count !== 1 ? "es" : ""}
                        </p>
                      </div>
                      <NominateButton userId={finalist.userId} accentColor={finalist.user.accent_color} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {data.finalists.length === 0 && !data.winner && (
              <p className="text-center text-xs text-[var(--text-muted)] font-mono mt-8">
                Todavía no hay nominados este mes. Explorá perfiles y nominá builders que te inspiran.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
