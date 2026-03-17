"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Sparkles, Layout as LayoutIcon, Zap, ArrowRight, User, Palette, 
  MapPin, Check, Lightbulb, Bot, Eye, ChevronLeft, Save, Github, BarChart3, Share2, Layers
} from "lucide-react";
import { PRESET_COLORS, getContrastColor, BlockData, BlockType } from "@/lib/profile-types";
import { HeroBlock } from "@/components/blocks/HeroBlock";
import { GitHubBlock } from "@/components/blocks/GitHubBlock";
import { MetricBlock, SocialBlock } from "@/components/blocks/Widgets";
import { StackBlock } from "@/components/blocks/ExtraBlocks";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onComplete?: (data: { name: string, tagline: string, accentColor: string, blocks?: BlockData[] }) => void;
  initialName?: string;
  initialTagline?: string;
  initialColor?: string;
}

type Step = "welcome" | "identity" | "style" | "suggestions" | "preview";

export function OnboardingModal({ 
  isOpen, 
  onClose, 
  username, 
  onComplete,
  initialName = "",
  initialTagline = "",
  initialColor = "#C8FF00"
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [formData, setFormData] = useState({
    name: initialName,
    tagline: initialTagline,
    accentColor: initialColor
  });
  const [selectedBlockTypes, setSelectedBlockTypes] = useState<BlockType[]>(["github", "social"]);
  const [githubHandle, setGithubHandle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep("welcome");
      setFormData({
        name: initialName,
        tagline: initialTagline,
        accentColor: initialColor
      });
    }
  }, [isOpen, initialName, initialTagline, initialColor]);

  if (!mounted) return null;

  const suggestions = [
    { 
      type: "Developer", 
      ideas: ["GitHub Stats", "Proyectos destacados", "Tech Stack", "Links a tu repo"] 
    },
    { 
      type: "Designer", 
      ideas: ["Media blocks (Dribbble/Behance)", "Certificaciones", "Redes sociales", "Link a Portfolio"] 
    },
    { 
      type: "Founder", 
      ideas: ["Métricas de tu producto", "Logros & Certificados", "Post de Blog", "Tag 'Building'"] 
    }
  ];

  const handleNext = () => {
    if (step === "welcome") setStep("identity");
    else if (step === "identity") setStep("style");
    else if (step === "style") setStep("suggestions");
    else if (step === "suggestions") setStep("preview");
    else if (step === "preview") {
      const finalBlocks = generateFinalBlocks();
      onComplete?.({ ...formData, blocks: finalBlocks });
      onClose();
    }
  };

  const generateFinalBlocks = (): BlockData[] => {
    const blocks: BlockData[] = [];
    
    // Always include hero
    blocks.push({
      id: "hero-preview",
      type: "hero",
      order: 0,
      col_span: 2,
      row_span: 2,
      visible: true,
      name: formData.name || username,
      tagline: formData.tagline || "Builder",
      avatarUrl: "",
      status: "Disponible",
      location: "Argentina 🇦🇷"
    } as any);

    selectedBlockTypes.forEach((type, idx) => {
      const base = {
        id: `mock-${type}-${idx}`,
        type: type,
        order: idx + 1,
        col_span: (type === 'github' || type === 'social') ? 1 : 1,
        row_span: (type === 'github') ? 2 : 1,
        visible: true,
      };

      if (type === 'github') {
        blocks.push({ ...base, username: githubHandle || "usuario", stats: { stars: 12, repos: 8, followers: 45 } } as any);
      } else if (type === 'social') {
        blocks.push({ ...base, links: [{ platform: "twitter", url: "x.com" }, { platform: "github", url: "github.com" }] } as any);
      } else if (type === 'metric') {
        blocks.push({ ...base, label: "SHIPPED", value: "12" } as any);
      } else if (type === 'stack') {
        blocks.push({ ...base, items: ["React", "Next.js", "TypeScript"] } as any);
      }
    });

    return blocks;
  };

  const handleBack = () => {
    if (step === "identity") setStep("welcome");
    else if (step === "style") setStep("identity");
    else if (step === "suggestions") setStep("style");
    else if (step === "preview") setStep("suggestions");
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const resp = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name })
      });
      const data = await resp.json();
      if (data.tagline) {
        setFormData(prev => ({ ...prev, tagline: data.tagline }));
      }
    } catch (e) {
      console.error("AI error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent)] to-emerald-400 rounded-[2.5rem] flex items-center justify-center mb-10 rotate-3 shadow-[0_0_40px_rgba(200,255,0,0.2)]">
              <Sparkles className="text-black" size={40} />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="text-[10px] font-black font-mono text-[var(--accent)] uppercase tracking-[0.2em]">HUEVSITE STUDIO v2.0</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
              Es hora de <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">hacerte notar.</span>
            </h2>
            <p className="text-[var(--text-dim)] text-base md:text-xl max-w-[400px] leading-relaxed font-medium mb-12">
              Bienvenido a tu nueva base de operaciones como builder. 🇦🇷
            </p>
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-3 bg-[var(--accent)] text-black font-black py-6 rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all text-xl shadow-[0_10px_40px_rgba(200,255,0,0.3)]"
            >
              Empezar ahora
              <ArrowRight size={22} strokeWidth={3} />
            </button>
          </div>
        );

      case "identity":
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="section-label !text-[10px] uppercase font-black tracking-widest text-[var(--accent)] mb-4">// Identidad</div>
              <h3 className="text-3xl font-black text-white tracking-tight">¿Cómo te conocen?</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest pl-1">Nombre Display</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tu Nombre"
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl focus:border-[var(--accent)] outline-none text-white font-bold transition-all text-lg"
                />
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest pl-1">Tu Tagline / Bio Corta</label>
                <div className="relative">
                  <input
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="ej: Fullstack Developer buildeando en público"
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl focus:border-[var(--accent)] outline-none text-white font-bold transition-all pr-14"
                  />
                  <button
                    onClick={generateWithAI}
                    disabled={isGenerating || !formData.name}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-all disabled:opacity-30"
                    title="Ayuda de IA (1 crédito)"
                  >
                    {isGenerating ? <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent animate-spin rounded-full" /> : <Bot size={20} />}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-dim)] pl-1">
                  💡 Tip: Sé conciso y mostrá qué te apasiona.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={handleBack} className="p-5 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5"><ChevronLeft /></button>
              <button onClick={handleNext} className="flex-1 bg-white text-black font-black p-5 rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Siguiente
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        );

      case "style":
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="section-label !text-[10px] uppercase font-black tracking-widest text-[var(--accent)] mb-4">// Visuales</div>
              <h3 className="text-3xl font-black text-white tracking-tight">Elegí tu color de marca.</h3>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, accentColor: color })}
                  className={`aspect-square rounded-2xl transition-all relative overflow-hidden flex items-center justify-center border-2 ${formData.accentColor === color ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]'}`}
                  style={{ backgroundColor: color }}
                >
                  {formData.accentColor === color && <Check className={getContrastColor(color) === '#FFFFFF' ? 'text-white' : 'text-black'} />}
                </button>
              ))}
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/10" style={{ backgroundColor: formData.accentColor }}>
                <Palette className={getContrastColor(formData.accentColor) === '#FFFFFF' ? 'text-white' : 'text-black'} size={24} />
              </div>
              <div>
                <p className="text-white font-bold">Este será tu color de acento.</p>
                <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest font-mono mt-1">HEX: {formData.accentColor}</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={handleBack} className="p-5 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5"><ChevronLeft /></button>
              <button onClick={handleNext} className="flex-1 bg-white text-black font-black p-5 rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Siguiente
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        );

      case "suggestions":
        const availableBlocks = [
          { type: "github", label: "GitHub Stats", icon: <Github size={18} />, desc: "Tus estrellas y repos" },
          { type: "social", label: "Social Links", icon: <Share2 size={18} />, desc: "Tus coordenadas" },
          { type: "metric", label: "Métricas", icon: <BarChart3 size={18} />, desc: "Números que importan" },
          { type: "stack", label: "Tech Stack", icon: <Layers size={18} />, desc: "Tus herramientas" },
        ];

        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="section-label !text-[10px] uppercase font-black tracking-widest text-[var(--accent)] mb-4">// Personalización</div>
              <h3 className="text-3xl font-black text-white tracking-tight">Elegí qué mostrar.</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableBlocks.map((b) => (
                <button
                  key={b.type}
                  onClick={() => {
                    setSelectedBlockTypes(prev => 
                      prev.includes(b.type as any) 
                        ? prev.filter(t => t !== b.type) 
                        : [...prev, b.type as any]
                    );
                  }}
                  className={`p-5 rounded-[2rem] border transition-all text-left flex items-start gap-4 ${selectedBlockTypes.includes(b.type as any) ? 'bg-[var(--accent)]/10 border-[var(--accent)] shadow-[0_0_20px_rgba(200,255,0,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                  <div className={`p-3 rounded-2xl ${selectedBlockTypes.includes(b.type as any) ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-white/40'}`}>
                    {b.icon}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{b.label}</div>
                    <div className="text-[10px] text-white/40 font-medium">{b.desc}</div>
                  </div>
                  {selectedBlockTypes.includes(b.type as any) && <Check size={16} className="ml-auto text-[var(--accent)]" />}
                </button>
              ))}
            </div>

            {selectedBlockTypes.includes("github") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-black/40 border border-[var(--accent)]/20 rounded-[2rem] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white/60">
                  <Github size={14} /> Tu usuario de GitHub
                </div>
                <input 
                  value={githubHandle}
                  onChange={(e) => setGithubHandle(e.target.value)}
                  placeholder="ej: tomasdeluca"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[var(--accent)] transition-all font-mono text-sm"
                />
              </motion.div>
            )}

            <div className="flex gap-4 pt-4">
              <button onClick={handleBack} className="p-5 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5"><ChevronLeft /></button>
              <button onClick={handleNext} className="flex-1 bg-white text-black font-black p-5 rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Ver Preview
                <Eye size={18} />
              </button>
            </div>
          </div>
        );

      case "preview":
        const previewBlocks = generateFinalBlocks();
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="section-label !text-[10px] uppercase font-black tracking-widest text-[var(--accent)] mb-4">// Resultado</div>
              <h3 className="text-3xl font-black text-white tracking-tight">Así se verá tu perfil.</h3>
            </div>

            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-6 bg-black/40 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)] opacity-[0.03] blur-[100px] pointer-events-none" />
              
              <div className="grid grid-cols-2 gap-4">
                {previewBlocks.map((block) => {
                  const props = { data: block as any, accentColor: formData.accentColor };
                  return (
                    <div 
                      key={block.id} 
                      className={`${block.col_span === 2 ? 'col-span-2' : 'col-span-1'} ${block.row_span === 2 ? 'row-span-2' : ''}`}
                    >
                      {block.type === 'hero' && <HeroBlock {...props} />}
                      {block.type === 'github' && <GitHubBlock {...props} />}
                      {block.type === 'social' && <SocialBlock {...props} />}
                      {block.type === 'metric' && <MetricBlock {...props} />}
                      {block.type === 'stack' && <StackBlock {...props} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={handleBack} className="p-5 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5"><ChevronLeft /></button>
              <button 
                onClick={handleNext}
                className="flex-1 bg-[var(--accent)] text-black font-black p-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(200,255,0,0.2)]"
                style={{ backgroundColor: formData.accentColor, color: getContrastColor(formData.accentColor) }}
              >
                Completar Perfil
                <Check size={20} />
              </button>
            </div>
          </div>
        );
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] z-10"
            style={{ '--accent': formData.accentColor } as any}
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] blur-[120px] pointer-events-none" style={{ backgroundColor: formData.accentColor }} />

            <div className="p-8 md:p-14 relative">
              <button
                onClick={onClose}
                className="absolute top-8 right-8 text-white/20 hover:text-white transition-all p-2 rounded-full hover:bg-white/5"
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress Bar (except for welcome) */}
            {step !== "welcome" && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                <motion.div
                  className="h-full bg-[var(--accent)]"
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: step === "identity" ? "25%" : 
                           step === "style" ? "50%" : 
                           step === "suggestions" ? "75%" : "100%" 
                  }}
                />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

