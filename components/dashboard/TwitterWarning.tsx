"use client";

import { Twitter, X } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BlockData } from "@/lib/profile-types";
import { useState, useEffect, useRef } from "react";

interface Props {
  blocks: BlockData[];
  isSubSite?: boolean;
  onAddTwitter?: () => void;
}

export function TwitterWarning({ blocks, isSubSite = false, onAddTwitter }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCardPos({ top: rect.bottom + 12, left: Math.max(16, rect.left - 260) });
    }
  }, [isVisible]);

  const hasTwitter = blocks.some(b =>
    b.type === 'social' &&
    (b as any).links?.some((l: any) => l.platform === 'twitter' && (l.url || l.handle))
  );

  if (isSubSite || hasTwitter || isDismissed) return null;

  return (
    <div className="relative md:absolute md:top-2 md:right-0 z-[1000]">
      {/* Animated Dot / Trigger */}
      <motion.button
        ref={triggerRef}
        onClick={() => setIsVisible(!isVisible)}
        className="relative flex items-center justify-center w-5 h-5 md:w-6 md:h-6"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
        <span className="relative w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] flex items-center justify-center">
          <span className="text-[8px] font-black text-black">!</span>
        </span>
      </motion.button>

      {/* Message Card — rendered via portal to escape sidebar stacking context */}
      {mounted && createPortal(
        <AnimatePresence>
          {isVisible && cardPos && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998]"
                onClick={() => setIsVisible(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed w-[300px] rounded-[2.5rem] p-[1.5px] bg-gradient-to-br from-amber-500/50 via-amber-500/10 to-transparent shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] z-[9999]"
                style={{ top: cardPos.top, left: cardPos.left }}
              >
                <div className="relative h-full w-full rounded-[2.4rem] bg-[#0A0A0A]/95 backdrop-blur-3xl p-6 overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <Twitter size={22} className="text-amber-500" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVisible(false);
                          setIsDismissed(true);
                        }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-[var(--text-dim)] hover:text-white hover:bg-white/10 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em]">Acción Requerida</span>
                      </div>
                      <h4 className="text-xl font-black text-white leading-tight tracking-tight">
                        Conectá tu <span className="text-amber-500">Twitter</span>
                      </h4>
                      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed font-medium">
                        Para etiquetarte de forma automática cuando seas elegido <span className="text-white font-bold">Builder de la Semana</span> y destacar tu perfil en nuestra comunidad global.
                      </p>
                    </div>

                    {onAddTwitter && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVisible(false);
                          setIsDismissed(true);
                          onAddTwitter();
                        }}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-[900] text-sm transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
                      >
                        <Twitter size={16} />
                        Agregar Bloque de Redes
                      </button>
                    )}

                    <div className="mt-5 pt-5 border-t border-white/5 flex items-center gap-3">
                      <div className="flex -space-x-3">
                        {[
                          "https://i.pravatar.cc/150?u=huevsite1",
                          "https://i.pravatar.cc/150?u=huevsite2",
                          "https://i.pravatar.cc/150?u=huevsite3"
                        ].map((src, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] bg-zinc-900 overflow-hidden relative shadow-lg">
                            <img src={src} alt="Builder" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] font-bold text-[var(--text-dim)] leading-none">
                        <span className="text-white">+42 builders</span> ya conectaron su cuenta
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
