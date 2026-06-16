"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, ArrowRight } from "lucide-react";

/**
 * Toast en el dashboard que invita a dejar un testimonio para sumar +50 al
 * Builder Score. Se muestra una sola vez por usuario (localStorage) y solo si
 * todavía no dejó uno (o fue rechazado). Autocontenido: se fetchea su estado.
 */
export function TestimonialNudgeToast({ username }: { username?: string }) {
  const [visible, setVisible] = useState(false);

  const storageKey = `huevsite_testimonial_nudge_${username || "anon"}`;

  useEffect(() => {
    if (typeof window === "undefined" || !username) return;
    if (localStorage.getItem(storageKey) === "1") return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/testimonials");
        if (!res.ok) return;
        const { testimonial } = await res.json();
        // Mostrar solo si no tiene testimonio o el anterior fue rechazado.
        const needsNudge = !testimonial || testimonial.status === "rejected";
        if (!cancelled && needsNudge) {
          setTimeout(() => !cancelled && setVisible(true), 2500);
        }
      } catch {
        /* silencioso: el toast es un nudge, no crítico */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username, storageKey]);

  const dismiss = () => {
    if (typeof window !== "undefined") localStorage.setItem(storageKey, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          className="fixed z-[9000] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
          role="status"
        >
          <div className="relative rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] shadow-2xl shadow-black/40 p-4 pr-10 overflow-hidden">
            <div
              className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-[0.12] blur-3xl pointer-events-none"
              style={{ backgroundColor: "var(--accent)" }}
            />
            <button
              onClick={dismiss}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Cerrar"
            >
              <X size={15} />
            </button>

            <div className="flex items-start gap-3 relative z-10">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center mt-0.5">
                <MessageSquare size={17} className="text-[var(--accent)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-white leading-snug">
                  Sumá <span className="text-[var(--accent)]">+50</span> a tu Builder Score
                </p>
                <p className="text-xs text-[var(--text-dim)] leading-snug mt-1">
                  Dejá un testimonio de cómo te sirve huevsite. Si entra, sale en la home.
                </p>
                <Link
                  href="/testimonio"
                  onClick={dismiss}
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-black bg-[var(--accent)] hover:brightness-110 transition-all px-3.5 py-2 rounded-xl group"
                >
                  Dejar mi testimonio
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
