"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const SITE = "https://huevsite.io";

/**
 * Dashboard card for a project launched on Builders Hunt: shows the embeddable
 * badge ("vote for me / launched on Builders Hunt") + copy HTML/Markdown to drop
 * on the builder's own product/site. Self-gates — renders nothing until the
 * block has a launch (checked via the badge route's ?check=1 probe).
 */
export function LaunchBadgeCard({ blockId }: { blockId: string }) {
  const t = useTranslations("dashboard.launchBadge");
  const [found, setFound] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<"html" | "md" | null>(null);

  useEffect(() => {
    if (!blockId) return;
    let alive = true;
    fetch(`/api/badge/launch/${blockId}?check=1`)
      .then((r) => r.json())
      .then((d) => alive && setFound(!!d?.found))
      .catch(() => alive && setFound(false));
    return () => {
      alive = false;
    };
  }, [blockId]);

  if (!found) return null;

  const badgeUrl = `${SITE}/api/badge/launch/${blockId}`;
  const link = `${SITE}/feed?utm_source=launch-badge&utm_medium=badge`;
  const html = `<a href="${link}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="Votá mi proyecto en Builders Hunt — huevsite.io" width="240" /></a>`;
  const md = `[![Votá mi proyecto en Builders Hunt — huevsite.io](${badgeUrl})](${link})`;

  const copy = (which: "html" | "md", text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const code =
    "block w-full rounded-lg bg-black/40 border border-white/10 p-2.5 text-[10px] font-mono text-white/60 break-all leading-relaxed";
  const btn = "shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors";

  return (
    <div className="mt-3 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.04] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
        🚀 {t("title")}
      </div>
      <p className="mb-2.5 text-[11px] text-white/55 leading-relaxed">{t("hint")}</p>

      <div className="mb-2.5 flex justify-center rounded-lg bg-black/30 border border-white/10 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badgeUrl} alt={t("title")} width={240} style={{ height: "auto" }} />
      </div>

      <div className="space-y-2">
        {([["html", html], ["md", md]] as const).map(([kind, text]) => (
          <div key={kind}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">{kind === "html" ? "HTML" : "Markdown"}</span>
              <button
                onClick={() => copy(kind, text)}
                className={`${btn} ${copied === kind ? "bg-[var(--accent)] text-black" : "border border-white/10 text-white/60 hover:text-white"}`}
              >
                {copied === kind ? t("copied") : t("copy")}
              </button>
            </div>
            <code className={code}>{text}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
