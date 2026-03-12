"use client";

import { useState, useEffect } from "react";
import { X, Globe, Plus, Link as LinkIcon, ExternalLink, Trash2, Globe2, Loader2, Check, Settings, Copy, ArrowRight } from "lucide-react";
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
                                        {editingSiteId ? (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                        <Settings size={14} className="text-[var(--accent)]" style={{ color: accentColor }} />
                                                        Editando: <span className="text-[var(--accent)]" style={{ color: accentColor }}>{editValues.title}</span>
                                                    </h3>
                                                    <button 
                                                        onClick={() => setEditingSiteId(null)}
                                                        className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors"
                                                    >
                                                        ← Cancelar
                                                    </button>
                                                </div>

                                                <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">Título</label>
                                                        <input
                                                            type="text"
                                                            value={editValues.title}
                                                            onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                                                            style={{ "--accent": accentColor } as any}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">Slug (URL)</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono text-[var(--text-muted)]">/{username}/</span>
                                                            <input
                                                                type="text"
                                                                value={editValues.slug}
                                                                onChange={(e) => setEditValues({ ...editValues, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors font-mono"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">Icono / Avatar (URL)</label>
                                                        <div className="flex items-center gap-3">
                                                            {editValues.avatarUrl && (
                                                                <img src={editValues.avatarUrl} alt="Preview" className="w-10 h-10 rounded-xl bg-black border border-white/10" />
                                                            )}
                                                            <input
                                                                type="text"
                                                                value={editValues.avatarUrl}
                                                                onChange={(e) => setEditValues({ ...editValues, avatarUrl: e.target.value })}
                                                                placeholder="https://google.com/favicon.ico"
                                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[11px] focus:outline-none focus:border-[var(--accent)] transition-colors font-mono"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">Descripción (SEO)</label>
                                                        <textarea
                                                            value={editValues.description}
                                                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                                                            rows={3}
                                                            placeholder="De qué trata este sub-site..."
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={handleUpdateSubSite}
                                                        disabled={loading}
                                                        className="w-full btn btn-accent !rounded-xl !py-3 text-sm font-black text-black shadow-lg"
                                                        style={{ backgroundColor: accentColor }}
                                                    >
                                                        {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Guardar Cambios"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
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
                                                            <span className="text-xs font-mono text-[var(--text-muted)]">/{username}/</span>
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
                                                                    <div className="min-w-0 pr-4">
                                                                        <h4 className="text-sm font-bold text-white truncate">{site.title}</h4>
                                                                        <p className="text-[10px] font-mono text-[var(--text-dim)] mt-0.5">/{site.slug}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <button
                                                                            title="Editar ajustes"
                                                                            className="p-2 rounded-xl border border-white/5 hover:bg-white/10 text-[var(--text-dim)] hover:text-white transition-all"
                                                                            onClick={() => startEditing(site)}
                                                                        >
                                                                            <Settings size={14} />
                                                                        </button>
                                                                        <button
                                                                            title="Ver sitio"
                                                                            className="p-2 rounded-xl border border-white/5 hover:bg-white/10 text-[var(--text-dim)] hover:text-white transition-all"
                                                                            onClick={() => window.open(`/${username}/${site.slug}`, '_blank')}
                                                                        >
                                                                            <ExternalLink size={14} />
                                                                        </button>
                                                                        <button
                                                                            title="Borrar"
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
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeTab === "domain" && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 pb-8">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-bold text-white underline decoration-[var(--accent)]" style={{ textDecorationColor: accentColor }}>Configurá tu dominio en 3 pasos</h3>
                                            <p className="text-xs text-[var(--text-dim)]">Conectá tu marca personal al ecosistema huevsite.</p>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Paso 1: Configurar el Dominio */}
                                            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black" style={{ color: accentColor }}>1</div>
                                                    <h3 className="text-sm font-bold text-white">Ingresá tu dominio</h3>
                                                </div>

                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                        <input
                                                            type="text"
                                                            placeholder="ej: milestoner.xyz"
                                                            value={domain}
                                                            onChange={(e) => {
                                                                setDomain(e.target.value.toLowerCase().trim());
                                                                setVerificationResult(null);
                                                            }}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors font-mono"
                                                            style={{"--accent": accentColor} as any}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={handleDomainUpdate}
                                                        disabled={loading || domain === customDomain || !domain}
                                                        className="flex-1 btn btn-accent !rounded-xl !py-3 text-xs font-black uppercase tracking-widest shadow-lg"
                                                        style={{ backgroundColor: accentColor }}
                                                    >
                                                        {loading ? <Loader2 size={16} className="animate-spin mx-auto text-black" /> : "Guardar Cambios"}
                                                    </button>
                                                    
                                                    {customDomain && (
                                                        <button
                                                            onClick={() => onUpdateDomain("")}
                                                            className="px-4 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold"
                                                        >
                                                            Quitar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Paso 2: Instrucciones DNS */}
                                            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black" style={{ color: accentColor }}>2</div>
                                                    <h3 className="text-sm font-bold text-white">Configurá tus DNS</h3>
                                                </div>
                                                
                                                <p className="text-[11px] text-[var(--text-dim)] px-1">
                                                    Entrá a tu registrador (Namecheap, GoDaddy, Cloudflare) y agregá estos registros:
                                                </p>

                                                <div className="space-y-3">
                                                    {/* Opción A: Apex @ */}
                                                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Opción A: Dominio Raíz (@)</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                                                            <div className="text-[var(--text-muted)]">Tipo: <span className="text-white">A Record</span></div>
                                                            <div className="text-[var(--text-muted)]">Host: <span className="text-white">@</span></div>
                                                            <div className="text-[var(--text-muted)] group/copy flex items-center gap-1">
                                                                <span className="text-white">76.76.21.21</span>
                                                                <button 
                                                                    onClick={() => navigator.clipboard.writeText("76.76.21.21")}
                                                                    className="opacity-0 group-hover/copy:opacity-100 transition-opacity hover:text-[var(--accent)]"
                                                                    style={{ color: accentColor }}
                                                                >
                                                                    <Copy size={10} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-center">
                                                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">O TAMBIÉN</span>
                                                    </div>

                                                    {/* Opción B: WWW */}
                                                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Opción B: Subdominio (www)</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                                            <div className="text-[10px] font-mono text-[var(--text-muted)]">Tipo: <span className="text-white">CNAME</span></div>
                                                            <div className="text-[10px] font-mono text-[var(--text-muted)]">Host: <span className="text-white">www</span></div>
                                                        </div>
                                                        <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between group/copy">
                                                            <code className="text-[10px] font-mono text-[var(--accent)]" style={{ color: accentColor }}>cname.huevsite.io</code>
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText("cname.huevsite.io");
                                                                    setCopiedFeedback(true);
                                                                    setTimeout(() => setCopiedFeedback(false), 2000);
                                                                }}
                                                                className="text-white/30 hover:text-white transition-colors"
                                                            >
                                                                {copiedFeedback ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Paso 3: Verificar */}
                                            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black" style={{ color: accentColor }}>3</div>
                                                    <h3 className="text-sm font-bold text-white">Verificá la conexión</h3>
                                                </div>

                                                <button
                                                    onClick={handleVerify}
                                                    disabled={verifying || !domain}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-bold text-white shadow-inner"
                                                >
                                                    {verifying ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Check size={14} className="text-green-400" />
                                                    )}
                                                    {verifying ? "Consultando DNS..." : "Verificar Conexión"}
                                                </button>

                                                {verificationResult && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`p-4 rounded-2xl border ${verificationResult.isValid ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'} text-[11px] font-mono flex gap-3`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${verificationResult.isValid ? 'bg-green-500 text-black' : 'bg-amber-500 text-black'}`}>
                                                            {verificationResult.isValid ? <Check size={10} /> : "!"}
                                                        </div>
                                                        <p>{verificationResult.message}</p>
                                                    </motion.div>
                                                )}

                                                <div className="flex justify-between items-center px-4">
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Estado</span>
                                                    <div className="flex items-center gap-2">
                                                        {customDomain === domain && domain ? (
                                                            <a 
                                                                href={domain.startsWith('http') ? domain : `https://${domain}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 group hover:bg-green-500/20 transition-all"
                                                            >
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                                                <span className="text-[9px] font-bold text-green-400">Puntaje PRO</span>
                                                                <ExternalLink size={8} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </a>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                                <span className="text-[9px] font-bold text-white/30">Desconectado</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[10px] text-[var(--text-dim)] leading-relaxed italic border-l-2 border-white/10 pl-4 py-1">
                                            * Los cambios de DNS pueden tardar hasta 24 horas en propagarse. Si configuraste todo bien y no conecta, esperá un ratito.
                                        </p>
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
