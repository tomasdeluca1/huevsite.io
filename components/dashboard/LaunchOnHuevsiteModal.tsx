"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { X, Rocket, Loader2 } from "lucide-react";
import { currentLaunchWeek, addWeeks, weekLabel } from "@/lib/launch-week";

export function LaunchOnHuevsiteModal({
  open,
  onClose,
  blockId,
  title,
  isPro,
  accentColor = "#C8FF00",
  onLaunched,
}: {
  open: boolean;
  onClose: () => void;
  blockId: string | null;
  title: string;
  isPro: boolean;
  accentColor?: string;
  onLaunched?: (week: string) => void;
}) {
  const t = useTranslations("dashboard.projects");
  const cur = currentLaunchWeek();
  const [week, setWeek] = useState(cur);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"already" | "monthly" | "generic" | null>(null);

  if (!open || !blockId) return null;

  const weeks = isPro
    ? [cur, addWeeks(cur, 1), addWeeks(cur, 2), addWeeks(cur, 3), addWeeks(cur, 4)]
    : [cur];

  const reset = () => {
    setWeek(cur);
    setError(null);
    setLoading(false);
    onClose();
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/launches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, week }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setError("already");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error === "monthly_limit" ? "monthly" : "generic");
        setLoading(false);
        return;
      }
      onLaunched?.(data.week || week);
      reset();
    } catch {
      setError("generic");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={() => !loading && reset()}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Rocket size={18} style={{ color: accentColor }} /> {t("launchTitle")}
          </h2>
          <button onClick={reset} className="text-white/40 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-white/40 mb-5">{t("launchHint", { title })}</p>

        <div className="space-y-3">
          {isPro ? (
            <div className="space-y-1.5">
              <div className="section-label !text-[9px] px-1">{t("launchWeekLabel")}</div>
              <select
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-sm text-white"
              >
                {weeks.map((w, i) => (
                  <option key={w} value={w}>
                    {weekLabel(w)}
                    {i === 0 ? ` · ${t("launchThisWeek")}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white/70">
              {t("launchThisWeek")}: <span className="text-white font-semibold">{weekLabel(cur)}</span>
              <div className="text-[10px] text-white/30 mt-1">{t("launchFreeMonthlyNote")}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{t("launchProSchedule")}</div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-black disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t("launchSubmitting")}
              </>
            ) : (
              <>
                <Rocket size={16} /> {t("launchConfirm")}
              </>
            )}
          </button>
          {error === "monthly" ? (
            <div className="rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.06] px-3 py-2.5">
              <p className="text-xs text-white/80">{t("launchMonthlyLimit")}</p>
              <Link
                href="/precios"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-black"
                style={{ backgroundColor: accentColor }}
              >
                {t("launchMonthlyLimitCta")}
              </Link>
            </div>
          ) : error ? (
            <p className="text-xs text-red-400">
              {t(error === "already" ? "launchAlready" : "launchError")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
