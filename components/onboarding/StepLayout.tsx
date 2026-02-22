"use client";

import { motion } from "framer-motion";
import { type OnboardingState, type LayoutOption } from "@/lib/onboarding-types";

const LAYOUTS: {
  id: LayoutOption;
  label: string;
  desc: string;
  blocks: { cols: number; rows: number; color: string }[];
  recommended?: boolean;
}[] = [
  {
    id: "dev_heavy",
    label: "Dev Focus",
    desc: "GitHub grande, métricas, proyectos. Para el que vive en el terminal.",
    recommended: true,
    blocks: [
      { cols: 2, rows: 2, color: "var(--accent)" },
      { cols: 2, rows: 1, color: "var(--surface2)" },
      { cols: 2, rows: 1, color: "var(--surface2)" },
      { cols: 1, rows: 1, color: "var(--surface2)" },
      { cols: 1, rows: 1, color: "var(--surface2)" },
    ],
  },
  {
    id: "founder_heavy",
    label: "Founder Mode",
    desc: "Métricas al frente. MRR, usuarios, tracción. Para el que habla de traction.",
    blocks: [
      { cols: 2, rows: 2, color: "#4D9FFF" },
      { cols: 1, rows: 1, color: "var(--surface2)" },
      { cols: 1, rows: 1, color: "var(--surface2)" },
      { cols: 1, rows: 1, color: "var(--surface2)" },
      { cols: 1, rows: 1, color: "var(--surface2)" },
    ],
  },
  {
    id: "minimal",
    label: "Minimalista",
    desc: "Bio, proyectos, links. Lo esencial. Si menos es más, esto es todo.",
    blocks: [
      { cols: 4, rows: 1, color: "#A855F7" },
      { cols: 2, rows: 2, color: "var(--surface2)" },
      { cols: 2, rows: 1, color: "var(--surface2)" },
    ],
  },
  {
    id: "creative",
    label: "Creativo",
    desc: "Bloques asimétricos, Writing destacado. Para el builder con opinión estética.",
    blocks: [
      { cols: 1, rows: 2, color: "#FF7A00" },
      { cols: 3, rows: 1, color: "var(--surface2)" },
      { cols: 2, rows: 1, color: "var(--surface2)" },
    ],
  },
];

interface StepLayoutProps {
  state: OnboardingState;
  onChange: (layout: LayoutOption) => void;
  onNext: () => void;
}

export function StepLayout({ state, onChange, onNext }: StepLayoutProps) {
  const recommended = state.roles.includes("developer")
    ? "dev_heavy"
    : state.roles.includes("founder")
    ? "founder_heavy"
    : state.roles.includes("designer")
    ? "creative"
    : "minimal";

  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2">// paso 03</div>
        <h1 className="ou-q !text-4xl">Elegí tu layout</h1>
        <p className="ou-sub !text-base">Podés reordenarlo después. Este es el punto de partida.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        {LAYOUTS.map((layout, i) => {
          const selected = state.layout === layout.id;
          const isRecommended = layout.id === recommended;

          return (
            <button
              key={layout.id}
              onClick={() => onChange(layout.id)}
              className={`ou-option !p-6 !text-left ${selected ? 'selected' : ''}`}
            >
              {isRecommended && !selected && (
                <span className="absolute -top-2 left-6 text-[8px] font-mono bg-[var(--accent)] text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  recomendado
                </span>
              )}
              
              <BentoPreview blocks={layout.blocks} selected={selected} />

              <div className="nm !text-sm mt-4">{layout.label}</div>
              <div className="dc !text-[11px] leading-snug mt-1">{layout.desc}</div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!state.layout}
        className="ou-next !py-5 !text-lg"
      >
        {state.layout ? "Este layout, dale →" : "Elegí uno"}
      </button>
    </div>
  );
}

function BentoPreview({
  blocks,
  selected,
}: {
  blocks: { cols: number; rows: number; color: string }[];
  selected: boolean;
}) {
  return (
    <div
      className="grid gap-[2px] w-full"
      style={{ gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "8px" }}
    >
      {blocks.map((block, i) => (
        <div
          key={i}
          className="rounded-[2px] border border-white/5"
          style={{
            gridColumn: `span ${block.cols}`,
            gridRow: `span ${block.rows}`,
            background: i === 0 ? (selected ? block.color : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.03)',
            opacity: i === 0 ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}
