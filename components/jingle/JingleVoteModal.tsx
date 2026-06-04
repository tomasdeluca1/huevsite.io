"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Music } from "lucide-react";
import { JINGLE_OPTIONS, JingleChoice } from "@/lib/jingles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
  initialVote?: JingleChoice | null;
  onVoted?: (choice: JingleChoice) => void;
}

export function JingleVoteModal({ isOpen, onClose, accentColor = "var(--accent)", initialVote = null, onVoted }: Props) {
  const [mounted, setMounted] = useState(false);
  const [myVote, setMyVote] = useState<JingleChoice | null>(initialVote);
  const [submitting, setSubmitting] = useState<JingleChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => setMounted(true), []);
  useEffect(() => setMyVote(initialVote), [initialVote]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
      // Pause any playing video when the modal closes.
      Object.values(videoRefs.current).forEach((v) => v && v.pause());
    };
  }, [isOpen]);

  // Only one video plays at a time.
  const handlePlay = (key: string) => {
    Object.entries(videoRefs.current).forEach(([k, v]) => {
      if (k !== key && v) v.pause();
    });
  };

  const vote = async (choice: JingleChoice) => {
    setSubmitting(choice);
    setError(null);
    try {
      const res = await fetch("/api/jingle-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "No se pudo guardar tu voto.");
        return;
      }
      setMyVote(choice);
      onVoted?.(choice);
      import("canvas-confetti")
        .then((m) =>
          m.default({ particleCount: 110, spread: 75, origin: { y: 0.7 }, disableForReducedMotion: true })
        )
        .catch(() => {});
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setSubmitting(null);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-2xl my-8 bg-[var(--surface)] border border-[var(--border-bright)] rounded-[2.25rem] shadow-2xl overflow-hidden z-10"
          style={{ ["--accent" as any]: accentColor }}
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-[var(--accent)]/10 blur-[70px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />

          <div className="p-6 sm:p-8 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-[var(--surface2)] transition-all text-[var(--text-muted)] hover:text-white"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-black/40 border-2"
              style={{ borderColor: accentColor }}
            >
              <Music size={24} style={{ color: accentColor }} />
            </div>

            <div className="section-label mb-2">// elegí el jingle de huevsite</div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-1.5">
              {myVote ? "¡Gracias por votar! 🎉" : "¿Cuál tiene que ser nuestro jingle?"}
            </h3>
            <p className="text-[var(--text-dim)] text-sm leading-relaxed mb-6">
              {myVote
                ? "Tu voto quedó registrado. Podés cambiarlo tocando la otra opción."
                : "Escuchá las dos y votá la que más te represente. Tu voto define el sonido de huevsite."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {JINGLE_OPTIONS.map((opt) => {
                const selected = myVote === opt.key;
                const isSubmitting = submitting === opt.key;
                return (
                  <div
                    key={opt.key}
                    className={`rounded-3xl border p-3 transition-all ${
                      selected ? "border-[var(--accent)] bg-[var(--accent)]/[0.06]" : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        {opt.label}
                      </span>
                      {selected && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
                          <Check size={12} /> Tu voto
                        </span>
                      )}
                    </div>
                    <video
                      ref={(el) => {
                        videoRefs.current[opt.key] = el;
                      }}
                      src={opt.videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      onPlay={() => handlePlay(opt.key)}
                      className="w-full aspect-square rounded-2xl bg-black object-cover"
                    />
                    <div className="mt-3 mb-1 px-1">
                      <div className="text-sm font-black text-white leading-tight">{opt.title}</div>
                    </div>
                    <button
                      onClick={() => vote(opt.key)}
                      disabled={isSubmitting}
                      className="w-full mt-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                      style={
                        selected
                          ? { backgroundColor: "transparent", color: accentColor, border: `1px solid ${accentColor}` }
                          : { backgroundColor: accentColor, color: "#000" }
                      }
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> Votando…</span>
                      ) : selected ? (
                        "Votada ✓"
                      ) : (
                        "Votar esta"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {error && <p className="mt-4 text-xs text-red-400 text-center">{error}</p>}

            <button
              onClick={onClose}
              className="w-full mt-5 py-2.5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors"
            >
              {myVote ? "Cerrar" : "Votar después"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
