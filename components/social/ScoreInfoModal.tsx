"use client";

import { X, Zap, Target, Users, TrendingUp, Sparkles, Star } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accentColor?: string;
}

export function ScoreInfoModal({ isOpen, onClose, accentColor = "#C8FF00" }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    const sections = [
        {
            title: "Completitud (Base)",
            icon: <Target className="text-blue-400" size={18} />,
            points: "+100 pts",
            items: [
                "Foto de perfil y nombre real (vía Google/GitHub)",
                "Descripción (Tagline) de más de 10 caracteres"
            ]
        },
        {
            title: "Contenido de Builder",
            icon: <Zap className="text-yellow-400" size={18} />,
            points: "Variable",
            items: [
                "GitHub conectado o bloque activo: +150 pts",
                "Proyectos: +75 pts (primeros 3), luego +30 pts",
                "Building (Status): +30 pts cada uno",
                "Escritura (Blog): +20 pts cada uno"
            ]
        },
        {
            title: "Comunidad y Social",
            icon: <Users className="text-purple-400" size={18} />,
            points: "Recurrente",
            items: [
                "Recomendaciones recibidas: +25 pts",
                "Cada seguidor nuevo: +10 pts",
                "Dando recomendaciones a otros: +15 pts",
                "Nominando builders: +20 pts"
            ]
        },
        {
            title: "Premios y Freshness",
            icon: <Sparkles className="text-[var(--accent)]" size={18} />,
            points: "Bonus",
            items: [
                "Actualización en los últimos 30 días: +50 pts",
                "Suscripción PRO activa: +100 pts",
                "Ganador del Showcase Semanal: Badge especial"
            ]
        }
    ];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-lg bg-[var(--surface)] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 max-h-[92vh] mt-auto md:mt-0"
                        style={{ "--accent": accentColor } as any}
                    >
                        {/* Mobile Drag Handle */}
                        <div className="md:hidden flex justify-center pt-4 shrink-0">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-white/5 relative overflow-hidden shrink-0">
                            <div
                                className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl pointer-events-none"
                                style={{ backgroundColor: accentColor }}
                            />
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-2">
                                        Builder Score <span className="text-[var(--accent)]">🔥</span>
                                    </h2>
                                    <p className="text-[var(--text-dim)] font-mono text-[9px] md:text-[10px] uppercase tracking-widest mt-1">
                                       // Gamificación y reputación de comunidad
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/5 transition-all text-[var(--text-muted)] hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 md:space-y-8">
                            <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-2xl p-4">
                                <p className="text-xs md:text-sm leading-relaxed text-[var(--text-muted)]">
                                    El <strong className="text-white">Builder Score</strong> es un sistema que mide tu impacto en la escena tech de LATAM. No solo premia qué tan completo está tu portfolio, sino tu actividad y cómo ayudás a que otros builders crezcan.
                                </p>
                            </div>

                            <div className="grid gap-6">
                                {sections.map((section, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                                                    {section.icon}
                                                </div>
                                                <h3 className="font-bold text-xs md:text-sm tracking-tight text-white/90">{section.title}</h3>
                                            </div>
                                            <span className="text-[9px] md:text-[10px] font-mono font-black text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded-lg">
                                                {section.points}
                                            </span>
                                        </div>
                                        <ul className="grid gap-2 pl-10">
                                            {section.items.map((item, i) => (
                                                <li key={i} className="text-[10px] md:text-[11px] text-[var(--text-dim)] flex items-start gap-2 leading-snug">
                                                    <span className="text-[var(--accent)]/40 mt-1">•</span> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2">
                                <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex items-center gap-4">
                                    <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <Star size={16} className="text-amber-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[10px] md:text-xs font-bold text-white mb-0.5">Hall of Fame</h4>
                                        <p className="text-[9px] md:text-[10px] text-[var(--text-dim)] leading-tight">
                                            Los perfiles con mayor score aparecen primero en Explorar y el Feed Global.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-black/40 border-t border-white/5 flex justify-center shrink-0">
                            <button
                                onClick={onClose}
                                className="btn btn-accent !w-full !rounded-2xl !py-4 font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg shadow-[var(--accent)]/10 transition-transform active:scale-95"
                            >
                                Entendido, a buildear
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
