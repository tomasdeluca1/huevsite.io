"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X, RotateCcw, PenTool, Zap, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    text: string;
    onSelect: (newText: string) => void;
    accentColor: string;
}

export function AIRewriteButton({ text, onSelect, accentColor }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [variations, setVariations] = useState<{ professional: string; fun: string; short: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [credits, setCredits] = useState<number | null>(null);

    const handleRewrite = async () => {
        if (!text || text.length < 5) return;
        
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ai/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Algo falló");
            
            setVariations(data.variations);
            setCredits(data.remainingCredits);
            setIsOpen(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative inline-block ml-2">
            <button
                type="button"
                onClick={handleRewrite}
                disabled={isLoading || !text}
                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-90 ${isLoading ? 'opacity-50' : 'hover:bg-white/10 group'}`}
                title="Mejorame esto con IA"
            >
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin text-white/40" />
                ) : (
                    <Sparkles 
                        size={16} 
                        className="text-white/30 group-hover:text-[var(--accent)] transition-colors" 
                        style={{ color: isOpen ? accentColor : undefined }}
                    />
                )}
            </button>

            <AnimatePresence>
                {isOpen && variations && (
                    <>
                        <div 
                            className="fixed inset-0 z-[300]" 
                            onClick={() => setIsOpen(false)} 
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-72 lg:w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl z-[301] overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} style={{ color: accentColor }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">AI Copywriter</span>
                                </div>
                                {credits !== null && (
                                    <div className="text-[9px] font-mono text-white/30 uppercase bg-white/5 px-2 py-1 rounded-md">
                                        {credits} créditos
                                    </div>
                                )}
                            </div>

                            <div className="p-2 space-y-1">
                                <VariationItem 
                                    label="Profesional" 
                                    text={variations.professional} 
                                    icon={<PenTool size={12} />}
                                    onSelect={(t: string) => { onSelect(t); setIsOpen(false); }}
                                    accentColor={accentColor}
                                />
                                <VariationItem 
                                    label="Divertido" 
                                    text={variations.fun} 
                                    icon={<Zap size={12} />}
                                    onSelect={(t: string) => { onSelect(t); setIsOpen(false); }}
                                    accentColor={accentColor}
                                />
                                <VariationItem 
                                    label="Corto" 
                                    text={variations.short} 
                                    icon={<MessageSquare size={12} />}
                                    onSelect={(t: string) => { onSelect(t); setIsOpen(false); }}
                                    accentColor={accentColor}
                                />
                            </div>

                            <div className="p-3 bg-black/40 border-t border-white/5 flex justify-between items-center">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-[10px] font-bold text-white/20 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={handleRewrite}
                                    className="flex items-center gap-1.5 text-[10px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    <RotateCcw size={10} /> Regenerar
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-0 top-full mt-2 w-64 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-bold z-[301]"
                    >
                        {error}
                        <button onClick={() => setError(null)} className="absolute top-2 right-2"><X size={12} /></button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function VariationItem({ label, text, icon, onSelect, accentColor }: any) {
    return (
        <button
            onClick={() => onSelect(text)}
            className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-all group relative border border-transparent hover:border-white/10"
        >
            <div className="flex items-center gap-2 mb-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                {icon}
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-xs text-white/50 group-hover:text-white/90 leading-relaxed font-medium">
                {text}
            </p>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Check size={12} style={{ color: accentColor }} />
            </div>
        </button>
    );
}
