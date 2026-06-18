"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { type OnboardingState, type AccentColor } from "@/lib/onboarding-types";

interface StepAccentProps {
  state: OnboardingState;
  onChange: (color: AccentColor) => void;
  onNext: () => void;
}

export function StepAccent({ state, onChange, onNext }: StepAccentProps) {
  const t = useTranslations("onboarding");
  const accent = state.accentColor;
  const previewName = state.linktreeData?.displayName || state.githubData?.name || t("accentPreviewName");

  const COLORS: { value: AccentColor; name: string; vibe: string }[] = [
    { value: "#C8FF00", name: t("accentColor1Name"), vibe: t("accentColor1Vibe") },
    { value: "#4D9FFF", name: t("accentColor2Name"), vibe: t("accentColor2Vibe") },
    { value: "#A855F7", name: t("accentColor3Name"), vibe: t("accentColor3Vibe") },
    { value: "#FF7A00", name: t("accentColor4Name"), vibe: t("accentColor4Vibe") },
    { value: "#FF3B3B", name: t("accentColor5Name"), vibe: t("accentColor5Vibe") },
    { value: "#00C853", name: t("accentColor6Name"), vibe: t("accentColor6Vibe") },
  ];

  const previewTags = [t("accentTag1"), t("accentTag2"), t("accentTag3")];

  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2" style={{ color: accent }}>{t("step3Label")}</div>
        <h1 className="ou-q !text-4xl">
          {t("accentTitlePrefix")} <span style={{ color: accent }}>{t("accentTitleHighlight")}</span>
        </h1>
        <p className="ou-sub !text-base">{t("accentSubtitle")}</p>
      </div>

      {/* Live preview card */}
      <div
        className="bg-[rgba(255,255,255,0.02)] border rounded-3xl p-8 mb-10 transition-all duration-500"
        style={{ borderColor: `${accent}40` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-black font-black text-2xl shadow-lg transition-all duration-500"
            style={{ background: accent }}
          >
            {previewName[0] ?? "U"}
          </div>
          <div>
            <div className="text-xl font-bold">{previewName}</div>
            <div className="font-mono text-sm tracking-tight" style={{ color: accent }}>
              {t("accentVibePrefix", { name: COLORS.find((c) => c.value === accent)?.name ?? "" })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mt-8">
          {previewTags.map((label) => (
            <span
              key={label}
              className="text-[10px] font-mono px-3 py-1.5 rounded-full border transition-all duration-500"
              style={{ color: accent, borderColor: `${accent}30`, background: `${accent}10` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        {COLORS.map((color, i) => {
          const selected = state.accentColor === color.value;
          return (
            <button
              key={color.value}
              onClick={() => onChange(color.value)}
              className={`ou-option !p-4 !text-left !gap-1 ${selected ? 'selected' : ''}`}
              style={{ '--accent': color.value } as any}
            >
              <div className="w-full h-8 rounded-lg mb-2 shadow-inner" style={{ background: color.value }} />
              <div className="nm !text-[11px]">{color.name}</div>
              <div className="dc !text-[9px] !leading-tight">{color.vibe}</div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="ou-next !py-5 !text-lg !text-black"
        style={{ background: accent, boxShadow: `0 0 40px ${accent}20` }}
      >
        {t("accentContinue")}
      </button>
    </div>
  );
}
