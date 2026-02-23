"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

export function UpgradeModal({ isOpen, onClose, accentColor }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Error al iniciar el checkout: " + (data.error || "Desconocido"));
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error redirecting to checkout:", error);
      alert("Error de conexión al iniciar el pago.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="portal-root fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 50 }}
          className="relative w-[90%] max-w-lg bg-[var(--surface)] border border-[var(--border-bright)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 mx-auto"
        >
          <div className="relative p-8 pb-0 text-center">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--surface2)] transition-all text-[var(--border-bright)] hover:text-white"
            >
              <X size={20} />
            </button>
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-black/40 border-2"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              <Sparkles size={32} />
            </div>
            <div className="section-label mb-2 mx-auto justify-center">// modo pro</div>
            <h3 className="text-3xl font-extrabold tracking-tight mb-4">Desbloqueá todo tu potencial</h3>
            <p className="text-[var(--text-dim)] text-sm mx-auto max-w-[280px] leading-relaxed">
              Llegaste al límite de bloques del plan gratuito. Pasándote a Pro vas a poder armar tu portfolio sin restricciones.
            </p>
          </div>

          <div className="p-8 pb-6">
            <div className="space-y-4 mb-8">
              {[
                "Bloques ilimitados en tu perfil",
                "Sin marca de agua de huevsite",
                "Acceso prioritario a nuevos bloques",
                "Soporte rápido para tus dudas"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={18} style={{ color: accentColor }} className="shrink-0" />
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={handleUpgrade}
              disabled={isLoading}
              className="btn btn-accent w-full py-4 text-base font-bold shadow-[0_0_20px_rgba(200,255,0,0.15)] flex justify-center items-center"
              style={{ backgroundColor: accentColor, color: "black", opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Redirigiendo...
                </>
              ) : (
                "Pasarme a Pro"
              )}
            </button>
            <p className="text-center text-[10px] text-[var(--text-muted)] mt-4 font-mono uppercase tracking-widest">
              Pago único anual · Cancela cuando quieras
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
