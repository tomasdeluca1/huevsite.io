"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Globe, Loader2, ArrowRight, Plus } from "lucide-react";
import type { ProjectBlockData } from "@/lib/profile-types";

type Prefill = Partial<ProjectBlockData>;

export function AddProjectModal({
  open,
  onClose,
  onCreate,
  accentColor = "#C8FF00",
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (prefill?: Prefill) => void;
  accentColor?: string;
}) {
  const t = useTranslations("dashboard.projects");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const close = () => {
    if (loading) return;
    setUrl("");
    setError(null);
    onClose();
  };

  const analyze = async () => {
    const value = url.trim();
    if (!value || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(t("addError"));
        setLoading(false);
        return;
      }
      // Even if scraping found nothing, create the project with the link set.
      onCreate({
        title: data.title || "",
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        faviconUrl: data.faviconUrl || "",
        imageMode: data.imageUrl ? "og" : data.faviconUrl ? "favicon" : "og",
        link: data.url || value,
      });
      setUrl("");
      setError(null);
      setLoading(false);
    } catch {
      setError(t("addError"));
      setLoading(false);
    }
  };

  const manual = () => {
    if (loading) return;
    onCreate();
    setUrl("");
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-black text-white">{t("addTitle")}</h2>
          <button onClick={close} className="text-white/40 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-white/40 mb-5">{t("addHint")}</p>

        <div className="space-y-3">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") analyze();
              }}
              placeholder={t("addUrlPlaceholder")}
              autoFocus
              disabled={loading}
              className="w-full rounded-xl bg-[var(--surface2)] border border-[var(--border)] pl-9 pr-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-all disabled:opacity-60"
            />
          </div>

          <button
            onClick={analyze}
            disabled={loading || !url.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-black disabled:opacity-50 transition-all"
            style={{ backgroundColor: accentColor }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t("addAnalyzing")}
              </>
            ) : (
              <>
                {t("addAnalyze")} <ArrowRight size={16} />
              </>
            )}
          </button>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={manual}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-bold uppercase tracking-wide text-white/60 hover:text-white disabled:opacity-50 transition-all"
          >
            <Plus size={14} /> {t("addManual")}
          </button>
        </div>
      </div>
    </div>
  );
}
