"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import type { BlockData, ProjectBlockData, ProjectStatus } from "@/lib/profile-types";
import {
  PROJECT_STATUS_ORDER,
  getLaunchCountdownDays,
  isLaunchOverdue,
} from "@/lib/project-lifecycle";
import { buildLaunchyNewProductUrl } from "@/lib/launchy";
import { AddProjectModal } from "@/components/dashboard/AddProjectModal";

interface Props {
  blocks: BlockData[];
  onUpdateBlock: (block: BlockData) => void;
  onEdit: (block: BlockData) => void;
  onAddProject: (prefill?: Partial<ProjectBlockData>) => void;
  accentColor?: string;
}

export function ProjectTracker({ blocks, onUpdateBlock, onEdit, onAddProject, accentColor }: Props) {
  const t = useTranslations("dashboard.projects");
  const [addOpen, setAddOpen] = useState(false);

  const projects = blocks
    .filter((b): b is ProjectBlockData => b.type === "project")
    .filter((p) => !p.archived);

  const statusLabel = (s: ProjectStatus) =>
    t(s === "idea" ? "status.idea" : s === "building" ? "status.building" : "status.launched");

  const addButton = (
    <button
      onClick={() => setAddOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide text-black"
      style={{ backgroundColor: accentColor || "var(--accent)" }}
    >
      <Plus size={14} /> {t("addProject")}
    </button>
  );

  const modal = (
    <AddProjectModal
      open={addOpen}
      onClose={() => setAddOpen(false)}
      onCreate={(prefill) => {
        setAddOpen(false);
        onAddProject(prefill);
      }}
      accentColor={accentColor}
    />
  );

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">{addButton}</div>
        <p className="text-sm text-white/40 py-8 text-center">{t("empty")}</p>
        {modal}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">{addButton}</div>
      {PROJECT_STATUS_ORDER.map((status) => {
        const items = projects.filter((p) => (p.status || "idea") === status);
        if (items.length === 0) return null;
        return (
          <div key={status}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
              {statusLabel(status)} · {items.length}
            </h3>
            <div className="space-y-2">
              {items.map((p) => {
                const days = getLaunchCountdownDays(p.launchDate);
                const overdue = isLaunchOverdue(p.status, p.launchDate);
                const launchyUrl = buildLaunchyNewProductUrl(p);
                const alreadyLaunched = !!p.launch;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{p.title}</div>
                      <div className="text-xs text-white/40">
                        {p.launchDate
                          ? days !== null && days > 0
                            ? t("countdown", { days })
                            : t("dateOn", { date: p.launchDate })
                          : t("noDate")}
                        {p.launch
                          ? ` · ${t("liveCount", { live: p.launch.live, total: p.launch.total })}`
                          : ""}
                      </div>
                    </div>

                    {overdue && (
                      <button
                        onClick={() => onUpdateBlock({ ...p, status: "launched" })}
                        className="shrink-0 rounded-lg bg-[var(--accent)]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]"
                      >
                        {t("markLaunched")}
                      </button>
                    )}

                    <select
                      value={p.status || "idea"}
                      onChange={(e) => onUpdateBlock({ ...p, status: e.target.value as ProjectStatus })}
                      className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                    >
                      <option value="idea">{t("status.idea")}</option>
                      <option value="building">{t("status.building")}</option>
                      <option value="launched">{t("status.launched")}</option>
                    </select>

                    {!alreadyLaunched && launchyUrl && (
                      <a
                        href={launchyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-[var(--accent)]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]"
                        title={t("launchInLaunchy")}
                      >
                        {t("launchInLaunchy")}
                      </a>
                    )}
                    {!alreadyLaunched && !launchyUrl && (
                      <span className="shrink-0 text-[10px] text-white/30" title={t("launchNeedsLink")}>
                        {t("launchNeedsLink")}
                      </span>
                    )}

                    <button
                      onClick={() => onEdit(p)}
                      className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60 hover:text-white"
                    >
                      {t("edit")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {modal}
    </div>
  );
}
