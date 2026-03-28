"use client";

import { useState } from "react";
import { MessageSquare, Send, X, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FileUpload } from "./FileUpload";

export function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [screenshotUrl, setScreenshotUrl] = useState("");
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
        body: JSON.stringify({ content, category, screenshotUrl: screenshotUrl || null }),
      });

      if (res.ok) {
        setSent(true);
        setContent("");
        setScreenshotUrl("");
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
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
          className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          {/* Glow top border */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
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
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center text-[var(--accent)] border border-white/10 shadow-inner">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tighter">Feedback</h3>
                    <div className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">// línea directa con el equipo</div>
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

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest px-1">Screenshot opcional</label>
                  <FileUpload
                    value={screenshotUrl}
                    onChange={setScreenshotUrl}
                    folder="feedback"
                    accept="image/*"
                  />
                </div>

                {error && <p className="text-red-400 text-xs px-1">{error}</p>}

                <button
                  disabled={loading || !content.trim()}
                  className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale group"
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
