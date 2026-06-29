"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ProjectBlockData, ProjectStatus } from "@/lib/profile-types";
import { getLaunchCountdownDays } from "@/lib/project-lifecycle";
import { withHuevsiteUtm } from "@/lib/utm";
import { ExternalLink } from "lucide-react";

interface Props {
  data: ProjectBlockData;
  accentColor: string;
}

export function ProjectBlock({ data, accentColor }: Props) {
  const t = useTranslations('blocks');
  const title = data.title || t('project.fallbackTitle');
  const description = data.description || t('project.fallbackDescription');
  const link = data.link || "#";
  const metrics = data.metrics || "";
  const useFavicon = data.imageMode === "favicon" && !!data.faviconUrl;
  const imageUrl = useFavicon ? data.faviconUrl : data.imageUrl;
  const stack = data.stack || [];
  const status: ProjectStatus = data.status || "idea";
  const statusLabel = status === "launched" ? "LIVE" : status === "building" ? "WIP" : "IDEA";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="huevsite-block block-project h-full !p-0 flex flex-col group overflow-hidden"
    >
      <div className="project-preview relative aspect-video w-full">
        {imageUrl ? (
          <img
            src={imageUrl}
            className={`w-full h-full opacity-80 transition-all duration-500 group-hover:opacity-100 ${
              useFavicon
                ? "object-contain p-10 group-hover:scale-105"
                : "object-cover group-hover:scale-110"
            }`}
            alt={title}
          />
        ) : (
          <div
            className="project-preview-code h-full flex flex-col justify-center transition-colors bg-black/40 p-8"
          >
            <div className="opacity-40 font-mono text-[10px] mb-4 uppercase tracking-[0.2em]">Source Code Preview</div>
            <div className="space-y-1">
              <div className="text-sm"><span className="kw" style={{ color: accentColor }}>import</span> {'{ Project }'} <span className="kw" style={{ color: accentColor }}>from</span> <span className="str">&lsquo;huevsite&rsquo;</span></div>
              <div className="text-sm"><span className="kw" style={{ color: accentColor }}>const</span> <span className="fn" style={{ color: '#4D9FFF' }}>{title.replace(/\s+/g, '')}</span> = () <span className="kw" style={{ color: accentColor }}>=&gt;</span> {'{'}</div>
              <div className="text-sm">&nbsp; <span className="kw" style={{ color: accentColor }}>return</span> (</div>
              <div className="text-sm">&nbsp; &nbsp; &lt;<span className="fn" style={{ color: '#4D9FFF' }}>Showcase</span> <span className="str">status</span>=<span className="str">&quot;{statusLabel}&quot;</span> /&gt;</div>
              <div className="text-sm">&nbsp; )</div>
              <div className="text-sm">{'}'}</div>
            </div>

            {/* Decorative Glow */}
            <div
              className="absolute bottom-[-20%] right-[-10%] w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        )}
      </div>

      <div className="project-info p-4 md:p-5 h-full flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex flex-col gap-1.5">
            <h3 className="project-name text-xl md:text-2xl font-black text-white title-tracking leading-tight">{title}</h3>
            <ProjectStatusPill status={status} launchDate={data.launchDate} accentColor={accentColor} />
          </div>
          {link !== "#" && status === "launched" && (
            <div
              className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(200,255,0,0.5)]"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </div>

        <p className="project-desc text-sm text-[var(--text-dim)] leading-relaxed mb-6 opacity-80">
          {description}
        </p>

        {stack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {stack.map((tech, i) => (
              <span key={`${tech}-${i}`} className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/50">
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-3">
            {metrics ? (
              <div className="flex gap-4">
                {metrics.split(',').map((m, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-xs font-bold text-white tracking-tighter">{m.trim().split(' ')[0]}</span>
                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest">{m.trim().split(' ').slice(1).join(' ')}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {data.launch && data.launch.live > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
                🚀 {t("project.liveInDirectories", { live: data.launch.live })}
              </span>
            )}
          </div>

          {link !== "#" && (
            <a
              href={withHuevsiteUtm(link, "profile")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:translate-x-1 transition-transform"
              style={{ color: accentColor }}
            >
              {t('project.viewDemo')} <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ProjectStatusPill({
  status,
  launchDate,
  accentColor,
}: {
  status: ProjectStatus;
  launchDate?: string;
  accentColor: string;
}) {
  const t = useTranslations("blocks");
  const days = getLaunchCountdownDays(launchDate);

  let label: string;
  if (status === "launched") {
    label = launchDate
      ? t("project.launchedOn", { date: formatShort(launchDate) })
      : t("project.statusLaunched");
  } else if (status === "building") {
    label =
      days !== null && days > 0
        ? t("project.launchesInDays", { days })
        : days === 0
        ? t("project.launchesToday")
        : t("project.statusBuilding");
  } else {
    label = t("project.statusIdea");
  }

  const dim = status === "launched";
  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{
        color: dim ? accentColor : "rgba(255,255,255,0.6)",
        backgroundColor: dim ? `${accentColor}1A` : "rgba(255,255,255,0.06)",
        border: `1px solid ${dim ? `${accentColor}33` : "rgba(255,255,255,0.1)"}`,
      }}
    >
      {label}
    </span>
  );
}

function formatShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
