"use client";

import { motion } from "framer-motion";
import { type OnboardingState, type AccentColor } from "@/lib/onboarding-types";

const COLORS: { value: AccentColor; name: string; vibe: string }[] = [
  { value: "#C8FF00", name: "Acid Green", vibe: "El clásico huevsite" },
  { value: "#4D9FFF", name: "Electric Blue", vibe: "Para los devs cripto" },
  { value: "#A855F7", name: "Crypto Purple", vibe: "web3 vibes" },
  { value: "#FF7A00", name: "Startup Orange", vibe: "Y Combinator wannabe" },
  { value: "#FF3B3B", name: "Debug Red", vibe: "Producción cayó" },
  { value: "#00C853", name: "Matrix Green", vibe: "Soy el que faja código" },
];

interface StepAccentProps {
  state: OnboardingState;
  onChange: (color: AccentColor) => void;
  onNext: () => void;
}

export function StepAccent({ state, onChange, onNext }: StepAccentProps) {
  const accent = state.accentColor;

  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2" style={{ color: accent }}>// paso 04</div>
        <h1 className="ou-q !text-4xl">
          Elegí tu <span style={{ color: accent }}>color de guerra</span>
        </h1>
        <p className="ou-sub !text-base">Define la identidad visual de tu bento. Podés cambiarlo mil veces después.</p>
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
            {state.githubData?.name?.[0] ?? "U"}
          </div>
          <div>
            <div className="text-xl font-bold">{state.githubData?.name ?? "Tu Nombre"}</div>
            <div className="font-mono text-sm tracking-tight" style={{ color: accent }}>
              // vibe: {COLORS.find((c) => c.value === accent)?.name}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mt-8">
          {["Currently building", "GitHub activity", "Stacked"].map((label) => (
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
        Con este color, seguimos →
      </button>
    </div>
  );
}
