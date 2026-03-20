"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Link2, Loader2, Sparkles } from "lucide-react";

interface LinktreeRefactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  aiCredits: number;
  isSubmitting: boolean;
  onConfirm: (url: string) => Promise<void> | void;
}

export function LinktreeRefactorModal({
  isOpen,
  onClose,
  accentColor,
  aiCredits,
  isSubmitting,
  onConfirm,
}: LinktreeRefactorModalProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!url.trim()) {
      setError("Pegá una URL de Linktree para seguir.");
      return;
    }

    setError(null);
    await onConfirm(url.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[520] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            className="relative z-[530] w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[var(--surface)] p-8 shadow-2xl"
          >
            <div className="mb-8 text-center">
              <div className="section-label mx-auto mb-2 w-fit">// refactor con linktree</div>
              <h3 className="text-2xl font-black tracking-tighter text-white">
                Rehacer board desde Linktree
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">
                huevsite va a escanear tu perfil de Linktree y reconstruir el board principal
                priorizando esa data para nombre, tagline y links destacados.
              </p>
            </div>

            <div className="mb-6 rounded-[2rem] border border-amber-500/20 bg-amber-500/8 p-5">
              <div className="mb-3 flex items-center gap-3 text-amber-300">
                <AlertTriangle size={18} />
                <span className="text-sm font-black">Advertencia</span>
              </div>
              <p className="text-sm leading-relaxed text-white/65">
                Este proceso reemplaza el board principal actual. Tus sub-sites no se tocan.
              </p>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                  <Sparkles size={14} />
                  Costo
                </div>
                <div className="text-sm font-black" style={{ color: accentColor }}>
                  1 crédito IA
                </div>
              </div>
              <div className="mt-2 text-right text-xs text-white/35">
                Saldo actual: {aiCredits}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="px-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
                  URL de Linktree
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 focus-within:border-[var(--accent)]">
                  <Link2 size={18} className="text-[var(--accent)]" />
                  <input
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://linktr.ee/tuusuario"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl bg-white/5 py-4 text-sm font-bold text-white/45 transition-colors hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting || aiCredits < 1}
                  className="flex-[1.5] rounded-2xl py-4 text-sm font-black text-black shadow-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Refactorizando...
                    </span>
                  ) : aiCredits < 1 ? (
                    "Sin créditos IA"
                  ) : (
                    "Escanear y refactorizar"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
