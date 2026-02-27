"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PRESET_COLORS, getContrastColor } from "@/lib/profile-types";

interface Props {
  value: string;
  onChange: (color: string, confirmed: boolean) => void;
}

export function ColorPicker({ value, onChange }: Props) {
  const displayed = value;

  const handlePreset = (color: string) => {
    // Click en preset: confirmar directamente
    onChange(color, true);
  };

  return (
    <div className="space-y-4">
      <div className="section-label !text-[9px] px-1">// vibras de perfil</div>

      {/* Preset colors only */}
      <div className="grid grid-cols-5 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handlePreset(color)}
            title={color}
            className="group relative aspect-square rounded-xl border border-white/5 transition-all hover:scale-105 active:scale-95 shadow-lg overflow-hidden"
            style={{ backgroundColor: color }}
          >
            {displayed.toLowerCase() === color.toLowerCase() && (
                <motion.div
                  layoutId="color-check"
                  className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
                >
                  <Check
                    size={16}
                    style={{ color: getContrastColor(color) }}
                    strokeWidth={3}
                  />
                </motion.div>
            )}
          </button>
        ))}
      </div>

      <p className="text-[9px] text-[var(--text-muted)] font-mono px-1 opacity-60">
        Elegí una vibra para tu perfil.
      </p>
    </div>
  );
}
