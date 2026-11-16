"use client";

import { useTranslations } from "next-intl";
import { Globe2 } from "lucide-react";
import type { ProfileData } from "@/lib/profile-types";

interface Props {
  profile: ProfileData;
  onOpen: (id: string) => void;
  onToggle: (value: boolean) => void;
}

// El perfil público muestra los sub-sitios como "Proyectos" arriba de todo
// (ProfileHeader). Esta franja los muestra en el mismo lugar del dashboard,
// así lo que se ve publicado también se ve acá, y se puede ocultar.
export function EcosystemStrip({ profile, onOpen, onToggle }: Props) {
  const t = useTranslations("dashboard.shell");
  const shown = profile.showEcosystem !== false;
  return (
    <section className={`rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4 transition-opacity ${shown ? "" : "opacity-60"}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/40">{t("ecosystemTitle")}</h3>
          <p className="mt-1 text-[12.5px] text-white/45">{shown ? t("ecosystemHint") : t("ecosystemHiddenHint")}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!shown)}
          className="min-h-9 shrink-0 rounded-lg border border-white/10 px-3 text-[12px] font-bold text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          {shown ? t("ecosystemHide") : t("ecosystemShow")}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {profile.subSites.map((site) => (
          <button
            key={site.id}
            type="button"
            onClick={() => onOpen(site.id)}
            title={t("ecosystemEdit", { title: site.title })}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3 transition-colors hover:border-[var(--accent)]/40"
          >
            <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-lg bg-black/40">
              {site.avatarUrl ? <img src={site.avatarUrl} alt="" className="h-full w-full object-cover" /> : <Globe2 size={13} className="text-white/40" />}
            </span>
            <span className="text-[13px] font-bold text-white">{site.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
