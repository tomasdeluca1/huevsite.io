"use client";

import { useTranslations } from "next-intl";
import { LINK_BOX_STYLES, type LinkBoxStyle } from "@/lib/profile-layout";

const LABEL_KEY: Record<LinkBoxStyle, string> = {
  pill: "boxPill",
  card: "boxCard",
  compact: "boxCompact",
  featured: "boxFeatured",
  expandable: "boxExpandable",
};

interface Props {
  value: LinkBoxStyle | null;
  onChange: (value: LinkBoxStyle | null) => void;
  allowDefault?: boolean;
  label?: string;
}

export function BoxStylePicker({ value, onChange, allowDefault = false, label }: Props) {
  const t = useTranslations("dashboard.studio");
  const current = value ?? "";

  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
        {label || t("boxLabel")}
      </span>
      <select
        value={current}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? null : (next as LinkBoxStyle));
        }}
        className="min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm font-bold text-white"
      >
        {allowDefault && <option value="">{t("boxFollowGlobal")}</option>}
        {LINK_BOX_STYLES.map((style) => (
          <option key={style} value={style}>
            {t(LABEL_KEY[style])}
          </option>
        ))}
      </select>
    </label>
  );
}
