"use client";

import { useState, useEffect } from "react";
import { X, Globe, Plus, Link as LinkIcon, ExternalLink, Trash2, Globe2, Loader2, Check, Settings, Copy, ArrowRight, Sparkles, Lock } from "lucide-react";
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
    onUpdateSubSite: (id: string, updates: { title?: string, slug?: string, description?: string }) => Promise<void>;
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
    onUpdateSubSite,
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

    const [creationMode, setCreationMode] = useState<"magic" | "manual">("magic");
    const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState({ title: "", slug: "", description: "", avatarUrl: "" });
    const [copiedFeedback, setCopiedFeedback] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; message: string } | null>(null);

    // Sync domain state if customDomain prop changes (important for first load or external updates)
    useEffect(() => {
        if (customDomain !== undefined) {
            setDomain(customDomain);
            // Si el dominio cambia externamente, reseteamos el resultado de verificación
            setVerificationResult(null);
        }
    }, [customDomain]);

    const handleVerify = async () => {
        if (!domain) return;
        setVerifying(true);
        try {
            const res = await fetch("/api/profile/verify-domain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain })
            });
            const data = await res.json();
            setVerificationResult({ isValid: data.isValid, message: data.message });
        } catch (error) {
            setVerificationResult({ isValid: false, message: "Error al verificar" });
        } finally {
            setVerifying(false);
        }
    };

    const handleDomainUpdate = async () => {
        setLoading(true);
        try {
            await onUpdateDomain(domain);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateFromUrl = async () => {
        if (!aiUrl) return;
        setIsGenerating(true);
        
        const messages = [
            "Analizando la URL 🕵🏻...",
            "Extrayendo contexto de valor 🧠...",
            "Buscando imágenes clave 📸...",
            "Diseñando la grilla ideal 🍱...",
            "Escribiendo copy con punch ✍🏻...",
            "Ensamblando los bloques 🧱...",
            "Afinando los detalles finales 🪄...",
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

    const handleUpdateSubSite = async () => {
        if (!editingSiteId) return;
        setLoading(true);
        await onUpdateSubSite(editingSiteId, editValues);
        setLoading(false);
        setEditingSiteId(null);
    };

    const startEditing = (site: SubSite) => {
        setEditingSiteId(site.id);
        setEditValues({
            title: site.title,
            slug: site.slug,
            description: site.description || "",
            avatarUrl: site.avatarUrl || ""
        });
    };

    const tabs = [
        { id: "subsites", label: "Sub-sites", icon: Plus },
        { id: "domain", label: "Custom Domain", icon: Globe2 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-[95vw] md:w-[90vw] max-w-5xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Glow behind modal */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" style={{ "--accent": accentColor } as any} />

                        {/* Header */}
                        <div className="p-6 md:p-8 lg:p-10 border-b border-white/5 flex items-center justify-between relative bg-white/[0.02] shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]" style={{ "--accent": accentColor } as any}>
                                    <Settings size={24} style={{ color: accentColor }} />
                                </div>
                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-black tracking-tighter flex items-center gap-2">
                                        Configuración <span className="text-[var(--accent)]" style={{ color: accentColor }}>PRO</span>
                                    </h2>
                                    <p className="text-[10px] lg:text-xs font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">
                                        // Personalizá tu ecosistema personal
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Layout: Sidebar + Main Content */}
                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[60vh] md:min-h-[600px]">
                            {/* Navigation Tabs */}
                            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-4 md:p-6 bg-white/[0.01] shrink-0">
                                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none no-scrollbar">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`relative flex items-center gap-3 px-5 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors whitespace-nowrap md:w-full group overflow-hidden ${
                                                activeTab === tab.id
                                                    ? "text-white bg-white/[0.04] shadow-inner"
                                                    : "text-white/30 hover:text-white/80 hover:bg-white/[0.02]"
                                            }`}
                                        >
                                            {activeTab === tab.id && (
                                                <motion.div 
                                                    layoutId="activeTabIndicator"
                                                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                                                    style={{ backgroundColor: accentColor }}
                                                />
                                            )}
                                            <tab.icon size={16} className={`relative z-10 transition-all ${activeTab === tab.id ? "" : "opacity-50 group-hover:opacity-100"}`} style={{ color: activeTab === tab.id ? accentColor : undefined }} />
                                            <span className="relative z-10">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 md:p-8 lg:p-12">
                                <AnimatePresence mode="wait">
                                    {activeTab === "subsites" && (
                                        <motion.div 
                                            key="subsites"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="space-y-10 lg:space-y-12 max-w-5xl mx-auto"
                                        >
                                            {editingSiteId ? (
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between bg-white/[0.03] p-4 lg:p-6 rounded-3xl border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 lg:p-3 rounded-xl bg-white/5">
                                                                <Settings className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: accentColor }} />
                                                            </div>
                                                            <h3 className="text-sm lg:text-base font-bold text-white">Editando Página</h3>
                                                        </div>
                                                        <button 
                                                            onClick={() => setEditingSiteId(null)}
                                                            className="text-[10px] lg:text-xs font-black uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
                                                        >
                                                            CALCELAR
                                                        </button>
                                                    </div>

                                                    <div className="bg-white/[0.02] p-8 lg:p-10 rounded-[2.5rem] border border-white/5 space-y-8">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] lg:text-xs font-black text-white/30 uppercase tracking-widest ml-1">Visible como</label>
                                                                <input
                                                                    type="text"
                                                                    value={editValues.title}
                                                                    onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                                                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 lg:px-6 py-4 lg:py-5 text-sm lg:text-base focus:outline-none focus:border-[var(--accent)]/50 transition-all font-bold"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] lg:text-xs font-black text-white/30 uppercase tracking-widest ml-1">Ruta URL</label>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="px-4 lg:px-5 py-4 lg:py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] lg:text-xs font-mono text-white/30 shrink-0">/{username}/</div>
                                                                    <input
                                                                        type="text"
                                                                        value={editValues.slug}
                                                                        onChange={(e) => setEditValues({ ...editValues, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 lg:px-6 py-4 lg:py-5 text-sm lg:text-base focus:outline-none focus:border-[var(--accent)]/50 transition-all font-mono font-bold"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] lg:text-xs font-black text-white/30 uppercase tracking-widest ml-1">Miniatura (Avatar)</label>
                                                            <div className="flex items-center gap-4 group">
                                                                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-3xl bg-black border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1 group-hover:border-[var(--accent)]/40 transition-all" style={{ "--accent": accentColor } as any}>
                                                                    {editValues.avatarUrl ? (
                                                                        <img src={editValues.avatarUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl lg:rounded-[1.3rem]" />
                                                                    ) : <Globe className="w-6 h-6 lg:w-8 lg:h-8 text-white/10" />}
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={editValues.avatarUrl}
                                                                    onChange={(e) => setEditValues({ ...editValues, avatarUrl: e.target.value })}
                                                                    placeholder="Pega la URL de una imagen..."
                                                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 lg:px-6 py-4 lg:py-5 text-[11px] lg:text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-all font-mono text-white/60"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="pt-2">
                                                            <button
                                                                onClick={handleUpdateSubSite}
                                                                disabled={loading}
                                                                className="w-full py-4 lg:py-5 rounded-2xl text-sm lg:text-base font-black text-black shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                                                                style={{ backgroundColor: accentColor }}
                                                            >
                                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Guardar Cambios <Check className="w-5 h-5" /></>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-12 lg:space-y-16">
                                                    {/* List of Sites */}
                                                    <div className="space-y-6 lg:space-y-8">
                                                        <div className="flex items-center justify-between px-2">
                                                            <h3 className="text-xs lg:text-sm font-black text-white/30 uppercase tracking-[0.3em]">Tus páginas activas</h3>
                                                            <div className="text-xs lg:text-sm font-bold text-white/60 flex items-center gap-2">
                                                                <Sparkles size={16} style={{ color: accentColor }} />
                                                                <span>Sin límite PRO</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col gap-3 lg:gap-4">
                                                            {subSites.length === 0 ? (
                                                                <div className="py-24 rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center px-6 transition-all hover:bg-white/[0.02]">
                                                                    <div className="w-20 h-20 rounded-[2rem] bg-white/[0.03] flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                                                                        <LinkIcon size={32} className="text-white/20" />
                                                                    </div>
                                                                    <p className="text-lg lg:text-xl font-black text-white mb-2">Creá tu primer sub-site</p>
                                                                    <p className="text-sm lg:text-base text-white/40 max-w-sm leading-relaxed">Perfecto para portfolios específicos, newsletters o links de campañas.</p>
                                                                </div>
                                                            ) : (
                                                                subSites.map((site) => (
                                                                    <div key={site.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-[var(--accent)]/30 transition-all" style={{ "--accent": accentColor } as any}>
                                                                        <div className="flex items-center gap-4 min-w-0 pr-2">
                                                                            <div className="w-14 h-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                                                                                {site.avatarUrl ? <img src={site.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" /> : <Globe size={24} className="text-white/20" />}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <h4 className="text-base lg:text-lg font-black text-white truncate group-hover:text-[var(--accent)] transition-colors tracking-tight" style={{ "--accent": accentColor } as any}>{site.title}</h4>
                                                                                <div className="flex items-center gap-2 text-xs lg:text-sm font-mono text-white/40 mt-1">
                                                                                    <span className="opacity-50">/{username}/</span>
                                                                                    <span className="text-[var(--accent)] font-bold">{site.slug}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                                            <button
                                                                                onClick={() => startEditing(site)}
                                                                                className="p-3.5 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                                                                title="Editar"
                                                                            >
                                                                                <Settings size={18} /> <span className="sm:hidden text-sm font-bold">Editar</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => window.open(`/${username}/${site.slug}`, '_blank')}
                                                                                className="p-3.5 rounded-xl bg-white/5 text-white/40 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all flex items-center gap-2"
                                                                                style={{ color: activeTab === "subsites" ? undefined : accentColor } as any}
                                                                                title="Ver sitio"
                                                                            >
                                                                                <ExternalLink size={18} /> <span className="sm:hidden text-sm font-bold">Ver</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => onDeleteSubSite(site.id)}
                                                                                className="p-3.5 rounded-xl bg-white/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2"
                                                                                title="Eliminar"
                                                                            >
                                                                                <Trash2 size={18} /> <span className="sm:hidden text-sm font-bold">Borrar</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Creation Section */}
                                                    <div className="pt-10 lg:pt-16 border-t border-white/5">
                                                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-12 flex flex-col gap-10 max-w-3xl lg:max-w-4xl mx-auto relative overflow-hidden">
                                                        
                                                            {/* Backdrop Blur effect when magic */}
                                                            {creationMode === "magic" && <div className="absolute top-0 right-0 w-40 lg:w-96 h-40 lg:h-96 bg-[var(--accent)]/10 blur-[80px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none transition-all duration-1000" style={{ "--accent": accentColor } as any} />}
                                                        
                                                            <div className="bg-black/40 rounded-2xl p-1.5 flex gap-1 border border-white/5 w-full max-w-md mx-auto relative z-10">
                                                                <button
                                                                    onClick={() => setCreationMode("magic")}
                                                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[14px] text-xs lg:text-sm font-black uppercase tracking-widest transition-all ${creationMode === "magic" ? "bg-white/[0.05] text-white shadow-sm" : "text-white/30 hover:text-white/60"}`}
                                                                >
                                                                    <Sparkles size={16} style={{ color: creationMode === "magic" ? accentColor : undefined }} /> IA Mágica
                                                                </button>
                                                                <button
                                                                    onClick={() => setCreationMode("manual")}
                                                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[14px] text-xs lg:text-sm font-black uppercase tracking-widest transition-all ${creationMode === "manual" ? "bg-white/[0.05] text-white shadow-sm" : "text-white/30 hover:text-white/60"}`}
                                                                >
                                                                    <Plus size={16} /> Manual
                                                                </button>
                                                            </div>

                                                            {/* Form Card Content */}
                                                            {creationMode === "magic" ? (
                                                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10 max-w-xl mx-auto w-full text-center">
                                                                    <div className="space-y-4">
                                                                        <h4 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight">Cloná cualquier sitio.</h4>
                                                                        <p className="text-base lg:text-lg text-white/50 leading-relaxed">Nuestra IA analizará la URL y reconstruirá su contenido principal en un formato bento perfecto para vos.</p>
                                                                    </div>

                                                                    <div className="space-y-4 bg-black/20 p-6 lg:p-8 rounded-[2rem] border border-white/5 backdrop-blur-md">
                                                                        <div className="relative group text-left">
                                                                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-[var(--accent)]" size={24} style={{ color: aiUrl ? accentColor : undefined }} />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="ej: https://stripe.com"
                                                                                value={aiUrl}
                                                                                onChange={(e) => setAiUrl(e.target.value)}
                                                                                className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] pl-16 pr-6 py-5 lg:py-6 text-base lg:text-lg font-mono focus:border-[var(--accent)]/40 outline-none transition-all shadow-inner placeholder:text-white/20 text-white"
                                                                                style={{ "--accent": accentColor } as any}
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={handleGenerateFromUrl}
                                                                            disabled={isGenerating || !aiUrl}
                                                                            className="w-full h-16 rounded-[1.2rem] text-black text-sm font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-80 flex items-center justify-center gap-2 overflow-hidden relative shadow-xl"
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
                                                                                        className="flex items-center gap-3 absolute whitespace-nowrap"
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
                                                                                        Transformar URL <ArrowRight size={18} />
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10 max-w-xl mx-auto w-full text-center">
                                                                    <div className="space-y-4">
                                                                        <h4 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight">Empezá de cero.</h4>
                                                                        <p className="text-base lg:text-lg text-white/50 leading-relaxed">Creá un sub-site vacío y personalizalo a tu gusto asignándole bloques desde el editor principal propio.</p>
                                                                    </div>

                                                                    <div className="space-y-6 text-left bg-black/20 p-6 lg:p-8 rounded-[2rem] border border-white/5 backdrop-blur-md">
                                                                        <div className="space-y-2">
                                                                            <label className="text-xs uppercase tracking-widest font-black text-white/30 ml-2">Visible Como</label>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Ej: Mi Portfolio..."
                                                                                value={newSubSite.title}
                                                                                onChange={(e) => setNewSubSite({ ...newSubSite, title: e.target.value })}
                                                                                className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] px-6 py-5 lg:py-6 text-base lg:text-lg font-bold focus:border-[var(--accent)]/50 outline-none transition-all placeholder:text-white/20"
                                                                                style={{ "--accent": accentColor } as any}
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <label className="text-xs uppercase tracking-widest font-black text-white/30 ml-2">Ruta URL (Slug)</label>
                                                                            <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-[1.5rem] px-5 focus-within:border-[var(--accent)]/50 transition-all font-mono" style={{ "--accent": accentColor } as any}>
                                                                                <span className="text-sm lg:text-base text-white/30 shrink-0">/{username}/</span>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="ruta-url"
                                                                                    value={newSubSite.slug}
                                                                                    onChange={(e) => setNewSubSite({ ...newSubSite, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                                                                    className="flex-1 w-full bg-transparent py-5 lg:py-6 text-base lg:text-lg outline-none text-white font-bold"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            onClick={handleAddSubSite}
                                                                            disabled={!newSubSite.title || !newSubSite.slug}
                                                                            className="w-full h-16 rounded-[1.2rem] bg-white text-black font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3 text-sm shadow-xl"
                                                                        >
                                                                            Crear Página Manual <Plus size={20} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === "domain" && (
                                        <motion.div 
                                            key="domain"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="space-y-10 lg:space-y-16 max-w-5xl mx-auto"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-[var(--accent)] font-black text-[10px] lg:text-[11px] uppercase tracking-[0.3em]" style={{ color: accentColor }}>
                                                    White Label <Lock size={12} />
                                                </div>
                                                <h3 className="text-3xl lg:text-5xl font-[950] text-white tracking-tighter leading-none">Tu marca, tus reglas.</h3>
                                                <p className="text-sm lg:text-base text-white/40 leading-relaxed max-w-md">Conectá un dominio propio para eliminar cualquier rastro de Huevsite en la URL.</p>
                                            </div>

                                            <div className="flex flex-col gap-10 lg:gap-14 max-w-2xl mx-auto w-full">
                                                {/* Domain Input & Status Section */}
                                                <div className="space-y-6">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                                                        <span className="text-xs lg:text-sm font-black text-white/40 uppercase tracking-widest">Dominio Conectado</span>
                                                        {customDomain === domain && domain ? (
                                                            <span className="flex items-center justify-center sm:justify-end gap-2 text-green-400 font-bold text-xs uppercase bg-green-400/10 px-4 py-2 rounded-xl border border-green-400/20 w-fit">
                                                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                                                                Conexión Activa
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-black text-white/20 uppercase italic bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-fit">Desconectado</span>
                                                        )}
                                                    </div>

                                                    <div className="relative group">
                                                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--accent)] transition-colors" size={24} style={{ color: domain ? accentColor : undefined }} />
                                                        <input
                                                            type="text"
                                                            placeholder="ej: tunombre.com"
                                                            value={domain}
                                                            onChange={(e) => {
                                                                setDomain(e.target.value.toLowerCase().trim());
                                                                setVerificationResult(null);
                                                            }}
                                                            className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] pl-16 pr-6 py-5 lg:py-6 text-base lg:text-lg focus:outline-none focus:border-[var(--accent)]/50 transition-all font-mono font-bold shadow-inner placeholder:text-white/20 text-white"
                                                            style={{ "--accent": accentColor } as any}
                                                        />
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <button
                                                            onClick={handleDomainUpdate}
                                                            disabled={loading || domain === customDomain || !domain}
                                                            className="flex-1 py-5 lg:py-6 rounded-[1.2rem] text-sm font-[900] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                                                            style={{ backgroundColor: accentColor, color: "#000" }}
                                                        >
                                                            {loading ? <Loader2 size={24} className="animate-spin" /> : <>Vincular Dominio <Check size={20} /></>}
                                                        </button>
                                                        
                                                        {customDomain && (
                                                            <button
                                                                onClick={() => {
                                                                    if(confirm("¿Seguro que quieres desvincular el dominio?")) onUpdateDomain("")
                                                                }}
                                                                className="py-5 lg:py-6 px-6 rounded-[1.2rem] border border-red-500/20 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3"
                                                            >
                                                                <Trash2 size={20} /> <span className="sm:hidden">Desvincular</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Verification Status Card */}
                                                    {verificationResult && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={`p-6 rounded-[1.5rem] border ${verificationResult.isValid ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'} text-[11px] font-medium leading-relaxed mt-4`}
                                                        >
                                                            <div className="flex gap-4">
                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${verificationResult.isValid ? 'bg-green-500 text-black' : 'bg-amber-500 text-black'}`}>
                                                                    {verificationResult.isValid ? <Check size={16} /> : <div className="font-black">!</div>}
                                                                </div>
                                                                <p>{verificationResult.message}</p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {/* DNS Steps Section */}
                                                <div className="pt-8 lg:pt-10 border-t border-white/5 space-y-8">
                                                    <div className="flex items-center justify-between px-1">
                                                        <h4 className="text-sm lg:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-3">
                                                            <Globe2 className="w-5 h-5 text-white/30" />
                                                            Configuración DNS
                                                        </h4>
                                                        <div className="text-[10px] font-bold text-white/30 italic px-3 py-1.5 bg-white/[0.03] rounded-full border border-white/5 hidden sm:block">Propagación: ~48hs</div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                                        {/* Option 1: A Record */}
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center px-1">
                                                                <div className="text-xs font-black text-white/40 uppercase tracking-widest">Root (@)</div>
                                                                <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-lg shadow-inner">A RECORD</span>
                                                            </div>
                                                            <div 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText("76.76.21.21");
                                                                    setCopiedFeedback(true);
                                                                    setTimeout(() => setCopiedFeedback(false), 2000);
                                                                }}
                                                                className="group cursor-pointer bg-white/[0.02] rounded-2xl p-5 border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all active:scale-[0.99] flex items-center justify-between"
                                                            >
                                                                <div className="flex flex-col gap-1 font-mono text-xs">
                                                                    <div className="text-white/30 uppercase font-black tracking-widest text-[10px]">Nombre / Host</div>
                                                                    <div className="text-white text-sm">@ (vacio)</div>
                                                                    <div className="text-white/30 uppercase font-black tracking-widest text-[10px] mt-3">Valor / IP</div>
                                                                    <div className="text-white text-sm">76.76.21.21</div>
                                                                </div>
                                                                <Copy size={20} className="text-white/20 group-hover:text-white transition-colors self-start" />
                                                            </div>
                                                        </div>

                                                        {/* Option 2: CNAME */}
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center px-1">
                                                                <div className="text-xs font-black text-white/40 uppercase tracking-widest">Subdominio</div>
                                                                <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 border border-purple-400/20 px-3 py-1 rounded-lg shadow-inner">CNAME</span>
                                                            </div>
                                                            <div 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText("cname.huevsite.io");
                                                                    setCopiedFeedback(true);
                                                                    setTimeout(() => setCopiedFeedback(false), 2000);
                                                                }}
                                                                className="group cursor-pointer bg-white/[0.02] rounded-2xl p-5 border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all active:scale-[0.99] flex items-center justify-between"
                                                            >
                                                                <div className="flex flex-col gap-1 font-mono text-xs">
                                                                    <div className="text-white/30 uppercase font-black tracking-widest text-[10px]">Nombre / Host</div>
                                                                    <div className="text-white text-sm">www</div>
                                                                    <div className="text-white/30 uppercase font-black tracking-widest text-[10px] mt-3">Valor</div>
                                                                    <div className="text-[var(--accent)] font-bold text-sm truncate max-w-[150px]" style={{ color: accentColor }}>cname.huevsite.io</div>
                                                                </div>
                                                                <Copy size={20} className="text-white/20 group-hover:text-white transition-colors self-start" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={handleVerify}
                                                        disabled={verifying || !domain}
                                                        className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-30 mt-4"
                                                    >
                                                        {verifying ? <Loader2 size={20} className="animate-spin" /> : <Globe2 size={20} style={{ color: accentColor }} />}
                                                        {verifying ? "Propagando..." : "Validar Conexión"}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer decorative */}
                        <div className="p-4 bg-black/60 border-t border-white/5 flex items-center justify-center gap-2">
                            <Lock size={10} className="text-white/20" />
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
