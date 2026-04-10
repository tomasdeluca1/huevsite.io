"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Archive, RotateCcw } from "lucide-react";

interface Feedback {
  id: string;
  user_email: string;
  content: string;
  category: string;
  status: string;
  screenshot_url?: string | null;
  created_at: string;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback");
      const json = await res.json();
      if (Array.isArray(json)) setFeedbacks(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este feedback?")) return;
    try {
      const res = await fetch(`/api/feedback?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchFeedbacks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFeedbackStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) fetchFeedbacks();
    } catch (e) {
      console.error(e);
    }
  };

  const pending = feedbacks.filter((f) => f.status !== "completed");
  const completed = feedbacks.filter((f) => f.status === "completed");

  return (
    <div>
      <header className="mb-8">
        <div className="section-label mb-1">// feedback de usuarios</div>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Feedback
          </h1>
          <button
            onClick={fetchFeedbacks}
            disabled={loading}
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </header>

      {loading && feedbacks.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 size={20} className="animate-spin text-[var(--accent)] mx-auto" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="p-8 text-center bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl">
          <p className="text-sm text-[var(--text-muted)] font-mono">
            No hay feedback por ahora. 🧉
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Pendientes */}
          <div className="space-y-4">
            {pending.length > 0 && (
              <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest pl-2">
                Pendientes ({pending.length})
              </div>
            )}
            {pending.map((fb) => (
              <div
                key={fb.id}
                className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white/50">
                    {fb.user_email}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                      fb.category === "bug"
                        ? "bg-red-500/20 text-red-400"
                        : fb.category === "idea"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {fb.category}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">
                  {fb.content}
                </p>
                {fb.screenshot_url && (
                  <a
                    href={fb.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-mono text-[var(--accent)] hover:text-white transition-colors"
                  >
                    Ver screenshot adjunto
                  </a>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                    {new Date(fb.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateFeedbackStatus(fb.id, "completed")}
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
          {completed.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-dashed border-[var(--border)]">
              <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest pl-2">
                Archivados / Completados ({completed.length})
              </div>
              {completed.map((fb) => (
                <div
                  key={fb.id}
                  className="p-5 bg-[var(--surface)]/50 border border-[var(--border)]/50 rounded-2xl space-y-3 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white/30">
                      {fb.user_email}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-white/5 text-white/30 px-2 py-0.5 rounded-full uppercase">
                        Completado
                      </span>
                      <button
                        onClick={() => handleUpdateFeedbackStatus(fb.id, "pending")}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors"
                        title="Restaurar"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-white/40 whitespace-pre-wrap">
                    {fb.content}
                  </p>
                  {fb.screenshot_url && (
                    <a
                      href={fb.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors"
                    >
                      Ver screenshot adjunto
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
