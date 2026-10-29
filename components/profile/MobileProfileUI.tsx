"use client";

import { useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getContrastColor } from "@/lib/profile-types";

interface MobileHeaderProps {
    displayName: string;
    avatarUrl?: string;
    builderScore: number;
    accentColor: string;
    username: string;
    isCustomDomain?: boolean;
    isWinner?: boolean;
    currentUserId?: string | null;
}

export function MobileStickyHeader({ displayName, avatarUrl, builderScore, accentColor, username, isCustomDomain = false, isWinner = false, currentUserId = null }: MobileHeaderProps) {
    const t = useTranslations("profile");
    const { scrollY } = useScroll();
    // Aparece después de scroll significativo (después de pasar el header original)
    const headerOpacity = useTransform(scrollY, [150, 250], [0, 1]);
    const headerY = useTransform(scrollY, [150, 250], [-20, 0]);
    // Un hijo con pointer-events:auto re-habilita lo que el padre apagó: la barra solo
    // captura toques cuando es visible (mismo umbral de scroll que la opacidad).
    const barPointerEvents = useTransform(scrollY, (v) => (v > 150 ? "auto" : "none"));
    const [barVisible, setBarVisible] = useState(false);
    useMotionValueEvent(scrollY, "change", (v) => setBarVisible(v > 150));

    return (
        <motion.div
            style={{ opacity: headerOpacity, y: headerY }}
            className="fixed top-0 left-0 right-0 z-[1000] p-3 md:hidden pointer-events-none"
        >
            <motion.div
                style={{ pointerEvents: barPointerEvents }}
                className="mx-auto max-w-sm h-14 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-between px-4 shadow-2xl"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-8 h-8 rounded-full border border-white/10 shrink-0 flex items-center justify-center text-xs font-black"
                        style={{ 
                            background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}, #00FF88)`,
                            color: avatarUrl ? 'transparent' : getContrastColor(accentColor)
                        }}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            displayName[0]?.toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs font-bold text-white truncate leading-none mb-1">{displayName}</span>
                            {isWinner && <Trophy size={10} className="text-[var(--accent)] shrink-0 mb-1" style={{ color: accentColor }} />}
                        </div>
                        <span className="text-[9px] font-mono text-[var(--accent)] flex items-center gap-1" style={{ color: accentColor }}>
                            <Flame size={10} /> {builderScore} score
                        </span>
                    </div>
                </div>

                {!isCustomDomain && (
                    <Link
                        href={currentUserId ? "/dashboard" : "/login"}
                        tabIndex={barVisible ? undefined : -1}
                        className="btn !py-2 !px-4 !rounded-full !text-[10px] uppercase font-black tracking-widest"
                        style={{ backgroundColor: accentColor, color: 'black' }}
                    >
                        {/* Sin sesión: invita a crear el propio; con sesión: vuelve al panel */}
                        {currentUserId ? t("stickyMyProfile") : t("stickyCreateMine")}
                    </Link>
                )}
            </motion.div>
        </motion.div>
    );
}
