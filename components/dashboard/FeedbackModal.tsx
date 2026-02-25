"use client";

import { useState } from "react";
import { MessageSquare, Send, X, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, category }),
      });

      if (res.ok) {
        setSent(true);
        setContent("");
        setTimeout(() => {
          setSent(false);
          onClose();
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Error al enviar feedback");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border-bright)] rounded-3xl overflow-hidden shadow-2xl"
        >
          {sent ? (
            <div className="p-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent)]">
                  <CheckCircle2 size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold">¡Feedback enviado!</h3>
              <p className="text-[var(--text-dim)]">Gracias por ayudarnos a mejorar huevsite. 🇦🇷</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] flex items-center justify-center text-[var(--accent)] border border-[var(--border-bright)]">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Enviar Feedback</h3>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">// línea directa con tomas</div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-[var(--surface2)] rounded-full transition-colors text-[var(--text-muted)] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest px-1">Categoría</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['general', 'bug', 'idea'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                          category === cat 
                            ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold' 
                            : 'bg-[var(--surface2)] text-[var(--text-dim)] border-[var(--border-bright)] hover:border-white/20'
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest px-1">Tu Mensaje</label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Contanos qué podemos mejorar, qué feature te gustaría ver o reportá un bicho..."
                    className="w-full h-40 bg-[var(--surface2)] border border-[var(--border-bright)] rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:border-[var(--accent)] outline-none resize-none transition-colors shadow-inner"
                  />
                </div>

                {error && <p className="text-red-400 text-xs px-1">{error}</p>}

                <button
                  disabled={loading || !content.trim()}
                  className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-[var(--accent)] transition-all disabled:opacity-50 disabled:grayscale group"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>Enviar feedback</span>
                      <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
