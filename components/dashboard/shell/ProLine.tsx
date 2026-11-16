"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, X } from "lucide-react";
import type { ProfileData } from "@/lib/profile-types";

interface Props {
  profile: ProfileData;
  isPro: boolean;
  claiming: boolean;
  onClaim: () => void;
  onUpgrade: () => void;
  onOpenStats: () => void;
}

// Reemplaza a los tres banners grandes de la prueba Pro: una línea fina que
// solo aparece si hay algo que decir (prueba disponible, activa o vencida con
// una última vista de estadísticas). Las dos últimas se pueden cerrar.
export function ProLine({ profile, isPro, claiming, onClaim, onUpgrade, onOpenStats }: Props) {
  const t = useTranslations("dashboard.shell");
  const [dismissed, setDismissed] = useState(false);
  const trial = profile.freeTrial;
  if (!trial || dismissed) return null;

  let text: string | null = null;
  let cta: { label: string; onClick: () => void; disabled?: boolean } | null = null;
  let dismissable = true;

  if (!isPro && trial.eligible) {
    text = t("proEligible");
    cta = { label: t("proEligibleCta"), onClick: onClaim, disabled: claiming };
    dismissable = false;
  } else if (trial.active && profile.subscriptionTier !== "pro") {
    text = t("proActive", { days: trial.daysRemaining ?? 0 });
    cta = { label: t("proActiveCta"), onClick: onUpgrade };
  } else if (!isPro && trial.canUseLastInsightsView && !trial.active) {
    text = t("proLastView");
    cta = { label: t("proLastViewCta"), onClick: onOpenStats };
  }
  if (!text || !cta) return null;

  return (
    <div className="border-b border-[var(--accent)]/20 bg-[var(--accent)]/[0.06]">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2 md:px-8 lg:px-10">
        <Sparkles size={14} className="shrink-0 text-[var(--accent)]" />
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-white/75">{text}</p>
        <button
          type="button"
          onClick={cta.onClick}
          disabled={cta.disabled}
          className="shrink-0 text-[13px] font-extrabold text-white underline-offset-4 hover:underline disabled:opacity-50"
        >
          {cta.label} →
        </button>
        {dismissable && (
          <button type="button" onClick={() => setDismissed(true)} aria-label={t("dismiss")} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/35 hover:bg-white/5 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
