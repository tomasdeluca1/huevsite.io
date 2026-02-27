"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles, RefreshCcw, Eye, ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalUpdateModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] p-8 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(200,255,0,0.15)] relative animate-in fade-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-white transition-colors p-1 rounded-full hover:bg-[var(--surface2)]"
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent)] to-green-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(200,255,0,0.3)]">
          <Sparkles className="text-black" size={24} />
        </div>

        <h2 className="text-2xl font-black text-white mb-2 leading-tight">
          Llegó la revolución social a Huevsite 🥚🔥
        </h2>
        
        <p className="text-[var(--text-dim)] text-sm mb-6 leading-relaxed">
          Esta semana estuvimos trabajando a full en el motor (y en la pintura). Fijate todo lo nuevo que sumamos:
        </p>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] flex items-center justify-center shrink-0 text-white mt-0.5">
              <Sparkles size={14} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">Más de 10 lanzamientos 🚀</h4>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                ¡Endorsements entre builders, mejoras en la cuenta PRO, seguidores, y preparate para el feed social que se viene muy pronto!
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] flex items-center justify-center shrink-0 text-white mt-0.5">
              <RefreshCcw size={14} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">Nominaciones Flexibles 🔄</h4>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                ¿Te arrepentiste? Ahora podés cambiar a quién nominás en la semana en cualquier momento antes de que cierre el domingo a las 00:00.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] flex items-center justify-center shrink-0 text-white mt-0.5">
               <Eye size={14} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">Explorador y Tags PRO 👀</h4>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                Ordená por Endorsements, filtrá para ver quiénes te siguen, chusmeá los proyectos actualizados recientemente y mirá los nuevos estilos de diseño Premium.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/explore"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-black font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Ir al Explorar
            <ArrowRight size={16} />
          </Link>
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center py-3 rounded-xl border border-transparent text-[var(--text-dim)] hover:text-white hover:bg-[var(--surface2)] font-mono text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
