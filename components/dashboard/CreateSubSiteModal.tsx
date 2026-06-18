"use client";

import { useState } from "react";
import { X, Globe, Plus, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accentColor: string;
    onAddSubSite: (title: string, slug: string, description?: string, avatarUrl?: string) => Promise<void>;
    username: string;
}

export function CreateSubSiteModal({
    isOpen,
    onClose,
    accentColor,
    onAddSubSite,
    username
}: Props) {
    const t = useTranslations("dashboard");
    const [creationMode, setCreationMode] = useState<"magic" | "manual">("magic");
    const [newSubSite, setNewSubSite] = useState({ title: "", slug: "" });
    const [aiUrl, setAiUrl] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerateFromUrl = async () => {
        if (!aiUrl) return;
        setIsGenerating(true);
        
        const messages = [
            t("createSubSite.loadingAnalyzing"),
            t("createSubSite.loadingExtracting"),
            t("createSubSite.loadingImages"),
            t("createSubSite.loadingGrid"),
            t("createSubSite.loadingCopy"),
            t("createSubSite.loadingBlocks"),
            t("createSubSite.loadingFinal"),
        ];
        
        let msgIndex = 0;
        setLoadingMessage(messages[0]);
        const msgInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % messages.length;
            setLoadingMessage(messages[msgIndex]);
        }, 3000);

        try {
            const res = await fetch("/api/ai/generate-subsite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: aiUrl })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || t("createSubSite.generationFailed"));
            }

            // The API already created the sub-site in the DB — just refresh the list
            const data = await res.json();
            const site = data.subSite;
            if (site) {
                await onAddSubSite(
                    site.title,
                    site.slug,
                    site.description || "",
                    site.avatar_url || ""
                );
            }
            onClose();
            setAiUrl("");
        } catch (error: any) {
            alert(error.message || t("createSubSite.aiError"));
        } finally {
            clearInterval(msgInterval);
            setIsGenerating(false);
        }
    };

    const handleAddSubSite = async () => {
        if (!newSubSite.title || !newSubSite.slug) return;
        setLoading(true);
        try {
            await onAddSubSite(newSubSite.title, newSubSite.slug);
            onClose();
            setNewSubSite({ title: "", slug: "" });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0A0A0A]/80 border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between relative bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20" style={{ color: accentColor }}>
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tighter">
                                        {t("createSubSite.titlePrefix")} <span className="text-[var(--accent)]" style={{ color: accentColor }}>{t("createSubSite.titleHighlight")}</span>
                                    </h2>
                                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">
                                        {t("createSubSite.subtitle")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col gap-10">
                                <div className="bg-black/40 rounded-2xl p-1.5 flex gap-1 border border-white/5 w-full max-w-sm mx-auto">
                                    <button
                                        onClick={() => setCreationMode("magic")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${creationMode === "magic" ? "bg-white/[0.05] text-white" : "text-white/30 hover:text-white/60"}`}
                                    >
                                        <Sparkles size={16} style={{ color: creationMode === "magic" ? accentColor : undefined }} /> {t("createSubSite.tabMagic")}
                                    </button>
                                    <button
                                        onClick={() => setCreationMode("manual")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${creationMode === "manual" ? "bg-white/[0.05] text-white" : "text-white/30 hover:text-white/60"}`}
                                    >
                                        <Plus size={16} /> {t("createSubSite.tabManual")}
                                    </button>
                                </div>

                                {creationMode === "magic" ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-4 text-center">
                                            <h4 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter">{t("createSubSite.magicHeading")}</h4>
                                            <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">{t("createSubSite.magicDescription")}</p>
                                        </div>

                                        <div className="space-y-4 bg-black/20 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
                                            <div className="relative group">
                                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-[var(--accent)]" size={20} style={{ color: aiUrl ? accentColor : undefined }} />
                                                <input
                                                    type="text"
                                                    placeholder={t("createSubSite.urlPlaceholder")}
                                                    value={aiUrl}
                                                    onChange={(e) => setAiUrl(e.target.value)}
                                                    className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] pl-16 pr-6 py-5 text-base font-mono focus:border-[var(--accent)]/40 outline-none transition-all placeholder:text-white/20 text-white"
                                                />
                                            </div>
                                            <button
                                                onClick={handleGenerateFromUrl}
                                                disabled={isGenerating || !aiUrl}
                                                className="w-full h-16 rounded-[1.2rem] text-black text-sm font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-80 flex items-center justify-center gap-2 relative shadow-xl"
                                                style={{ backgroundColor: accentColor }}
                                            >
                                                <AnimatePresence mode="wait">
                                                    {isGenerating ? (
                                                        <motion.div 
                                                            key={loadingMessage}
                                                            initial={{ opacity: 0, y: 15 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -15 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="flex items-center gap-3 absolute"
                                                        >
                                                            <Loader2 size={18} className="animate-spin" /> 
                                                            <span>{loadingMessage}</span>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="idle"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="flex items-center gap-2 absolute"
                                                        >
                                                            {t("createSubSite.transformUrl")} <ArrowRight size={18} />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-4 text-center">
                                            <h4 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter">{t("createSubSite.manualHeading")}</h4>
                                            <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">{t("createSubSite.manualDescription")}</p>
                                        </div>

                                        <div className="space-y-6 bg-black/20 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-2">{t("createSubSite.labelVisibleAs")}</label>
                                                <input
                                                    type="text"
                                                    placeholder={t("createSubSite.titlePlaceholder")}
                                                    value={newSubSite.title}
                                                    onChange={(e) => setNewSubSite({ ...newSubSite, title: e.target.value })}
                                                    className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] px-6 py-5 text-base font-bold focus:border-[var(--accent)]/50 outline-none transition-all placeholder:text-white/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-2">{t("createSubSite.labelUrlPath")}</label>
                                                <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-[1.5rem] px-5 focus-within:border-[var(--accent)]/50 transition-all font-mono">
                                                    <span className="text-xs text-white/30 shrink-0">/{username}/</span>
                                                    <input
                                                        type="text"
                                                        placeholder={t("createSubSite.slugPlaceholder")}
                                                        value={newSubSite.slug}
                                                        onChange={(e) => setNewSubSite({ ...newSubSite, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                                        className="flex-1 w-full bg-transparent py-5 text-base outline-none text-white font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleAddSubSite}
                                                disabled={!newSubSite.title || !newSubSite.slug || loading}
                                                className="w-full h-16 rounded-[1.2rem] bg-white text-black font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3 text-sm"
                                            >
                                                {loading ? <Loader2 className="animate-spin" /> : <>{t("createSubSite.createManualButton")} <Plus size={20} /></>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-black/60 border-t border-white/5 flex items-center justify-center gap-2">
                            <Sparkles size={12} className="text-[var(--accent)]" style={{ color: accentColor }} />
                            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em] font-black">
                                White Label Infrastructure // Powered by Huevsite
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
