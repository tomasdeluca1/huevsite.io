"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, CheckCircle2, AlertCircle, Trash2, Archive, RotateCcw, X, LogIn, Share2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface NominatedUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  accent_color: string;
}

interface Finalist {
  userId: string;
  count: number;
  user: NominatedUser;
}

interface ShowcaseData {
  week: string;
  winners: Array<{ week: string; user: NominatedUser }>;
  finalists: Finalist[];
}

interface Feedback {
  id: string;
  user_email: string;
  content: string;
  category: string;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [settingWinner, setSettingWinner] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [postingLeaderboard, setPostingLeaderboard] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/social/showcase");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const res = await fetch("/api/feedback");
      const json = await res.json();
      if (Array.isArray(json)) setFeedbacks(json);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile?.username === 'huevsite') {
        setAuthed(true);
        fetchData();
        fetchFeedbacks();
      }
      setChecking(false);
    };

    checkAdmin();
  }, []);

  const setWinner = async (userId: string, week: string) => {
    setSettingWinner(userId);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/admin/showcase-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, week }),
      });
      const json = await res.json();
      if (res.ok) {
        setFeedbackMsg({ type: "ok", msg: "Winner establecido correctamente 🏆" });
        await fetchData();
      } else {
        setFeedbackMsg({ type: "err", msg: json.error ?? "Error al establecer winner." });
      }
    } finally {
      setSettingWinner(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este feedback?")) return;
    try {
      const res = await fetch(`/api/feedback?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchFeedbacks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFeedbackStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/feedback`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) fetchFeedbacks();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostLeaderboard = async () => {
    if (!confirm(`¿Seguro que querés publicar el Ranking actual en X?`)) return;
    setPostingLeaderboard(true);
    try {
      const res = await fetch("/api/admin/twitter/post-leaderboard", {
        method: "POST",
      });
      if (res.ok) {
        setFeedbackMsg({ type: "ok", msg: `Ranking publicado con éxito! 🔥` });
      } else {
        const json = await res.json();
        setFeedbackMsg({ type: "err", msg: json.error || "Error al publicar ranking" });
      }
    } catch (error) {
      setFeedbackMsg({ type: "err", msg: "Error de conexión" });
    } finally {
      setPostingLeaderboard(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center font-display">
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 font-display">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="section-label mb-2 justify-center">// acceso restringido</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>
          <p className="text-[var(--text-muted)] text-sm">
            Esta sección es solo para el administrador (@huevsite).
          </p>
          <div className="pt-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-black bg-[var(--accent)] hover:opacity-90 transition-all"
            >
              <LogIn size={18} />
              Iniciar Sesión
            </Link>
          </div>
          <div>
            <Link href="/" className="text-xs text-[var(--text-dim)] hover:underline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <div className="section-label mb-1">// panel admin</div>
          <h1 className="text-4xl font-extrabold tracking-tight">Showcase Admin</h1>
        </div>
        <Link href="/" className="logo text-base">huev<span>site</span>.io</Link>
      </header>

      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-2xl mb-8 ${feedbackMsg.type === "ok"
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
        >
          {feedbackMsg.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{feedbackMsg.msg}</span>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
        </div>
      ) : data ? (
        <div className="space-y-10">
          {/* Semana actual */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Semana</div>
            <div className="font-bold font-mono text-lg">{data.week}</div>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Trophy size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Postear Ranking</p>
                <p className="text-[10px] text-[var(--text-dim)] font-mono">Publica el top de builders actual en X (automático según espacio)</p>
              </div>
            </div>
            <button
              onClick={handlePostLeaderboard}
              disabled={postingLeaderboard}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2 border border-white/5"
            >
              {postingLeaderboard ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
              Publicar
            </button>
          </div>

          {/* Winner(s) actual(es) */}
          {data.winners && data.winners.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="section-label !mb-0">// winner(s) actual(es)</div>
                <button
                  onClick={async () => {
                    if (confirm("¿Limpiar todos los winners de esta semana?")) {
                      await fetch(`/api/admin/showcase-winner?week=${data.week}`, {
                        method: "DELETE",
                      });
                      fetchData();
                    }
                  }}
                  className="text-[10px] font-mono text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={10} /> Limpiar semana
                </button>
              </div>
              <div className="grid gap-4">
                {data.winners.map((winner) => (
                  <div
                    key={winner.user.id}
                    className="flex items-center gap-4 p-5 rounded-2xl border-2"
                    style={{ borderColor: winner.user.accent_color }}
                  >
                    <Trophy size={24} style={{ color: winner.user.accent_color }} />
                    <div>
                      <p className="font-bold" style={{ color: winner.user.accent_color }}>
                        {winner.user.name ?? winner.user.username}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">@{winner.user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finalistas */}
          <div>
            <div className="section-label mb-4">// finalistas — elegí el winner</div>
            {data.finalists.length === 0 ? (
              <p className="text-[var(--text-dim)] font-mono text-sm">
                Sin nominaciones esta semana todavía.
              </p>
            ) : (
              <div className="space-y-3">
                {data.finalists.map((finalist, i) => {
                  const isWinner = data.winners?.some(w => w.user.id === finalist.userId);
                  return (
                    <motion.div
                      key={finalist.userId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
                    >
                      {finalist.user.image ? (
                        <img src={finalist.user.image} alt={finalist.user.username} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black shrink-0"
                          style={{ backgroundColor: finalist.user.accent_color }}
                        >
                          {(finalist.user.name ?? finalist.user.username)[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-sm" style={{ color: finalist.user.accent_color }}>
                          {finalist.user.name ?? finalist.user.username}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">
                          {finalist.count} nominación{finalist.count !== 1 ? "es" : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => setWinner(finalist.userId, data.week)}
                        disabled={settingWinner === finalist.userId}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          backgroundColor: isWinner ? 'transparent' : finalist.user.accent_color,
                          border: isWinner ? `1px solid ${finalist.user.accent_color}` : 'none',
                          color: isWinner ? finalist.user.accent_color : 'black',
                          opacity: settingWinner === finalist.userId ? 0.7 : 1
                        }}
                      >
                        {settingWinner === finalist.userId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isWinner ? (
                          <><X size={14} /> Quitar winner</>
                        ) : (
                          <><Trophy size={14} /> Elegir winner</>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Feedback Section */}
          <div className="pt-10 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-6">
              <div className="section-label !mb-0">// feedback de usuarios</div>
              <button
                onClick={fetchFeedbacks}
                className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                disabled={loadingFeedbacks}
              >
                {loadingFeedbacks ? "Cargando..." : "Actualizar"}
              </button>
            </div>

            {feedbacks.length === 0 ? (
              <div className="p-8 text-center bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl">
                <p className="text-sm text-[var(--text-muted)] font-mono">No hay feedback por ahora. 🧉</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Pendientes */}
                <div className="space-y-4">
                  {feedbacks.filter(f => f.status !== 'completed').length > 0 && (
                    <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest pl-2">Pendientes</div>
                  )}
                  {feedbacks.filter(f => f.status !== 'completed').map((fb) => (
                    <div key={fb.id} className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white/50">{fb.user_email}</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter ${fb.category === 'bug' ? 'bg-red-500/20 text-red-400' :
                            fb.category === 'idea' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-white/10 text-white/50'
                            }`}>
                            {fb.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">{fb.content}</p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          {new Date(fb.created_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateFeedbackStatus(fb.id, 'completed')}
                            className="p-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all border border-green-500/20"
                            title="Marcar como completado"
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteFeedback(fb.id)}
                            className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Completados */}
                {feedbacks.filter(f => f.status === 'completed').length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-dashed border-[var(--border)]">
                    <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest pl-2">Archivados / Completados</div>
                    {feedbacks.filter(f => f.status === 'completed').map((fb) => (
                      <div key={fb.id} className="p-5 bg-[var(--surface)]/50 border border-[var(--border)]/50 rounded-2xl space-y-3 opacity-60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-white/30">{fb.user_email}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-white/5 text-white/30 px-2 py-0.5 rounded-full uppercase">Completado</span>
                            <button
                              onClick={() => handleUpdateFeedbackStatus(fb.id, 'pending')}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors"
                              title="Restaurar"
                            >
                              <RotateCcw size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-white/40 whitespace-pre-wrap">{fb.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[var(--text-dim)] font-mono text-sm text-center py-24">
          Error cargando datos del showcase.
        </p>
      )}
    </div>
  );
}
