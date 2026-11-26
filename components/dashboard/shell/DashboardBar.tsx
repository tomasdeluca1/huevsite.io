"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { BarChart3, ExternalLink, LayoutGrid, Lock, Settings2, Share2 } from "lucide-react";
import { getContrastColor } from "@/lib/profile-types";

export type DashboardTab = "profile" | "stats" | "settings";
export type SaveState = "idle" | "saving" | "saved" | "error";

const TABS: Array<{ id: DashboardTab; key: "tabProfile" | "tabStats" | "tabSettings"; Icon: typeof LayoutGrid }> = [
  { id: "profile", key: "tabProfile", Icon: LayoutGrid },
  { id: "stats", key: "tabStats", Icon: BarChart3 },
  { id: "settings", key: "tabSettings", Icon: Settings2 },
];

function SaveStatus({ state }: { state: SaveState }) {
  const t = useTranslations("dashboard.shell");
  if (state === "idle") return null;
  const color = state === "error" ? "bg-red-400" : state === "saving" ? "bg-white/40 animate-pulse" : "bg-[#00FF88]";
  const label = state === "error" ? t("saveError") : state === "saving" ? t("saving") : t("saved");
  return (
    <span role="status" className={`flex items-center gap-2 font-mono text-[11px] ${state === "error" ? "text-red-300" : "text-white/45"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

interface BarProps {
  tab: DashboardTab;
  onTab: (tab: DashboardTab) => void;
  statsLocked: boolean;
  saveState: SaveState;
  profilePath: string;
  accentColor: string;
  shareButtonRef: RefObject<HTMLButtonElement>;
  onShare: (opener: HTMLButtonElement) => void;
}

// La barra fija del dashboard: las tres pestañas a la izquierda (en el celular
// pasan a la barra de abajo) y a la derecha lo que se usa desde cualquier
// pestaña: si se guardó, tu URL y Compartir.
export function DashboardBar({ tab, onTab, statsLocked, saveState, profilePath, accentColor, shareButtonRef, onShare }: BarProps) {
  const t = useTranslations("dashboard.shell");
  return (
    <div className="sticky top-0 z-[150] border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 md:h-16 md:px-8 lg:px-10">
        <div role="navigation" aria-label={t("tabsLabel")} className="hidden items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-1 md:flex">
          {TABS.map(({ id, key, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTab(id)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-bold transition-colors ${active ? "" : "text-white/50 hover:text-white"}`}
                style={active ? { background: accentColor, color: getContrastColor(accentColor) } : undefined}
              >
                <Icon size={15} strokeWidth={2.2} />
                {t(key)}
                {id === "stats" && statsLocked && <Lock size={11} className="opacity-60" />}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />
        <SaveStatus state={saveState} />

        <a
          href={profilePath}
          target="_blank"
          rel="noopener noreferrer"
          title={t("openProfile")}
          className="hidden min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 font-mono text-[12px] text-white/70 transition-colors hover:border-white/20 hover:text-white sm:flex"
        >
          <span className="truncate">huevsite.io{profilePath}</span>
          <ExternalLink size={12} className="shrink-0 opacity-50" />
        </a>

        <button
          type="button"
          ref={shareButtonRef}
          onClick={(event) => onShare(event.currentTarget)}
          className="flex min-h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-extrabold"
          style={{ background: accentColor, color: getContrastColor(accentColor) }}
        >
          <Share2 size={15} strokeWidth={2.4} />
          {t("share")}
        </button>
      </div>
    </div>
  );
}

// En el celular las pestañas van abajo, al alcance del pulgar.
export function MobileTabBar({ tab, onTab, statsLocked, accentColor }: Pick<BarProps, "tab" | "onTab" | "statsLocked" | "accentColor">) {
  const t = useTranslations("dashboard.shell");
  return (
    <div
      role="navigation"
      aria-label={t("tabsLabel")}
      className="fixed inset-x-0 bottom-0 z-[150] border-t border-white/[0.08] bg-[#050505]/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-3">
        {TABS.map(({ id, key, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              aria-current={active ? "page" : undefined}
              className="flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-bold"
              style={{ color: active ? accentColor : "rgba(255,255,255,0.45)" }}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                {id === "stats" && statsLocked && <Lock size={9} className="absolute -right-2.5 -top-1 opacity-70" />}
              </span>
              {t(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
