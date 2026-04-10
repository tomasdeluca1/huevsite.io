"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Share2,
  Trophy,
  Archive,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Action = {
  type: "general" | "non-pro" | "weekly" | "twitter-only";
  url: string;
};

export default function TwitterAdminPage() {
  const [postingLeaderboard, setPostingLeaderboard] = useState(false);
  const [postingNonProLeaderboard, setPostingNonProLeaderboard] = useState(false);
  const [postingWeeklyReport, setPostingWeeklyReport] = useState(false);

  const [previewText, setPreviewText] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const requestPreview = async (
    previewUrl: string,
    postUrl: string,
    action: Action["type"],
    setBusy: (v: boolean) => void
  ) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(previewUrl, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.preview) {
        setPreviewText(json.preview);
        setCurrentAction({ type: action, url: postUrl });
      } else {
        setMsg({ type: "err", text: json.error || "Error al generar preview" });
      }
    } catch {
      setMsg({ type: "err", text: "Error de conexión" });
    } finally {
      setBusy(false);
    }
  };

  const confirmPost = async () => {
    if (!currentAction) return;
    setIsConfirming(true);
    try {
      const res = await fetch(currentAction.url, { method: "POST" });
      if (res.ok) {
        setMsg({ type: "ok", text: "Posteado con éxito en X! 🔥" });
        setPreviewText(null);
        setCurrentAction(null);
      } else {
        const json = await res.json();
        setMsg({ type: "err", text: json.error || "Error al postear" });
      }
    } catch {
      setMsg({ type: "err", text: "Error de conexión" });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <div className="section-label mb-1">// publicar en X</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Twitter / X
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xl">
          Publicá rankings y reportes automáticos. Cada botón genera un preview
          — revisalo antes de confirmar el post.
        </p>
      </header>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-2xl mb-8 ${
            msg.type === "ok"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{msg.text}</span>
        </motion.div>
      )}

      <div className="space-y-4">
        {/* Ranking General */}
        <div className="flex gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Trophy size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Postear Ranking</p>
              <p className="text-[10px] text-[var(--text-dim)] font-mono">
                Publica el top de builders actual en X (automático según espacio)
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              requestPreview(
                "/api/admin/twitter/post-leaderboard?preview=true",
                "/api/admin/twitter/post-leaderboard",
                "general",
                setPostingLeaderboard
              )
            }
            disabled={postingLeaderboard}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2 border border-white/5"
          >
            {postingLeaderboard ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Share2 size={12} />
            )}
            Publicar General
          </button>
        </div>

        {/* Ranking Non-Pro */}
        <div className="flex gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-dashed border-blue-500/30 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Share2 size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-blue-400">Ranking Non-Pro</p>
              <p className="text-[10px] text-[var(--text-dim)] font-mono">
                Publica el top solo con builders que no tienen plan PRO
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              requestPreview(
                "/api/admin/twitter/post-leaderboard?filter=non-pro&preview=true",
                "/api/admin/twitter/post-leaderboard?filter=non-pro",
                "non-pro",
                setPostingNonProLeaderboard
              )
            }
            disabled={postingNonProLeaderboard}
            className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-xs font-bold transition-all flex items-center gap-2 border border-blue-500/20 text-blue-400"
          >
            {postingNonProLeaderboard ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Share2 size={12} />
            )}
            Publicar Non-Pro
          </button>
        </div>

        {/* Ranking Twitter Only */}
        <div className="flex gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-dashed border-cyan-500/30 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <span className="text-lg font-bold">𝕏</span>
            </div>
            <div>
              <p className="font-bold text-sm text-cyan-400">Ranking Solo Twitter</p>
              <p className="text-[10px] text-[var(--text-dim)] font-mono">
                Publica el top solo con builders que tienen Twitter/X conectado
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              requestPreview(
                "/api/admin/twitter/post-leaderboard?filter=twitter-only&preview=true",
                "/api/admin/twitter/post-leaderboard?filter=twitter-only",
                "twitter-only",
                setPostingLeaderboard
              )
            }
            disabled={postingLeaderboard}
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-bold transition-all flex items-center gap-2 border border-cyan-500/20 text-cyan-400"
          >
            {postingLeaderboard ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Share2 size={12} />
            )}
            Publicar Twitter Only
          </button>
        </div>

        {/* Weekly Report */}
        <div className="flex gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-dashed border-purple-500/30 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Archive size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-purple-400">
                Reporte Semanal (Viernes)
              </p>
              <p className="text-[10px] text-[var(--text-dim)] font-mono">
                Resumen de nuevos proyectos y builders de los últimos 7 días
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              requestPreview(
                "/api/admin/twitter/post-weekly-stats?preview=true",
                "/api/admin/twitter/post-weekly-stats",
                "weekly",
                setPostingWeeklyReport
              )
            }
            disabled={postingWeeklyReport}
            className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-xs font-bold transition-all flex items-center gap-2 border border-purple-500/20 text-purple-400"
          >
            {postingWeeklyReport ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Share2 size={12} />
            )}
            Publicar Reporte
          </button>
        </div>
      </div>

      {/* Tweet Preview Modal */}
      {previewText && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 size={18} className="text-[var(--accent)]" />
                <h2 className="font-bold">Preview del Tweet</h2>
              </div>
              <button
                onClick={() => {
                  setPreviewText(null);
                  setCurrentAction(null);
                }}
                className="text-[var(--text-dim)] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 bg-black/40">
              <div className="p-6 rounded-2xl bg-zinc-800/50 border border-white/5 font-sans leading-relaxed text-sm whitespace-pre-wrap">
                {previewText}
              </div>
              <div className="mt-4 flex justify-end">
                <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                  {previewText.length} / 280 caracteres
                </span>
              </div>
            </div>

            <div className="p-6 bg-zinc-900/50 flex gap-3">
              <button
                onClick={() => {
                  setPreviewText(null);
                  setCurrentAction(null);
                }}
                className="flex-1 py-3 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPost}
                disabled={isConfirming}
                className="flex-[2] py-3 font-bold text-xs uppercase tracking-widest rounded-xl bg-[var(--accent)] text-black hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isConfirming ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Share2 size={14} />
                )}
                Confirmar y Postear
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
