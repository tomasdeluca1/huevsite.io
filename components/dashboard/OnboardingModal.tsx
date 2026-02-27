"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Layout as LayoutIcon, Link2, ArrowRight } from "lucide-react";

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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl relative"
          >
            <div className="p-8 pb-6 bg-gradient-to-b from-black/40 to-transparent">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-white transition-colors p-2 rounded-full hover:bg-[var(--surface2)]"
              >
                <X size={20} />
              </button>

              <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent)] to-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(200,255,0,0.2)]">
                <Sparkles className="text-black" size={28} />
              </div>

              <div className="section-label mb-2">// bienvenido 🇦🇷</div>
              <h2 className="text-3xl font-black text-white mb-2 leading-tight">
                Empezá a buildear tu huevsite
              </h2>
              
              <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                Este es el lugar donde podés mostrar quién sos y qué hacés, sin vueltas ni plantillas corporativas aburridas.
              </p>
            </div>

            <div className="p-8 pt-2 space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] flex items-center justify-center shrink-0 mt-1">
                  <LayoutIcon size={18} className="text-[var(--accent)]" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">Elegí lo que importa</h4>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                    Usá la galería de bloques para agregar info clave sobre vos: proyectos copados que hiciste, tu perfil de GitHub y tu Tech Stack preferido.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] flex items-center justify-center shrink-0 mt-1">
                  <Link2 size={18} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">Compartilo en redes</h4>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                    Poné tu URL en la bio de X (Twitter), LinkedIn o Instagram:
                  </p>
                  <div className="mt-2 p-3 bg-black/40 border border-[var(--border)] rounded-xl flex items-center gap-2 font-mono text-xs">
                    <span className="text-[var(--text-dim)]">huevsite.io/</span>
                    <span className="text-[var(--accent)] font-bold">{username}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-black/20 border-t border-[var(--border)]">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity"
              >
                Let&apos;s fucking go
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
