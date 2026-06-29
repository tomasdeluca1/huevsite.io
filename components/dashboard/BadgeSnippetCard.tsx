"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const SITE = "https://huevsite.io";

/**
 * Dashboard card for Builder de la Semana winners: shows their embeddable laurel
 * badge + copy-paste HTML / Markdown snippets to drop on their own portfolio.
 * Self-gates — renders nothing for users who never won (checked via the badge
 * route's ?check=1 JSON probe), so it can be mounted unconditionally.
 */
export function BadgeSnippetCard({ username }: { username: string }) {
  const t = useTranslations("dashboard.badgeShare");
  const [winner, setWinner] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<"html" | "md" | null>(null);

  useEffect(() => {
    if (!username) return;
    let alive = true;
    fetch(`/api/badge/bdls/${username}?check=1`)
      .then((r) => r.json())
      .then((d) => alive && setWinner(!!d?.winner))
      .catch(() => alive && setWinner(false));
    return () => {
      alive = false;
    };
  }, [username]);

  if (!winner) return null;

  const badgeUrl = `${SITE}/api/badge/bdls/${username}?v=3`;
  const profileUrl = `${SITE}/${username}`;
  const html = `<a href="${profileUrl}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="Builder de la Semana en huevsite.io" width="240" /></a>`;
  const md = `[![Builder de la Semana en huevsite.io](${badgeUrl})](${profileUrl})`;

  const copy = (which: "html" | "md", text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const snippet =
    "block w-full rounded-lg bg-black/40 border border-white/10 p-2.5 text-[10px] font-mono text-white/60 break-all leading-relaxed";
  const btn =
    "shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors";

  return (
    <div className="rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.04] p-4">
      <div className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
        🏆 {t("title")}
      </div>
      <p className="mb-3 text-xs text-white/55 leading-relaxed">{t("hint")}</p>

      <div className="mb-3 flex justify-center rounded-xl bg-black/30 border border-white/10 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/badge/bdls/${username}?v=3`} alt={t("title")} width={300} style={{ height: "auto" }} />
      </div>

      <div className="space-y-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">HTML</span>
            <button
              onClick={() => copy("html", html)}
              className={`${btn} ${copied === "html" ? "bg-[var(--accent)] text-black" : "border border-white/10 text-white/60 hover:text-white"}`}
            >
              {copied === "html" ? t("copied") : t("copy")}
            </button>
          </div>
          <code className={snippet}>{html}</code>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Markdown</span>
            <button
              onClick={() => copy("md", md)}
              className={`${btn} ${copied === "md" ? "bg-[var(--accent)] text-black" : "border border-white/10 text-white/60 hover:text-white"}`}
            >
              {copied === "md" ? t("copied") : t("copy")}
            </button>
          </div>
          <code className={snippet}>{md}</code>
        </div>
      </div>
    </div>
  );
}
