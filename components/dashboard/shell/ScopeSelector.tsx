"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, Globe, Lock, Plus } from "lucide-react";
import type { ProfileData } from "@/lib/profile-types";

interface Props {
  profile: ProfileData;
  isPro: boolean;
  selectedSubSiteId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onUpgrade: () => void;
}

// Elige qué estás editando: el perfil principal o uno de los sub-sitios.
// Crear sub-sitios es Pro; el resto de su gestión vive en Ajustes.
export function ScopeSelector({ profile, isPro, selectedSubSiteId, onSelect, onCreate, onUpgrade }: Props) {
  const t = useTranslations("dashboard.shell");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = profile.subSites.find((s) => s.id === selectedSubSiteId) || null;
  const title = current ? current.title : t("mainProfile");
  const avatar = current ? current.avatarUrl : profile.avatarUrl;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const Avatar = ({ src, label }: { src?: string | null; label: string }) =>
    src ? (
      <img src={src} alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover" />
    ) : (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-[12px] font-black text-white/60">{label.charAt(0).toUpperCase()}</span>
    );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("scopeLabel")}
        className="flex min-h-10 max-w-[260px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3 transition-colors hover:border-white/20"
      >
        <Avatar src={avatar} label={title} />
        <span className="truncate text-[13px] font-bold text-white">{title}</span>
        <ChevronDown size={14} className={`shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" className="absolute left-0 top-full z-[160] mt-2 w-[280px] rounded-2xl border border-white/10 bg-[#111112] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
          <p className="px-2.5 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{t("scopeLabel")}</p>
          {[{ id: null as string | null, title: profile.displayName || t("mainProfile"), slug: profile.username, avatar: profile.avatarUrl }, ...profile.subSites.map((s) => ({ id: s.id as string | null, title: s.title, slug: `${profile.username}/${s.slug}`, avatar: s.avatarUrl }))].map((item) => {
            const selected = item.id === selectedSubSiteId;
            return (
              <button
                key={item.id ?? "main"}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { setOpen(false); onSelect(item.id); }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors ${selected ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}
              >
                {item.id ? (item.avatar ? <Avatar src={item.avatar} label={item.title} /> : <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.06]"><Globe size={13} className="text-white/50" /></span>) : <Avatar src={item.avatar} label={item.title} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-white">{item.title}</span>
                  <span className="block truncate font-mono text-[10.5px] text-white/35">/{item.slug}</span>
                </span>
                {selected && <Check size={14} className="shrink-0 text-[var(--accent)]" />}
              </button>
            );
          })}
          <div className="mt-1 border-t border-white/[0.06] pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); if (isPro) onCreate(); else onUpgrade(); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-[13px] font-bold text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg border border-dashed border-white/20">{isPro ? <Plus size={13} /> : <Lock size={12} />}</span>
              {t("newSubsite")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
