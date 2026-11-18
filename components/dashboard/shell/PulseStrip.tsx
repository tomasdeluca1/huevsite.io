"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, Sparkles } from "lucide-react";
import type { ProfilePulse } from "@/app/api/profile/pulse/route";
import { CountUp } from "./CountUp";

export function useProfilePulse(enabled = true) {
  const [pulse, setPulse] = useState<ProfilePulse | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch("/api/profile/pulse", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setPulse(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enabled]);
  return pulse;
}

interface Props {
  pulse: ProfilePulse | null;
  onOpenStats: () => void;
}

// Arriba del editor: qué está pasando con tu perfil. Visitas reales (el
// detalle de quién y de dónde vive en Estadísticas) y tu lugar en el muro de
// la home, que se gana editando.
export function PulseStrip({ pulse, onOpenStats }: Props) {
  const t = useTranslations("dashboard.shell");
  if (!pulse) return <div className="h-11" aria-hidden />;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onOpenStats}
        className="group flex min-h-11 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 text-left transition-colors hover:border-white/20"
      >
        <span className="relative grid h-6 w-6 place-items-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
          <Eye size={13} />
          {pulse.viewsToday > 0 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-[#00FF88]" />}
        </span>
        <span className="text-[13px] text-white/60">
          {pulse.viewsWeek > 0 ? (
            t.rich("pulseViews", {
              n: pulse.viewsWeek,
              today: pulse.viewsToday,
              strong: () => <CountUp value={pulse.viewsWeek} className="font-extrabold tabular-nums text-white" />,
            })
          ) : (
            t("pulseNoViews")
          )}
        </span>
        <span className="text-[13px] font-bold text-white/35 transition-colors group-hover:text-white">→</span>
      </button>

      {pulse.wall ? (
        <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><Sparkles size={13} /></span>
          <span className="text-[13px] text-white/60">
            {t.rich("pulseWall", {
              rank: pulse.wall.rank,
              total: pulse.wall.total,
              strong: () => <span className="font-extrabold tabular-nums text-white">#{pulse.wall!.rank}</span>,
            })}
          </span>
          <span className="hidden text-[12px] text-white/35 lg:inline">{t("pulseWallHint")}</span>
        </div>
      ) : (
        <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-dashed border-white/[0.12] px-3.5 text-[13px] text-white/50">
          <Sparkles size={13} className="text-white/40" /> {t("pulseNoWall")}
        </div>
      )}
    </div>
  );
}
