"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRESET_COLORS, getContrastColor } from "@/lib/profile-types";
import { Pipette, Sparkles } from "lucide-react";

interface Props {
  value: string;
  onChange: (color: string, confirmed: boolean) => void;
  subscriptionTier?: "free" | "pro";
}

export function ColorPicker({ value, onChange, subscriptionTier = "free" }: Props) {
  const t = useTranslations("dashboard");
  const displayed = value;

  const handlePreset = (color: string) => {
    // Click en preset: confirmar directamente
    onChange(color, true);
  };

  return (
    <div className="space-y-4">
      <div className="section-label !text-[9px] px-1">// {t("colorPicker.label")}</div>

      {/* Horizontal Scrollable Presets */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1 snap-x">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handlePreset(color)}
            title={color}
            className="group relative w-8 h-8 shrink-0 rounded-lg border border-white/5 transition-all hover:scale-110 active:scale-95 shadow-lg overflow-hidden snap-center"
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

        {/* Custom Color Selector (PRO ONLY) */}
        <div className="relative w-8 h-8 shrink-0 snap-center">
          <div
            className={`w-full h-full rounded-lg border border-white/5 flex items-center justify-center transition-all bg-[var(--surface2)] group/picker active:scale-95 ${subscriptionTier === 'pro' ? 'cursor-pointer hover:bg-[var(--surface)] hover:border-[var(--border-bright)]' : 'cursor-help opacity-60'
              }`}
            title={subscriptionTier === 'pro' ? t("colorPicker.customColor") : t("colorPicker.customColorPro")}
          >
            {subscriptionTier === 'pro' ? (
              <Pipette size={14} className="text-[var(--text-muted)] group-hover/picker:text-white transition-colors" />
            ) : (
              <Sparkles size={12} className="text-yellow-400" />
            )}
            {subscriptionTier === 'pro' && (
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value, true)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            )}
            {subscriptionTier !== 'pro' && (
              <div
                className="absolute inset-0"
                onClick={() => alert(t("colorPicker.upgradeAlert"))}
              />
            )}
          </div>
        </div>
      </div>

      <p className="text-[9px] text-[var(--text-muted)] font-mono px-1 opacity-60">
        {t("colorPicker.hint")}
      </p>
    </div>
  );
}
