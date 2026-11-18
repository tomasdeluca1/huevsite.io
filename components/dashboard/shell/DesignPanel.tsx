"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { PRESET_BORDER_RADIUS, getContrastColor, type ProfileData } from "@/lib/profile-types";
import type { LinkBoxStyle, ProfileLayoutMode } from "@/lib/profile-layout";
import { ColorPicker } from "@/components/dashboard/ColorPicker";
import { BoxStylePicker } from "@/components/dashboard/BoxStylePicker";

interface Props {
  profile: ProfileData;
  isPro: boolean;
  onColor: (color: string, confirmed: boolean) => void;
  onRadius: (value: string) => void;
  onLayout: (layout: ProfileLayoutMode) => void;
  onGlobalBox: (style: LinkBoxStyle) => void;
  onEcosystem: (value: boolean) => void;
  onUpgrade: () => void;
}

function Section({ label, pro, onUpgrade, children }: { label: string; pro?: boolean; onUpgrade?: () => void; children: ReactNode }) {
  const t = useTranslations("dashboard.shell");
  return (
    <section className="flex flex-col gap-2.5 border-t border-white/[0.06] pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/40">{label}</h3>
        {pro && (
          <button type="button" onClick={onUpgrade} className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-amber-400">
            <Lock size={9} /> {t("proTag")}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

// Todo lo que cambia cómo se ve el perfil, en un solo lugar. En escritorio
// grande queda fijo al costado de la grilla; más chico se abre como cajón.
export function DesignPanel({ profile, isPro, onColor, onRadius, onLayout, onGlobalBox, onEcosystem, onUpgrade }: Props) {
  const t = useTranslations("dashboard.shell");
  const layout = profile.profileLayout === "links" ? "links" : "portfolio";
  const ink = getContrastColor(profile.accentColor);
  const radius = profile.borderRadius || "1.5rem";

  return (
    <div className="flex flex-col gap-4">
      {/* El formato Links se sacó: solo lo ve quien ya lo tenía puesto, para poder volver a Portfolio. */}
      {layout === "links" && (
      <Section label={t("designFormat")}>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {(["portfolio", "links"] as const).map((mode) => {
            const active = layout === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => onLayout(mode)}
                className={`min-h-9 rounded-lg text-[12.5px] font-bold transition-colors ${active ? "" : "text-white/55 hover:text-white"}`}
                style={active ? { background: profile.accentColor, color: ink } : undefined}
              >
                {mode === "portfolio" ? "Portfolio" : "Links"}
              </button>
            );
          })}
        </div>
        <p className="text-[12px] leading-relaxed text-white/40">{t("designFormatHint")}</p>
      </Section>
      )}

      <Section label={t("designColor")}>
        <ColorPicker value={profile.accentColor} onChange={onColor} subscriptionTier={isPro ? "pro" : profile.subscriptionTier} />
      </Section>

      <Section label={t("designRadius")} pro={!isPro} onUpgrade={onUpgrade}>
        <div className={`flex gap-1.5 ${isPro ? "" : "pointer-events-none opacity-40"}`}>
          {PRESET_BORDER_RADIUS.map(({ label, value }) => {
            const active = radius === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onRadius(value)}
                title={label}
                aria-label={label}
                aria-pressed={active}
                className={`h-9 flex-1 border transition-colors ${active ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}
                style={{ borderRadius: value }}
              />
            );
          })}
        </div>
      </Section>

      {layout === "links" && (
        <Section label={t("designLinkStyle")}>
          <BoxStylePicker value={profile.linkBoxStyle || "pill"} onChange={(value) => value && onGlobalBox(value)} />
        </Section>
      )}

      {profile.publicEcosystemEligible === true && profile.subSites.length > 0 && (
        <Section label={t("settingsSubsites")}>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-white/75">{t("designEcosystem")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={profile.showEcosystem !== false}
              onClick={() => onEcosystem(profile.showEcosystem === false)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${profile.showEcosystem !== false ? "bg-[var(--accent)]" : "bg-white/10"}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${profile.showEcosystem !== false ? "left-6" : "left-1"}`} />
            </button>
          </label>
        </Section>
      )}
    </div>
  );
}
