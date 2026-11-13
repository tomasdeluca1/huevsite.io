"use client";

import { Reorder } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SOCIAL_PLATFORMS, SocialPlatformKey } from "@/lib/social-platforms";
import { linkDraft, normalizeSocialInput, socialDraftsBlockSave } from "@/lib/social-url";

export interface SocialLinkDraft {
  platform?: string;
  handle?: string;
  url?: string;
  label?: string;
  favicon?: string;
  _dragId?: string;
}

interface Props {
  links: SocialLinkDraft[];
  onChange: (links: SocialLinkDraft[]) => void;
  accentColor?: string;
}

function faviconFor(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
  } catch {
    return undefined;
  }
}

export function socialLinksBlockSave(links: SocialLinkDraft[] | undefined): boolean {
  return socialDraftsBlockSave(links);
}

export function SocialLinkEditor({ links, onChange, accentColor = "#C8FF00" }: Props) {
  const t = useTranslations("dashboard");
  const rows = links || [];

  const update = (index: number, patch: Partial<SocialLinkDraft>) => {
    const next = rows.map((link, i) => (i === index ? { ...link, ...patch } : link));
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="section-label !text-[9px] px-1">{t("blockEditor.social.linksLabel")}</div>
        <p className="px-1 pt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">{t("blockEditor.social.hint")}</p>
      </div>
      <Reorder.Group axis="y" values={rows} onReorder={onChange} className="space-y-3">
        {rows.map((linkObj, index) => {
          const platform = linkObj.platform || "twitter";
          const platformConfig = SOCIAL_PLATFORMS[platform as SocialPlatformKey];
          const draft = linkDraft(linkObj);
          const result = draft.trim() ? normalizeSocialInput(platform, draft) : null;
          const invalid = !!result && !result.ok && result.code !== "empty";
          const describedBy = `social-link-${index}-feedback`;

          return (
            <Reorder.Item
              key={linkObj._dragId || index}
              value={linkObj}
              whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
              className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5 relative group/item sortable-item"
            >
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="drag-handle p-1.5 -ml-1 text-white/20 group-hover/item:text-white/40 transition-colors bg-white/5 rounded-lg">
                    <GripVertical size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color: accentColor }}>
                    {platformConfig?.label || platform}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all shrink-0"
                  aria-label={t("blockEditor.social.removeLink")}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <select
                  value={platform}
                  onChange={(e) =>
                    update(index, { platform: e.target.value, handle: "", url: "", favicon: undefined })
                  }
                  className="w-full min-h-12 p-3 rounded-xl bg-black/40 border border-white/5 focus:border-[var(--accent)] outline-none transition-all text-base md:text-sm font-medium"
                  aria-label={platformConfig?.label || platform}
                >
                  {Object.entries(SOCIAL_PLATFORMS).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
                <input
                  value={draft}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = raw.trim() ? normalizeSocialInput(platform, raw) : null;
                    update(index, {
                      handle: raw,
                      url: parsed?.ok ? parsed.url : "",
                      favicon: platform === "website" && parsed?.ok ? faviconFor(parsed.url) : undefined,
                    });
                  }}
                  className={`w-full min-h-12 p-3 rounded-xl bg-black/40 border outline-none transition-all font-mono text-base md:text-sm ${
                    invalid ? "border-red-400/70 focus:border-red-300" : "border-white/5 focus:border-[var(--accent)]"
                  }`}
                  placeholder={platformConfig?.placeholder ?? t("blockEditor.social.handlePlaceholder")}
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="url"
                />
              </div>
              <div id={describedBy} className="px-1 min-h-4">
                {result?.ok && (
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)] font-mono break-all">
                    {t("blockEditor.social.preview", { url: result.url })}
                  </p>
                )}
                {invalid && result && !result.ok && (
                  <p role="alert" className="text-[11px] leading-relaxed text-red-300 break-words">
                    {result.error}
                  </p>
                )}
              </div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      <button
        type="button"
        onClick={() =>
          onChange([
            ...rows,
            {
              platform: "twitter",
              handle: "",
              url: "",
              label: "",
              _dragId: Math.random().toString(36).slice(2, 11),
            },
          ])
        }
        className="w-full min-h-12 p-3 rounded-xl border border-dashed border-[var(--border-bright)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
      >
        {t("blockEditor.social.addLink")}
      </button>
    </div>
  );
}
