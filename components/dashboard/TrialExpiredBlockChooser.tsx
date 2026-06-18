"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Crown } from "lucide-react";
import { useTranslations } from "next-intl";
import { BlockData, MAX_FREE_BLOCKS } from "@/lib/profile-types";

interface Props {
  blocks: BlockData[];
  extraBlocksFromShare: number;
  accentColor: string;
  onConfirm: (keepBlockIds: string[]) => void;
  onUpgrade: () => void;
}

const BLOCK_TYPE_LABEL_KEYS: Record<string, string> = {
  hero: "trialExpired.blockType.hero",
  building: "trialExpired.blockType.building",
  github: "trialExpired.blockType.github",
  project: "trialExpired.blockType.project",
  stack: "trialExpired.blockType.stack",
  metric: "trialExpired.blockType.metric",
  social: "trialExpired.blockType.social",
  community: "trialExpired.blockType.community",
  writing: "trialExpired.blockType.writing",
  cv: "trialExpired.blockType.cv",
  media: "trialExpired.blockType.media",
  certification: "trialExpired.blockType.certification",
  achievement: "trialExpired.blockType.achievement",
  custom: "trialExpired.blockType.custom",
  collab: "trialExpired.blockType.collab",
  ecosystem: "trialExpired.blockType.ecosystem",
};

export function TrialExpiredBlockChooser({ blocks, extraBlocksFromShare, accentColor, onConfirm, onUpgrade }: Props) {
  const t = useTranslations("dashboard");
  const blockTypeLabel = (type: string): string =>
    BLOCK_TYPE_LABEL_KEYS[type] ? t(BLOCK_TYPE_LABEL_KEYS[type]) : type;
  const getBlockTitle = (block: BlockData): string => {
    const data = block as any;
    return data.title || data.name || data.project || data.label || blockTypeLabel(block.type);
  };
  const limit = MAX_FREE_BLOCKS + extraBlocksFromShare;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Pre-select the first N blocks by order
    return new Set(blocks.slice(0, limit).map(b => b.id));
  });

  const toggleBlock = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < limit) {
        next.add(id);
      }
      return next;
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-[950] text-white tracking-tight">{t("trialExpired.title")}</h2>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            {t("trialExpired.descriptionPrefix")} <span className="text-white font-bold">{t("trialExpired.blocksCount", { n: blocks.length })}</span> {t("trialExpired.descriptionMiddle")} <span className="text-white font-bold">{limit}</span>.
            {" "}{t("trialExpired.descriptionSuffix")}
          </p>
        </div>

        {/* Block list */}
        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">
            {t("trialExpired.selectInstruction", { limit })} ({selectedIds.size}/{limit})
          </div>
          <div className="space-y-2">
            {blocks.map((block) => {
              const isSelected = selectedIds.has(block.id);
              const isDisabled = !isSelected && selectedIds.size >= limit;
              return (
                <button
                  key={block.id}
                  onClick={() => toggleBlock(block.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                      : isDisabled
                        ? "border-white/5 bg-white/[0.01] opacity-30 cursor-not-allowed"
                        : "border-white/5 bg-white/[0.02] hover:border-white/15"
                  }`}
                  style={{ "--accent": accentColor } as React.CSSProperties}
                >
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? "bg-[var(--accent)] border-[var(--accent)]"
                      : "border-white/20 bg-white/5"
                  }`}>
                    {isSelected && <Check size={14} className="text-black" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{getBlockTitle(block)}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-black">
                      {blockTypeLabel(block.type)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={() => onConfirm(Array.from(selectedIds))}
            disabled={selectedIds.size !== limit}
            className="w-full py-3.5 rounded-2xl font-[900] text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedIds.size === limit ? accentColor : "rgba(255,255,255,0.05)",
              color: selectedIds.size === limit ? "black" : "rgba(255,255,255,0.3)",
            }}
          >
            {t("trialExpired.confirmSelection")}
          </button>
          <button
            onClick={onUpgrade}
            className="w-full py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 font-bold text-sm flex items-center justify-center gap-2 hover:border-white/20 hover:bg-white/[0.06] transition-all"
          >
            <Crown size={16} className="text-amber-400" />
            {t("trialExpired.keepAllWithPro")}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
