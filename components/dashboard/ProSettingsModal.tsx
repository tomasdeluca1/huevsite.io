"use client";

import { useState } from "react";
import { X, Globe, Plus, Link as LinkIcon, ExternalLink, Trash2, Globe2, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SubSite } from "@/lib/profile-types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accentColor: string;
    subSites: SubSite[];
    customDomain?: string;
    onUpdateDomain: (domain: string) => Promise<void>;
    onAddSubSite: (title: string, slug: string) => Promise<void>;
    onDeleteSubSite: (id: string) => Promise<void>;
    username: string;
}

export function ProSettingsModal({
    isOpen,
    onClose,
    accentColor,
    subSites,
    customDomain,
    onUpdateDomain,
    onAddSubSite,
    onDeleteSubSite,
    username
}: Props) {
    const [activeTab, setActiveTab] = useState<"subsites" | "domain">("subsites");
    const [domain, setDomain] = useState(customDomain || "");
    const [newSubSite, setNewSubSite] = useState({ title: "", slug: "" });
    const [aiUrl, setAiUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [success, setSuccess] = useState(false);

    const handleDomainUpdate = async () => {
        setLoading(true);
        await onUpdateDomain(domain);
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
    };

    const handleGenerateFromUrl = async () => {
        if (!aiUrl) return;
        setIsGenerating(true);
        
        const messages = [
            "Analizando la URL 🧠...",
            "Extrayendo contenido principal...",
            "Diseñando bloques perfectos 🎨...",
            "Casi listo! Ajustando detalles...",
        ];
        
        let msgIndex = 0;
        setLoadingMessage(messages[0]);
        const msgInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % messages.length;
            setLoadingMessage(messages[msgIndex]);
        }, 2500);

        try {
            const res = await fetch("/api/ai/generate-subsite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: aiUrl })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Falló la generación");
            }
            
            // Si funciona, recargamos la página para que Next.js obtenga los nuevos sub-sites de la DB
            // (La forma ideal sería llamar onSuccess y actualizar el state, pero reload asegura la re-hidratación de bloques).
            window.location.reload();
            
        } catch (error: any) {
            alert(error.message || "Hubo un error con la IA.");
        } finally {
            clearInterval(msgInterval);
            setIsGenerating(false);
            setAiUrl("");
        }
    };

    const handleAddSubSite = async () => {
        if (!newSubSite.title || !newSubSite.slug) return;
        setLoading(true);
        await onAddSubSite(newSubSite.title, newSubSite.slug);
        setLoading(false);
        setNewSubSite({ title: "", slug: "" });
    };

    const tabs = [
        { id: "subsites", label: "Sub-sites", icon: Plus },
        { id: "domain", label: "Custom Domain", icon: Globe2 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                                    PRO <span className="text-[var(--accent)]" style={{ color: accentColor }}>Settings</span>
                                </h2>
                                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">
                  // Desbloqueá todo tu potencial
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/5 transition-all text-[var(--text-muted)] hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex h-[450px]">
                            {/* Sidebar Tabs */}
                            <div className="w-1/3 border-r border-white/5 p-4 space-y-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                                            ? "bg-white/10 text-white"
                                            : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                                            }`}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Panel */}
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                {activeTab === "subsites" && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-2 underline decoration-[var(--accent)]" style={{ textDecorationColor: accentColor }}>Crear Nuevo Sub-site</h3>
                                            <p className="text-xs text-[var(--text-dim)] mb-4">Crea una página dedicada de forma manual.</p>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Título del proyecto"
                                                    value={newSubSite.title}
                                                    onChange={(e) => setNewSubSite({ ...newSubSite, title: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                                                    style={{ "--accent": accentColor } as any}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-[var(--text-muted)]">huevsite.io/username/</span>
                                                    <input
                                                        type="text"
                                                        placeholder="url-amigable"
                                                        value={newSubSite.slug}
                                                        onChange={(e) => setNewSubSite({ ...newSubSite, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors font-mono"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleAddSubSite}
                                                    disabled={loading || isGenerating || !newSubSite.title || !newSubSite.slug}
                                                    className="w-full btn btn-outline !border-white/10 hover:!border-white/30 !rounded-xl !py-2.5 text-xs font-bold text-white transition-all bg-white/5"
                                                >
                                                    {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Crear Manualmente"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5">
                                             <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                                 <span className="bg-[var(--accent)] text-black text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse" style={{ backgroundColor: accentColor }}>Magic</span>
                                                 Generar desde URL
                                             </h3>
                                             <p className="text-xs text-[var(--text-dim)] mb-4">La IA leerá tu página (ej. un producto, un blog post, tu LinkedIn) y armará un sub-site completo por vos. 🪄</p>
                                             
                                             <div className="space-y-3 p-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 relative overflow-hidden" style={{ "--accent": accentColor } as any}>
                                                 <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 blur-[40px] rounded-full pointer-events-none" />
                                                 
                                                 <div className="relative z-10 flex gap-2 w-full">
                                                    <div className="relative flex-1">
                                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
                                                        <input
                                                            type="text"
                                                            placeholder="https://mi-proyecto.com"
                                                            value={aiUrl}
                                                            onChange={(e) => setAiUrl(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-all font-mono placeholder:text-[var(--text-muted)] text-white shadow-inner"
                                                            disabled={isGenerating}
                                                        />
                                                    </div>
                                                 </div>
                                                 <button
                                                     onClick={handleGenerateFromUrl}
                                                     disabled={isGenerating || !aiUrl}
                                                     className="w-full relative z-10 btn btn-accent !rounded-xl !py-3 text-sm font-black text-black overflow-hidden group shadow-[0_0_15px_rgba(200,255,0,0.15)] flex justify-center items-center gap-2 transition-all hover:scale-[1.02]"
                                                     style={{ backgroundColor: accentColor }}
                                                 >
                                                     {isGenerating ? (
                                                         <>
                                                            <Loader2 size={16} className="animate-spin text-black" />
                                                            <span>{loadingMessage}</span>
                                                         </>
                                                     ) : (
                                                         <>Generar Mágicamente ✨</>
                                                     )}
                                                 </button>
                                             </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5">
                                            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Tus Sub-sites</h3>
                                            <div className="space-y-3">
                                                {subSites.length === 0 ? (
                                                    <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl">
                                                        <p className="text-xs text-[var(--text-dim)] font-mono italic">No tenés sub-sites todavía.</p>
                                                    </div>
                                                ) : (
                                                    subSites.map((site) => (
                                                        <div key={site.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white">{site.title}</h4>
                                                                <p className="text-[10px] font-mono text-[var(--text-dim)] mt-0.5">/{site.slug}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    className="p-2 rounded-xl border border-white/5 hover:bg-white/10 text-[var(--text-dim)] group-hover:text-white transition-all"
                                                                    onClick={() => window.open(`/${username}/${site.slug}`, '_blank')}
                                                                >
                                                                    <ExternalLink size={14} />
                                                                </button>
                                                                <button
                                                                    className="p-2 rounded-xl border border-white/5 hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all"
                                                                    onClick={() => onDeleteSubSite(site.id)}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "domain" && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-2 underline decoration-[var(--accent)]" style={{ textDecorationColor: accentColor }}>Personalizar Dominio</h3>
                                            <p className="text-xs text-[var(--text-dim)] mb-4">Conecta tu propio dominio (ej: builder.com) a tu huevsite.</p>

                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
                                                <p className="text-[10px] leading-relaxed text-amber-200/80">
                                                    <span className="font-bold text-amber-400">Nota:</span> Después de configurar el dominio acá, deberás apuntar un CNAME en tus ajustes de DNS hacia <code className="bg-black/40 px-1 rounded text-white">cname.huevsite.io</code>.
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                                    <input
                                                        type="text"
                                                        placeholder="midominio.com"
                                                        value={domain}
                                                        onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors font-mono"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleDomainUpdate}
                                                    disabled={loading || domain === customDomain}
                                                    className="w-full btn btn-accent !rounded-xl !py-3 text-xs font-bold"
                                                    style={{ backgroundColor: accentColor }}
                                                >
                                                    {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : success ? <Check size={16} className="mx-auto" /> : "Guardar Dominio"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5">
                                            <h4 className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em] mb-4">Estado del Dominio</h4>
                                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 opacity-50">
                                                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse" />
                                                <span className="text-xs font-mono text-[var(--text-dim)]">Validación pendiente...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-black/40 border-t border-white/5 text-center">
                            <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                                Exclusivo para Builders <span className="text-[var(--accent)]" style={{ color: accentColor }}>PRO</span>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
