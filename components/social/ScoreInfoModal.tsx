"use client";

import { X, Zap, Target, Users, TrendingUp, Sparkles, Star } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accentColor?: string;
    profileId?: string;
}

export function ScoreInfoModal({ isOpen, onClose, accentColor = "#C8FF00", profileId }: Props) {
    const [mounted, setMounted] = useState(false);
    const [breakdown, setBreakdown] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isOpen && profileId) {
            setLoading(true);
            supabase.rpc('get_builder_score_breakdown', { target_user_id: profileId })
                .then(({ data, error }) => {
                    if (!error) setBreakdown(data);
                    setLoading(false);
                });
        }
    }, [isOpen, profileId]);

    if (!mounted) return null;

    const sections = [
        {
            title: "Perfil Base (Max 100)",
            icon: <Target className="text-blue-400" size={18} />,
            points: breakdown ? `+${breakdown.breakdown.base.score} pts` : "Fijo",
            items: [
                `Foto de perfil: ${breakdown?.breakdown.base.details.has_image ? '+33' : '0'} / 33`,
                `Nombre completo: ${breakdown?.breakdown.base.details.has_name ? '+33' : '0'} / 33`,
                `Tagline (+10 chars): ${breakdown?.breakdown.base.details.tagline_length > 10 ? '+34' : (breakdown?.breakdown.base.details.tagline_length > 0 ? '+10' : '0')} / 34`
            ]
        },
        {
            title: "Contenido Builder",
            icon: <Zap className="text-yellow-400" size={18} />,
            points: breakdown ? `+${breakdown.breakdown.content.score} pts` : "Acumulativo",
            items: [
                `GitHub conectado: ${breakdown?.breakdown.content.details.has_github ? '+150' : '0'} pts`,
                `Proyectos: ${breakdown?.breakdown.content.details.project_count || 0} cargados (${breakdown ? (
                    Math.min(breakdown.breakdown.content.details.project_count, 3) * 75 +
                    Math.max(0, Math.min(breakdown.breakdown.content.details.project_count - 3, 3)) * 30 +
                    Math.max(0, breakdown.breakdown.content.details.project_count - 6) * 5
                ) : 0
                } pts)`,
                `Building (Status): ${breakdown?.breakdown.content.details.building_count || 0} cargados (${breakdown ? (
                    Math.min(breakdown.breakdown.content.details.building_count, 3) * 30 +
                    Math.max(0, breakdown.breakdown.content.details.building_count - 3) * 10
                ) : 0
                } pts)`,
                `Escritura (Blog): ${breakdown?.breakdown.content.details.writing_count || 0} cargados (${breakdown ? (
                    Math.min(breakdown.breakdown.content.details.writing_count, 3) * 20 +
                    Math.max(0, breakdown.breakdown.content.details.writing_count - 3) * 5
                ) : 0
                } pts)`
            ]
        },
        {
            title: "Comunidad y Social",
            icon: <Users className="text-purple-400" size={18} />,
            points: breakdown ? `+${breakdown.breakdown.social_received.score + breakdown.breakdown.social_given.score} pts` : "Dinámico",
            items: [
                `Endorsement recibido: ${breakdown?.breakdown.social_received.details.endorsements || 0} (+25 c/u)`,
                `Nominación recibida: ${breakdown?.breakdown.social_received.details.nominations || 0} (+15 c/u)`,
                `Seguidores: ${breakdown?.breakdown.social_received.details.followers || 0} (+10 c/u)`,
                `Reciprocidad: ${breakdown?.breakdown.social_given.score || 0} pts (por dar feedback)`
            ]
        },
        {
            title: "Premios y Freshness",
            icon: <Sparkles className="text-[var(--accent)]" size={18} />,
            points: breakdown ? `+${breakdown.breakdown.bonus.score} pts` : "Bonus",
            items: [
                `Freshness (Últimos 30d): ${breakdown?.breakdown.bonus.details.is_fresh ? '+50' : '0'} pts`,
                `Suscripción PRO activa: ${breakdown?.breakdown.bonus.details.is_pro ? '+100' : '0'} pts`,
                "Ganador semanal: Badge especial y visibilidad"
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
                                        {breakdown && (
                                            <span className="ml-2 text-white bg-white/10 px-3 py-1 rounded-2xl text-xl animate-in fade-in slide-in-from-left-4 duration-500">
                                                {breakdown.total} <span className="text-[10px] uppercase font-mono text-[var(--accent)]">pts</span>
                                            </span>
                                        )}
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
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-10 h-10 border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin" />
                                    <p className="text-xs font-mono text-[var(--accent)] animate-pulse uppercase tracking-widest">// Calculando breakdown...</p>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
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
