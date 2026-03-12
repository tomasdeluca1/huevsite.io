"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Compass, Layout, Plus, Share2, Flame, Star } from "lucide-react";
import Link from "next/link";

interface MobileHeaderProps {
    displayName: string;
    avatarUrl?: string;
    builderScore: number;
    accentColor: string;
    username: string;
    isCustomDomain?: boolean;
}

export function MobileStickyHeader({ displayName, avatarUrl, builderScore, accentColor, username, isCustomDomain = false }: MobileHeaderProps) {
    const { scrollY } = useScroll();
    // Aparece después de scroll significativo (después de pasar el header original)
    const headerOpacity = useTransform(scrollY, [150, 250], [0, 1]);
    const headerY = useTransform(scrollY, [150, 250], [-20, 0]);

    return (
        <motion.div
            style={{ opacity: headerOpacity, y: headerY }}
            className="fixed top-0 left-0 right-0 z-[1000] p-3 md:hidden pointer-events-none"
        >
            <div
                className="mx-auto max-w-sm h-14 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-between px-4 shadow-2xl pointer-events-auto"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-8 h-8 rounded-full border border-white/10 shrink-0 flex items-center justify-center text-xs font-black text-black"
                        style={{ background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}, #00FF88)` }}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            displayName[0]?.toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate leading-none mb-1">{displayName}</span>
                        <span className="text-[9px] font-mono text-[var(--accent)] flex items-center gap-1" style={{ color: accentColor }}>
                            <Flame size={10} /> {builderScore} score
                        </span>
                    </div>
                </div>

                {!isCustomDomain && (
                    <Link
                        href="/dashboard"
                        className="btn !py-2 !px-4 !rounded-full !text-[10px] uppercase font-black tracking-widest"
                        style={{ backgroundColor: accentColor, color: 'black' }}
                    >
                        Mi Perfil
                    </Link>
                )}
            </div>
        </motion.div>
    );
}

export function MobileBottomNav({ accentColor, currentUserId, isCustomDomain = false }: { accentColor: string; currentUserId?: string | null; isCustomDomain?: boolean }) {
    return (
        <div className="fixed bottom-6 left-0 right-0 z-[1000] md:hidden px-4">
            <div className="mx-auto max-w-[280px] h-16 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center justify-around px-2 shadow-2xl">
                {!isCustomDomain && (
                    <Link
                        href="/explore"
                        className="flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-white transition-colors group"
                    >
                        <div className="p-2 rounded-xl group-active:bg-white/5 transition-all">
                            <Compass size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Explorar</span>
                    </Link>
                )}

                {!isCustomDomain && (
                    <Link
                        href="/dashboard"
                        className="relative -top-3"
                    >
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--accent)]/20 transition-transform active:scale-95"
                            style={{ backgroundColor: accentColor }}
                        >
                            <Plus size={28} strokeWidth={3} className="text-black" />
                        </div>
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-[var(--accent)]" style={{ color: accentColor }}>Post</span>
                    </Link>
                )}

                {!isCustomDomain && (
                    <Link
                        href={currentUserId ? "/dashboard" : "/login"}
                        className="flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-white transition-colors group"
                    >
                        <div className="p-2 rounded-xl group-active:bg-white/5 transition-all">
                            <Layout size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">{currentUserId ? "Mío" : "Entrar"}</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
