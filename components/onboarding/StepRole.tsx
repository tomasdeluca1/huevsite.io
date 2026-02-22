"use client";

import { motion } from "framer-motion";
import { type Role, type OnboardingState } from "@/lib/onboarding-types";

const ROLES: {
  id: Role;
  emoji: string;
  label: string;
  desc: string;
}[] = [
  {
    id: "developer",
    emoji: "⌨️",
    label: "Developer",
    desc: "Código, repos, commits",
  },
  {
    id: "designer",
    emoji: "🎨",
    label: "Designer",
    desc: "Figma, UI, sistemas",
  },
  {
    id: "founder",
    emoji: "🚀",
    label: "Founder",
    desc: "Startups, MRR, tracción",
  },
  {
    id: "indie_hacker",
    emoji: "🛠",
    label: "Indie Hacker",
    desc: "Side projects, solodev",
  },
];

interface StepRoleProps {
  state: OnboardingState;
  onChange: (roles: Role[]) => void;
  onNext: () => void;
}

export function StepRole({ state, onChange, onNext }: StepRoleProps) {
  const toggle = (role: Role) => {
    if (state.roles.includes(role)) {
      onChange(state.roles.filter((r) => r !== role));
    } else {
      onChange([...state.roles, role]);
    }
  };

  const canContinue = state.roles.length > 0;

  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2">// paso 01</div>
        <h1 className="ou-q !text-4xl">¿Qué sos, básicamente?</h1>
        <p className="ou-sub !text-base">Podés elegir más de uno, che. Sin drama.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        {ROLES.map((role, i) => {
          const selected = state.roles.includes(role.id);
          return (
            <button
              key={role.id}
              onClick={() => toggle(role.id)}
              className={`ou-option !flex !flex-col !items-center !justify-center !p-8 !gap-2 ${selected ? 'selected' : ''}`}
            >
              <div className="text-4xl mb-2">{role.emoji}</div>
              <div className="nm !text-lg">{role.label}</div>
              <div className="dc !text-xs">{role.desc}</div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="ou-next !py-5 !text-lg"
      >
        {canContinue
          ? `Continuar como ${state.roles.length > 1 ? "builder" : ROLES.find(r => r.id === state.roles[0])?.label} →`
          : "Elegí al menos uno"}
      </button>
    </div>
  );
}
