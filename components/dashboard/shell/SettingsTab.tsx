"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Copy, Globe2, LayoutGrid, Lock, Trash2 } from "lucide-react";
import { getContrastColor, MAX_FREE_BLOCKS, type ProfileData } from "@/lib/profile-types";
import LocaleToggle from "@/components/LocaleToggle";

export type SettingsSection = "account" | "domain" | "subsites" | "agents" | "referrals" | "newsletter" | "help" | "danger";

const SECTIONS: Array<{ id: SettingsSection; key: string }> = [
  { id: "account", key: "settingsAccount" },
  { id: "domain", key: "settingsDomain" },
  { id: "subsites", key: "settingsSubsites" },
  { id: "agents", key: "settingsAgents" },
  { id: "referrals", key: "settingsReferrals" },
  { id: "newsletter", key: "settingsNewsletter" },
  { id: "help", key: "settingsHelp" },
  { id: "danger", key: "settingsDanger" },
];

interface Props {
  profile: ProfileData;
  isPro: boolean;
  initialSection?: SettingsSection | null;
  domainCard: ReactNode;
  referrals: ReactNode;
  onUpgrade: () => void;
  onEditAccount: () => void;
  onLinktree: () => void;
  onLogout: () => void;
  onCreateSubsite: () => void;
  onOpenSubsite: (id: string) => void;
  onDeleteSubsite: (id: string) => void;
  onMcp: () => void;
  onNewsletter: () => void;
  onFeedback: () => void;
  onDeleteAccount: () => void;
}

