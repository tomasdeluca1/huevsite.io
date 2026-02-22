"use client";

import { motion } from "framer-motion";
import { Check, Pipette } from "lucide-react";

const COLORS = [
  "#C8FF00", // Acid Green
  "#4D9FFF", // Electric Blue
  "#A855F7", // Crypto Purple
  "#FF7A00", // Productividad Orange
  "#FF3B3B", // Crimson
  "#00FF88", // Matrix Green
  "#FFD600", // Gold
  "#FFFFFF", // Clean White
];

interface Props {
  value: string;
  onChange: (color: string) => void;
}

export function ColorSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="section-label !text-[9px] px-1">// vibra del perfil</div>
      <div className="grid grid-cols-5 gap-2">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className="group relative aspect-square rounded-xl border border-white/5 transition-all hover:scale-105 active:scale-95 shadow-lg overflow-hidden"
            style={{ backgroundColor: color }}
          >
            {value.toLowerCase() === color.toLowerCase() && (
              <motion.div 
                layoutId="color-check"
                className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
              >
                <Check size={16} className={color === "#FFFFFF" ? "text-black" : "text-white"} strokeWidth={3} />
              </motion.div>
            )}
          </button>
        ))}
        
        <div className="relative aspect-square rounded-xl border border-[var(--border-bright)] bg-[var(--surface2)] flex items-center justify-center overflow-hidden hover:bg-[var(--surface)] transition-colors group">
          <Pipette size={14} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
          <input 
            type="color" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
