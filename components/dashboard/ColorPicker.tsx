"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Pipette, Clock } from "lucide-react";
import { PRESET_COLORS, getContrastColor } from "@/lib/profile-types";

interface Props {
  value: string;
  onChange: (color: string, confirmed: boolean) => void;
}

export function ColorPicker({ value, onChange }: Props) {
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const displayed = previewColor ?? value;
  const isPreviewing = previewColor !== null && previewColor !== value;

  const handlePreset = (color: string) => {
    // Click en preset: confirmar directamente
    setPreviewColor(null);
    onChange(color, true);
  };


  const handleCustomMove = (color: string) => {
    // Mover el picker nativo: solo preview, no persiste
    setPreviewColor(color);
    onChange(color, false);
  };

  const handleApply = () => {
    if (previewColor) {
      onChange(previewColor, true);
      setPreviewColor(null);
    }
  };

  const handleCancel = () => {
    if (previewColor) {
      onChange(value, false);
      setPreviewColor(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="section-label !text-[9px] px-1">// vibra del perfil</div>

      {/* Preset colors */}
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

        {/* Custom color picker */}
        <div className="relative aspect-square rounded-xl border border-[var(--border-bright)] bg-[var(--surface2)] flex items-center justify-center overflow-hidden hover:bg-[var(--surface)] transition-colors group">
          <Pipette size={14} className="text-[var(--text-muted)] group-hover:text-white transition-colors pointer-events-none" />
          <input
            ref={colorInputRef}
            type="color"
            value={previewColor ?? value}
            onChange={(e) => handleCustomMove(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>

      {/* Preview bar + confirm */}
      {isPreviewing && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border-bright)]">
            <div
              className="w-5 h-5 rounded-md shrink-0 border border-white/10"
              style={{ backgroundColor: previewColor }}
            />
            <span className="font-mono text-xs text-[var(--text-dim)] flex-1">{previewColor}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCancel}
              className="text-xs font-medium py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--border-bright)] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="text-xs font-bold py-2 rounded-xl transition-all"
              style={{ backgroundColor: previewColor ?? "#C8FF00", color: getContrastColor(previewColor ?? "#C8FF00") }}
            >
              Aplicar este color
            </button>
          </div>
        </motion.div>
      )}

      <p className="text-[9px] text-[var(--text-muted)] font-mono px-1">
        Los cambios se aplican al confirmar.
      </p>
    </div>
  );
}