// Una fila de ajuste. Sin título, la bajada pasa a ser el texto principal: así
// las tarjetas de una sola fila no repiten el nombre de la sección.
function Row({ title, hint, children, danger }: { title?: string; hint?: string; children?: ReactNode; danger?: boolean }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {title && <div className={`text-[14.5px] font-bold ${danger ? "text-red-300" : "text-white"}`}>{title}</div>}
        {hint && <p className={title ? "mt-0.5 text-[13px] leading-relaxed text-white/45" : "text-[14px] leading-relaxed text-white/70"}>{hint}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}

function Btn({ children, onClick, primary, danger, accent }: { children: ReactNode; onClick?: () => void; primary?: boolean; danger?: boolean; accent?: string }) {
  const style = primary && accent ? { background: accent, color: getContrastColor(accent) } : undefined;
  const cls = danger
    ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15"
    : primary
      ? "border-transparent"
      : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20 hover:text-white";
  return (
    <button type="button" onClick={onClick} className={`min-h-10 rounded-xl border px-4 text-[13px] font-bold transition-colors ${cls}`} style={style}>
      {children}
    </button>
  );
}

// Ajustes: todo lo que no cambia cómo se ve el perfil. Una sola página con
// secciones; en escritorio, un índice fijo a la izquierda que salta a cada una.
export function SettingsTab(props: Props) {
  const { profile, isPro, initialSection, domainCard, referrals, onUpgrade } = props;
  const t = useTranslations("dashboard.shell");
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState<SettingsSection>(initialSection || "account");
  const trial = profile.freeTrial;
  const onTrial = !isPro ? false : profile.subscriptionTier !== "pro" && trial?.active;

  useEffect(() => {
    if (!initialSection) return;
    const timer = window.setTimeout(() => document.getElementById(`ajustes-${initialSection}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    return () => window.clearTimeout(timer);
  }, [initialSection]);

  const go = (id: SettingsSection) => {
    setActive(id);
    document.getElementById(`ajustes-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const Card = ({ id, children }: { id: SettingsSection; children: ReactNode }) => (
    <section id={`ajustes-${id}`} className="scroll-mt-24">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">{t(SECTIONS.find((s) => s.id === id)!.key)}</h2>
      <div className="divide-y divide-white/[0.06] rounded-[24px] border border-white/[0.08] bg-white/[0.02] px-5 py-5 md:px-6">{children}</div>
    </section>
  );

  const ProGate = () => (
    <Row title={t("proLocked")}>
      <Btn primary accent={profile.accentColor} onClick={onUpgrade}><span className="flex items-center gap-1.5"><Lock size={12} />{t("proLockedCta")}</span></Btn>
    </Row>
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
      <div role="navigation" className="sticky top-24 hidden h-fit flex-col gap-0.5 lg:flex" aria-label={t("tabSettings")}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => go(s.id)}
            className={`rounded-xl px-3 py-2 text-left text-[13.5px] font-semibold transition-colors ${active === s.id ? "bg-white/[0.06] text-white" : "text-white/50 hover:text-white"} ${s.id === "danger" ? "mt-3" : ""}`}
          >
            {t(s.key)}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-col gap-8">
        <Card id="account">
          <Row
            title={isPro ? (onTrial ? t("planTrial") : t("planPro")) : t("planFree")}
            hint={onTrial ? t("planTrialLeft", { days: trial?.daysRemaining ?? 0 }) : !isPro ? t("planFreeHint", { n: MAX_FREE_BLOCKS }) : undefined}
          >
            {(!isPro || onTrial) && <Btn primary accent={profile.accentColor} onClick={onUpgrade}>{t("planUpgrade")}</Btn>}
          </Row>
          <Row title={t("aiCredits", { n: profile.aiCredits ?? 0 })} hint={t("aiCreditsHint")} />
          <Row title={t("accountData")} hint={t("accountDataHint")}>
            <Btn onClick={props.onEditAccount}>{t("accountDataCta")}</Btn>
          </Row>
          <Row title={t("linktreeTitle")} hint={t("linktreeHint")}>
            <Btn onClick={props.onLinktree}>{t("linktreeCta")}</Btn>
          </Row>
          <Row title={t("language")}>
            <LocaleToggle />
          </Row>
          <Row title={t("session")} hint={profile.email || `@${profile.username}`}>
            <Btn onClick={props.onLogout}>{t("logout")}</Btn>
          </Row>
        </Card>

        <Card id="domain">{isPro ? <div className="-mx-1">{domainCard}</div> : <ProGate />}</Card>

        <Card id="subsites">
          <Row hint={t("subsitesHint")}>
            <Btn primary={isPro} accent={profile.accentColor} onClick={isPro ? props.onCreateSubsite : onUpgrade}>
              <span className="flex items-center gap-1.5">{!isPro && <Lock size={12} />}{t("newSubsite")}</span>
            </Btn>
          </Row>
          {profile.subSites.length === 0 ? (
            <p className="py-4 text-[13px] text-white/40 last:pb-0">{t("subsitesEmpty")}</p>
          ) : (
            profile.subSites.map((site) => (
              <div key={site.id} className="flex items-center gap-3 py-3 last:pb-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  {site.avatarUrl ? <img src={site.avatarUrl} alt="" className="h-full w-full object-cover" /> : <Globe2 size={16} className="text-white/30" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-white">{site.title}</span>
                  <span className="block truncate font-mono text-[11px] text-white/35">/{profile.username}/{site.slug}</span>
                </span>
                <button type="button" onClick={() => props.onOpenSubsite(site.id)} aria-label={t("subsiteEdit")} title={t("subsiteEdit")} className="grid h-10 w-10 place-items-center rounded-xl text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white">
                  <LayoutGrid size={16} />
                </button>
                <button type="button" onClick={() => props.onDeleteSubsite(site.id)} aria-label={t("subsiteDelete")} title={t("subsiteDelete")} className="grid h-10 w-10 place-items-center rounded-xl text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-300">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </Card>

        <Card id="agents">
          <Row hint={t("agentsHint")}>
            <Link href="/mcp" className="px-2 text-[13px] font-bold text-white/55 underline-offset-4 hover:text-white hover:underline">{t("agentsDocs")}</Link>
            <Btn primary accent={profile.accentColor} onClick={props.onMcp}>{t("agentsCta")}</Btn>
          </Row>
        </Card>

        <Card id="referrals">
          {profile.referralCode && (
            <Row title={t("referralLink")} hint={`huevsite.io/login?ref=${profile.referralCode}`}>
              <Btn
                onClick={() => {
                  navigator.clipboard?.writeText(`https://huevsite.io/login?ref=${profile.referralCode}`).catch(() => {});
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
              >
                <span className="flex items-center gap-1.5">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? t("copied") : t("copy")}</span>
              </Btn>
            </Row>
          )}
          <div className="py-4 last:pb-0">{referrals}</div>
        </Card>

        <Card id="newsletter">
          <Row title={t("newsletterTitle")} hint={t("newsletterHint")}>
            <span className="text-[12px] font-semibold text-white/45">{profile.newsletterSubscribed ? t("newsletterOn") : t("newsletterOff")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={profile.newsletterSubscribed === true}
              aria-label={t("settingsNewsletter")}
              onClick={props.onNewsletter}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${profile.newsletterSubscribed ? "bg-[var(--accent)]" : "bg-white/10"}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${profile.newsletterSubscribed ? "left-6" : "left-1"}`} />
            </button>
          </Row>
        </Card>

        <Card id="help">
          <Row hint={t("helpHint")}>
            <Link href="/testimonio" className="px-2 text-[13px] font-bold text-white/55 underline-offset-4 hover:text-white hover:underline">{t("testimonialCta")}</Link>
            <Btn onClick={props.onFeedback}>{t("helpCta")}</Btn>
          </Row>
        </Card>

        <Card id="danger">
          <Row title={t("dangerCta")} hint={t("dangerHint")} danger>
            <Btn danger onClick={props.onDeleteAccount}>{t("dangerCta")}</Btn>
          </Row>
        </Card>
      </div>
    </div>
  );
}
