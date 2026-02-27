"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Layout as LayoutIcon, MessageSquare, Rocket, Github, Star, Layers, Users, BookOpen, Sparkles, FileText, Image, Award, Trophy, PenTool } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BlockType, MAX_FREE_BLOCKS } from "@/lib/profile-types";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { ShareModal } from "@/components/dashboard/ShareModal";

interface BlockSelectorProps {
  onAdd: (type: BlockType) => void;
  accentColor: string;
  currentBlockCount: number;
  subscriptionTier?: "free" | "pro";
  username?: string;
  twitterShareUnlocked?: boolean;
  extraBlocksFromShare?: number;
  onShareUnlocked?: () => void;
}

export function BlockSelector({
  onAdd,
  accentColor,
  currentBlockCount,
  subscriptionTier = "free",
  username = "",
  twitterShareUnlocked = false,
  extraBlocksFromShare = 0,
  onShareUnlocked,
}: BlockSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveLimit = subscriptionTier === "pro"
    ? Infinity
    : MAX_FREE_BLOCKS + extraBlocksFromShare;

  const atLimit = subscriptionTier !== "pro" && currentBlockCount >= effectiveLimit;

  const categories = [
    {
      name: "Social & Stats",
      blocks: [
        { type: "github", icon: <Github size={18} />, label: "GitHub Stats", desc: "Heatmap y repos destacados" },
        { type: "social", icon: <MessageSquare size={18} />, label: "Redes Sociales", desc: "Twitter, Farcaster, etc." },
        { type: "community", icon: <Users size={18} />, label: "Comunidad", desc: "Badges de comunidades" },
      ],
    },
    {
      name: "Proyectos y Logros",
      blocks: [
        { type: "project", icon: <LayoutIcon size={18} />, label: "Proyecto", desc: "Imagen, link y métricas" },
        { type: "building", icon: <Rocket size={18} />, label: "Building", desc: "¿Qué estás buildando ahora?" },
        { type: "achievement", icon: <Trophy size={18} />, label: "Logro", desc: "Hitos y victorias importantes" },
        { type: "certification", icon: <Award size={18} />, label: "Certificación", desc: "Cursos y certificados" },
        { type: "stack", icon: <Layers size={18} />, label: "Tech Stack", desc: "Tus herramientas favoritas" },
      ],
    },
    {
      name: "Contenido",
      blocks: [
        { type: "media", icon: <Image size={18} />, label: "Media", desc: "Imágenes o videos" },
        { type: "writing", icon: <BookOpen size={18} />, label: "Escritura", desc: "Tus últimos posts o blog" },
        { type: "metric", icon: <Star size={18} />, label: "Métrica", desc: "Números que importan (MRR, etc.)" },
        { type: "hero", icon: <Sparkles size={18} />, label: "Bio / Hero", desc: "Tu carta de presentación" },
        { type: "cv", icon: <FileText size={18} />, label: "CV / Resume", desc: "Subí tu CV en PDF" },
        { type: "custom", icon: <PenTool size={18} />, label: "Custom", desc: "Bloque a tu medida" },
      ],
    },
  ];

  const handleBlockClick = (type: BlockType) => {
    if (atLimit) {
      // Si ya usó el share, ir directo a upgrade; si no, ofrecer share primero
      if (twitterShareUnlocked) {
        setIsUpgradeModalOpen(true);
      } else {
        setIsShareModalOpen(true);
      }
      setIsOpen(false);
      return;
    }
    onAdd(type);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-[0.1em]">
          {subscriptionTier === "pro"
            ? "Bloques ilimitados"
            : `${currentBlockCount} / ${effectiveLimit} bloques`}
        </div>
        {subscriptionTier !== "pro" && (
          <div className="text-[9px] font-mono text-[var(--text-muted)]">
            {atLimit ? (
              <span className="text-yellow-400">límite alcanzado</span>
            ) : (
              <span>{effectiveLimit - currentBlockCount} restantes</span>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-accent w-full !rounded-2xl flex items-center justify-center gap-2 py-4"
        style={{ backgroundColor: accentColor }}
      >
        {isOpen ? <X size={20} /> : <Plus size={20} />}
        {isOpen ? "Cerrar" : "Agregar Bloque"}
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="portal-root fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full md:w-[90%] md:max-w-xl bg-[var(--surface)] border-t md:border border-[var(--border-bright)] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden z-10 mx-auto max-h-[90vh] flex flex-col pt-4 md:pt-0"
              >
                <div className="w-12 h-1.5 bg-[var(--border-bright)] rounded-full mx-auto md:hidden mb-4 shrink-0" />
                <div className="p-6 md:p-8 shrink-0 bg-transparent md:bg-black/40 border-b border-[var(--border)]">
                  <div className="section-label mb-2 hidden md:block">// biblioteca de bloques</div>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">¿Qué querés mostrar?</h3>
                </div>

                <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
                  <div className="space-y-8 md:space-y-10">
                    {categories.map((cat, i) => (
                      <div key={i}>
                        <h4 className="text-[10px] uppercase font-mono tracking-[0.2em] text-[var(--accent)] mb-4 px-2">{cat.name}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {cat.blocks.map((block) => (
                            <button
                              key={block.type}
                              onClick={() => handleBlockClick(block.type as BlockType)}
                              className="flex items-start gap-4 p-4 rounded-3xl hover:bg-[var(--surface2)] border border-transparent hover:border-[var(--border-bright)] transition-all group text-left"
                            >
                              <div
                                className="p-3 rounded-2xl bg-[var(--surface2)] text-[var(--text-dim)] group-hover:text-black group-hover:bg-[var(--accent)] transition-all flex-shrink-0"
                                style={{ "--accent": accentColor } as React.CSSProperties}
                              >
                                {block.icon}
                              </div>
                              <div>
                                <h5 className="text-sm font-bold mb-1">{block.label}</h5>
                                <p className="text-[11px] text-[var(--text-dim)] leading-snug">{block.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-black/20 text-center border-t border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-[0.1em]">
                    Próximamente: bloques de comunidad custom 🇦🇷
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        accentColor={accentColor}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        accentColor={accentColor}
        username={username}
        onUnlocked={() => {
          setIsShareModalOpen(false);
          onShareUnlocked?.();
        }}
      />
    </div>
  );
}
