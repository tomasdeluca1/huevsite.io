"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Layout as LayoutIcon, Zap, ArrowRight, User, Palette } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function OnboardingModal({ isOpen, onClose, username }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const steps = [
    {
      icon: <LayoutIcon size={20} />,
      title: "Armá tu grilla",
      desc: "Elegí entre 15+ tipos de bloques para mostrar tus proyectos, stats y comunidad."
    },
    {
      icon: <Palette size={20} />,
      title: "Dale tu estilo",
      desc: "Personalizá los colores y el perfil para que se sienta 100% tuyo."
    },
    {
      icon: <Zap size={20} />,
      title: "Lanzá y compartí",
      desc: "Tu perfil ya está vivo en huevsite.io. Ponelo en tu bio y empezá a sumar endorsements."
    }
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="relative w-full max-w-xl bg-[var(--surface)] border border-[var(--border-bright)] rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] z-10"
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)] opacity-[0.03] blur-[120px] pointer-events-none" />

            <div className="p-10 md:p-14 relative">
              <button
                onClick={onClose}
                className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-white transition-all p-2 rounded-full hover:bg-white/5"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mb-12">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent)] to-emerald-400 rounded-[2rem] flex items-center justify-center mb-10 rotate-3 shadow-[0_0_40px_rgba(200,255,0,0.2)]">
                  <Sparkles className="text-black" size={40} />
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                  <span className="text-[10px] font-black font-mono text-[var(--accent)] uppercase tracking-[0.2em]">HUEVSITE STUDIO v2.0</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-[0.9]">
                  Es hora de <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">hacerte notar.</span>
                </h2>

                <p className="text-[var(--text-dim)] text-base md:text-lg max-w-[340px] leading-relaxed font-medium">
                  Bienvenido a tu nueva base de operaciones como builder. 🇦🇷
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {steps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 transition-all group-hover:bg-[var(--accent)] group-hover:text-black group-hover:scale-110 group-hover:rotate-6">
                      {step.icon}
                    </div>
                    <h4 className="text-white font-bold text-[13px] mb-2">{step.title}</h4>
                    <p className="text-[var(--text-muted)] text-[11px] leading-relaxed px-2 font-medium">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-3 bg-[var(--accent)] text-black font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-lg shadow-[0_10px_30px_rgba(200,255,0,0.2)]"
                >
                  Empezar ahora
                  <ArrowRight size={22} strokeWidth={3} />
                </button>

                <div className="flex items-center justify-center gap-3 text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest mt-2 underline-offset-4 decoration-[var(--accent)]/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Listo para compartir: huevsite.io/{username}
                </div>
              </div>
            </div>

            {/* Footer decoration */}
            <div className="h-2 w-full flex">
              <div className="flex-1 bg-[var(--accent)]" />
              <div className="flex-1 bg-white/10" />
              <div className="flex-1 bg-[var(--accent)]/40" />
              <div className="flex-1 bg-white/5" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
