"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles, LayoutGrid, MousePointerClick, Share2, ArrowRight } from "lucide-react";

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
          Tu onboarding express de Huevsite 🥚✨
        </h2>
        
        <p className="text-[var(--text-dim)] text-sm mb-6 leading-relaxed">
          Te dejamos una mini guía para que armes un perfil que se vea bien y se entienda en segundos.
        </p>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] flex items-center justify-center shrink-0 text-white mt-0.5">
              <LayoutGrid size={14} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">1) Armá tu grilla en 5 minutos</h4>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                Sumá 3 bloques base para arrancar fuerte: Hero, Proyecto destacado y Stack. Con eso ya contás quién sos y qué hacés.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] flex items-center justify-center shrink-0 text-white mt-0.5">
              <MousePointerClick size={14} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">2) Dejá todo fácil de explorar</h4>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                Ordená los bloques por prioridad y dejá arriba lo que querés que vean primero: tus mejores proyectos o tu CTA principal.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] flex items-center justify-center shrink-0 text-white mt-0.5">
               <Share2 size={14} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">3) Publicalo y compartilo</h4>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                Copiá tu URL desde el dashboard y pegala en tu bio de X, LinkedIn o GitHub. Un solo link, toda tu presencia builder.
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
            Ver inspiración en Explorar
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
