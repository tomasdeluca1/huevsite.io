"use client";

import { X, Zap, Target, Users, TrendingUp, Sparkles, Star, MessageSquare, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accentColor?: string;
    profileId?: string;
}

export function ScoreInfoModal({ isOpen, onClose, accentColor = "#C8FF00", profileId }: Props) {
    const t = useTranslations('shared');
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
            title: t('scoreInfo.baseTitle'),
            icon: <Target className="text-blue-400" size={18} />,
            points: breakdown ? `+${breakdown.breakdown.base.score} pts` : t('scoreInfo.upTo100'),
            items: [
                `${t('scoreInfo.profilePhoto')}: ${breakdown ? (breakdown.breakdown.base.details.has_image ? '+33' : '0') + ' / 33' : '+33 pts'}`,
                `${t('scoreInfo.fullName')}: ${breakdown ? (breakdown.breakdown.base.details.has_name ? '+33' : '0') + ' / 33' : '+33 pts'}`,
                `${t('scoreInfo.tagline')}: ${breakdown ? (breakdown.breakdown.base.details.tagline_length > 10 ? '+34' : (breakdown.breakdown.base.details.tagline_length > 0 ? '+10' : '0')) + ' / 34' : '+34 pts'}`
            ]
        },
        {
            title: t('scoreInfo.contentTitle'),
            icon: <Zap className="text-yellow-400" size={18} />,
            points: breakdown ? `+${breakdown.breakdown.content.score} pts` : t('scoreInfo.pointsForContent'),
            items: [
                `${t('scoreInfo.githubConnected')}: ${breakdown ? (breakdown.breakdown.content.details.has_github ? '+150' : '0') + ' pts' : '+150 pts'}`,
                `${t('scoreInfo.projects')}: ${breakdown ? t('scoreInfo.loadedWithPts', {
                    count: breakdown.breakdown.content.details.project_count,
                    pts: (
                        Math.min(breakdown.breakdown.content.details.project_count, 3) * 75 +
                        Math.max(0, Math.min(breakdown.breakdown.content.details.project_count - 3, 3)) * 30 +
                        Math.max(0, breakdown.breakdown.content.details.project_count - 6) * 5
                    )
                }) : t('scoreInfo.upToEach', { pts: 75 })}`,
                `${t('scoreInfo.building')}: ${breakdown ? t('scoreInfo.loadedWithPts', {
                    count: breakdown.breakdown.content.details.building_count,
                    pts: (
                        Math.min(breakdown.breakdown.content.details.building_count, 3) * 30 +
                        Math.max(0, breakdown.breakdown.content.details.building_count - 3) * 10
                    )
                }) : t('scoreInfo.upToEach', { pts: 30 })}`,
                `${t('scoreInfo.writing')}: ${breakdown ? t('scoreInfo.loadedWithPts', {
                    count: breakdown.breakdown.content.details.writing_count,
                    pts: (
                        Math.min(breakdown.breakdown.content.details.writing_count, 3) * 20 +
                        Math.max(0, breakdown.breakdown.content.details.writing_count - 5) * 5
                    )
                }) : t('scoreInfo.upToEach', { pts: 20 })}`
            ]
        },
        {
            title: t('scoreInfo.communityTitle'),
            icon: <Users className="text-purple-400" size={18} />,
            points: breakdown ? `+${breakdown.breakdown.social_received.score + breakdown.breakdown.social_given.score} pts` : t('scoreInfo.interactions'),
            items: [
                `${t('scoreInfo.endorsementReceived')}: ${breakdown ? breakdown.breakdown.social_received.details.endorsements + ' (+25 c/u)' : '+25 pts c/u'}`,
                `${t('scoreInfo.nominationReceived')}: ${breakdown ? breakdown.breakdown.social_received.details.nominations + ' (+15 c/u)' : '+15 pts c/u'}`,
                `${t('scoreInfo.followers')}: ${breakdown ? breakdown.breakdown.social_received.details.followers + ' (+10 c/u)' : '+10 pts c/u'}`,
                `${t('scoreInfo.reciprocity')}: ${breakdown ? breakdown.breakdown.social_given.score + ' pts' : t('scoreInfo.reciprocityFallback')}`
            ]
        },
        {
            title: t('scoreInfo.testimonialTitle'),
            icon: <MessageSquare className="text-pink-400" size={18} />,
            points: breakdown?.breakdown?.testimonial ? `+${breakdown.breakdown.testimonial.score} pts` : "+50 pts",
            items: [
                `${t('scoreInfo.leaveTestimonial')}: ${breakdown?.breakdown?.testimonial ? (breakdown.breakdown.testimonial.details.has_testimonial ? '+50' : '0') + ' / 50' : '+50 pts'} ${t('scoreInfo.onceSuffix')}`,
                t('scoreInfo.testimonialDesc')
            ]
        },
        {
            title: t('scoreInfo.gamingTitle'),
            icon: <Star className="text-amber-400" size={18} />,
            points: breakdown?.breakdown?.pro_gaming ? `+${breakdown.breakdown.pro_gaming.score} pts` : "+80 pts c/u",
            items: [
                `${t('scoreInfo.subSitesPublished')}: ${breakdown?.breakdown?.pro_gaming ? breakdown.breakdown.pro_gaming.details.sub_sites_count : '0'} ${t('scoreInfo.subSitesPts')}`,
                `${t('scoreInfo.customDomain')}: ${breakdown?.breakdown?.pro_gaming?.details.has_custom_domain ? '+150 pts' : t('scoreInfo.notLinked')}`,
            ]
        },
        {
            title: t('scoreInfo.visibilityTitle'),
            icon: <TrendingUp className="text-emerald-400" size={18} />,
            points: breakdown?.breakdown?.visibility ? `+${breakdown.breakdown.visibility.score} pts` : t('scoreInfo.byVisits'),
            items: [
                `${t('scoreInfo.uniqueVisits')}: ${breakdown?.breakdown?.visibility ? breakdown.breakdown.visibility.details.unique_visitors_30d : '0'} ${t('scoreInfo.uniqueVisitsPts')}`,
                `${t('scoreInfo.contentDiversity')}: ${breakdown?.breakdown?.content?.details?.content_diversity_bonus ? '+100 pts' : '0 / 100'} ${t('scoreInfo.contentDiversitySuffix')}`
            ]
        },
        {
            title: t('scoreInfo.bonusTitle'),
            icon: <Sparkles className="text-[var(--accent)]" size={18} />,
            points: breakdown ? `+${breakdown.breakdown.bonus.score} pts` : t('scoreInfo.bonus'),
            items: [
                `${t('scoreInfo.freshness')}: ${breakdown ? (breakdown.breakdown.bonus.details.is_fresh ? '+50' : '0') + ' pts' : '+50 pts'}`,
                `${t('scoreInfo.proActive')}: ${breakdown ? (breakdown.breakdown.bonus.details.is_pro ? '+100' : '0') + ' pts' : '+100 pts'}`,
                t('scoreInfo.weeklyWinner')
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
                                       {t('scoreInfo.subtitle')}
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
                                    <p className="text-xs font-mono text-[var(--accent)] animate-pulse uppercase tracking-widest">{t('scoreInfo.calculating')}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-2xl p-4">
                                        <p className="text-xs md:text-sm leading-relaxed text-[var(--text-muted)]">
                                            {t.rich('scoreInfo.description', {
                                                strong: (c) => <strong className="text-white">{c}</strong>,
                                            })}
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

                                    {/* CTA testimonio: suma directa de score + prueba social para la home */}
                                    <Link
                                        href="/testimonio"
                                        className="block p-4 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.06] hover:bg-[var(--accent)]/[0.1] transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--accent)]/15 flex items-center justify-center">
                                                <MessageSquare size={16} className="text-[var(--accent)]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-[10px] md:text-xs font-bold text-white mb-0.5">
                                                    {breakdown?.breakdown?.testimonial?.details?.has_testimonial
                                                        ? t('scoreInfo.ctaTitleDone')
                                                        : t('scoreInfo.ctaTitle')}
                                                </h4>
                                                <p className="text-[9px] md:text-[10px] text-[var(--text-dim)] leading-tight">
                                                    {breakdown?.breakdown?.testimonial?.details?.has_testimonial
                                                        ? t('scoreInfo.ctaDescDone')
                                                        : t('scoreInfo.ctaDesc')}
                                                </p>
                                            </div>
                                            <ArrowRight size={16} className="text-[var(--accent)] shrink-0 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>

                                    <div className="pt-2">
                                        <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex items-center gap-4">
                                            <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                <Star size={16} className="text-amber-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[10px] md:text-xs font-bold text-white mb-0.5">{t('scoreInfo.hallOfFame')}</h4>
                                                <p className="text-[9px] md:text-[10px] text-[var(--text-dim)] leading-tight">
                                                    {t('scoreInfo.hallOfFameDesc')}
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
                                {t('scoreInfo.gotIt')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
