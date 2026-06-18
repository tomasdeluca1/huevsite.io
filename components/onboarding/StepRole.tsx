"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { type Role, type OnboardingState } from "@/lib/onboarding-types";

interface StepRoleProps {
  state: OnboardingState;
  onChange: (roles: Role[]) => void;
  onNext: () => void;
}

export function StepRole({ state, onChange, onNext }: StepRoleProps) {
  const t = useTranslations("onboarding");

  const ROLES: {
    id: Role;
    emoji: string;
    label: string;
    desc: string;
  }[] = [
    {
      id: "developer",
      emoji: "⌨️",
      label: t("roleDeveloperLabel"),
      desc: t("roleDeveloperDesc"),
    },
    {
      id: "designer",
      emoji: "🎨",
      label: t("roleDesignerLabel"),
      desc: t("roleDesignerDesc"),
    },
    {
      id: "founder",
      emoji: "🚀",
      label: t("roleFounderLabel"),
      desc: t("roleFounderDesc"),
    },
    {
      id: "indie_hacker",
      emoji: "🛠",
      label: t("roleIndieHackerLabel"),
      desc: t("roleIndieHackerDesc"),
    },
  ];

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
        <div className="section-label mb-2">{t("step1Label")}</div>
        <h1 className="ou-q !text-4xl">{t("step1Title")}</h1>
        <p className="ou-sub !text-base">{t("step1Subtitle")}</p>
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
          ? t("step1Continue", {
              role:
                state.roles.length > 1
                  ? t("roleBuilder")
                  : ROLES.find((r) => r.id === state.roles[0])?.label ?? "",
            })
          : t("step1ChooseAtLeastOne")}
      </button>
    </div>
  );
}
