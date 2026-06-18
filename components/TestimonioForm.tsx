"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { OwnTestimonial } from "@/lib/testimonial-service";

const MAX = 280;

const STATUS_CLS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function TestimonioForm({ initial }: { initial: OwnTestimonial }) {
  const t = useTranslations("testimonio");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(initial?.status ?? null);
  const [featured, setFeatured] = useState<boolean>(initial?.featured ?? false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const dirty = quote.trim() !== (initial?.quote ?? "").trim();
  const tooLong = quote.length > MAX;
  const canSubmit = quote.trim().length > 0 && !tooLong && !saving && dirty;

  const submit = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus("pending");
        setFeatured(false);
        setMsg({ type: "ok", text: t("form.successMsg") });
      } else {
        setMsg({ type: "err", text: json.error || t("form.saveError") });
      }
    } catch {
      setMsg({ type: "err", text: t("form.connectionError") });
    } finally {
      setSaving(false);
    }
  };

  const badgeCls = status ? STATUS_CLS[status] : null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      {badgeCls && (
        <div
          className={`inline-flex items-center text-[11px] font-mono px-3 py-1 rounded-full border mb-4 ${badgeCls}`}
        >
          {featured ? t("form.statusFeatured") : t(`form.status.${status}`)}
        </div>
      )}

      <textarea
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        rows={5}
        maxLength={MAX + 40}
        placeholder={t("form.placeholder")}
        className="w-full p-4 bg-black/30 border border-white/10 rounded-xl text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
      />
      <div className="flex items-center justify-between mt-2">
        <span className={`text-[11px] font-mono ${tooLong ? "text-red-400" : "text-[var(--text-muted)]"}`}>
          {quote.length}/{MAX}
        </span>
        {initial && !dirty && (
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {t("form.editToResend")}
          </span>
        )}
      </div>

      {msg && (
        <div
          className={`mt-4 text-sm rounded-xl px-4 py-3 border ${
            msg.type === "ok"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {msg.text}
        </div>
      )}

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="btn btn-accent w-full !py-3 mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? t("form.saving") : initial ? t("form.update") : t("form.submit")}
      </button>

      <p className="mt-3 text-[11px] text-[var(--text-muted)] text-center">
        {t("form.reviewNote")}
      </p>
    </div>
  );
}
