"use client";

import { motion } from "framer-motion";
import { GitHubBlockData } from "@/lib/profile-types";
import { useEffect, useState } from "react";
import { useBlockPreview } from "@/lib/block-preview-context";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  data: GitHubBlockData;
  accentColor: string;
}

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const HEATMAP_VISIBLE = 91; // last 13 weeks (13 cols x 7 rows)

function formatMonth(key: string): string {
  // key = "YYYY-MM"
  const [year, month] = key.split("-");
  const idx = parseInt(month, 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx > 11) return key;
  return `${MONTHS_ES[idx]} ${year}`;
}

/** Heatmap cell style for an intensity value 0-4, tinted with the user accent. */
function cellStyle(value: number, accentColor: string): React.CSSProperties {
  if (value <= 0) return { backgroundColor: "rgba(255,255,255,0.05)" };
  const opacity = value >= 4 ? 0.9 : value === 3 ? 0.6 : value === 2 ? 0.35 : 0.15;
  return { backgroundColor: accentColor, opacity };
}

export function GitHubBlock({ data, accentColor }: Props) {
  const isPreview = useBlockPreview();

  const stats = data.stats || { stars: 0, repos: 0, followers: 0 };
  const username = data.username || "usuario";

  const months = stats.commitsByMonth ?? [];
  const [monthIdx, setMonthIdx] = useState(Math.max(0, months.length - 1));

  // Keep the selected month in range and default to the latest month when the
  // available months change (e.g. after a background sync).
  useEffect(() => {
    setMonthIdx(Math.max(0, months.length - 1));
  }, [months.length]);

  const safeIdx = Math.min(Math.max(monthIdx, 0), Math.max(months.length - 1, 0));
  const currentMonth = months[safeIdx];

  // Real heatmap only — no more random fallback. Empty → neutral cells.
  const realHeatmap = stats.heatmap && stats.heatmap.length > 0 ? stats.heatmap : [];
  const heatmapCells =
    realHeatmap.length > 0 ? realHeatmap.slice(-HEATMAP_VISIBLE) : new Array(HEATMAP_VISIBLE).fill(0);

  if (isPreview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="huevsite-block block-github h-full flex flex-col justify-center relative text-left"
      >
        <div className="block-label mb-3 uppercase tracking-[0.2em] text-left text-[10px]">GITHUB</div>
        <div className="flex gap-5">
          <div className="flex flex-col items-start">
            <span className="text-xl font-black tracking-tight">{stats.stars}</span>
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">STARS</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xl font-black tracking-tight" style={{ color: accentColor }}>{stats.repos}</span>
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">REPOS</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xl font-black tracking-tight" style={{ color: '#4A90E2' }}>{stats.followers}</span>
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">FOLLOWS</span>
          </div>
        </div>
        {currentMonth && (
          <div className="mt-3 text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
            <span className="font-black text-sm tracking-tight text-white">{currentMonth.count}</span> commits · {formatMonth(currentMonth.month)}
          </div>
        )}
        {stats.topLanguages && stats.topLanguages.length > 0 && (
          <div className="mt-3 flex h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            {stats.topLanguages.map((lang, idx) => (
              <div key={idx} style={{ width: `${lang.percent}%`, backgroundColor: idx === 0 ? accentColor : idx === 1 ? '#4A90E2' : '#8B5CF6' }} />
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="huevsite-block block-github h-full flex flex-col justify-between relative group"
    >
      <a
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 p-2 rounded-lg bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md z-10"
        title="Ver en GitHub"
      >
        <ExternalLink size={14} />
      </a>

      <div>
        <div className="block-label mb-4 uppercase tracking-[0.2em]">GITHUB</div>
        <div className="flex gap-6 mb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight mb-1">{stats.stars}</span>
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">STARS</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight mb-1" style={{ color: accentColor }}>{stats.repos}</span>
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">REPOS</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#4A90E2' }}>{stats.followers}</span>
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">FOLLOWERS</span>
          </div>
        </div>

        {/* Navigable monthly commit counter */}
        {currentMonth && (
          <div className="flex items-center justify-between gap-2 mb-4 rounded-xl bg-black/20 border border-white/5 px-2 py-2">
            <button
              type="button"
              onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
              disabled={safeIdx <= 0}
              aria-label="Mes anterior"
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-default"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex flex-col items-center leading-none">
              <span className="text-xl font-black tracking-tight" style={{ color: accentColor }}>{currentMonth.count}</span>
              <span className="text-[8px] uppercase tracking-widest text-[var(--text-muted)] mt-1">commits · {formatMonth(currentMonth.month)}</span>
            </div>
            <button
              type="button"
              onClick={() => setMonthIdx((i) => Math.min(months.length - 1, i + 1))}
              disabled={safeIdx >= months.length - 1}
              aria-label="Mes siguiente"
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-default"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {data.showAdvanced && stats.topLanguages && stats.topLanguages.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
              <span>Top Languages</span>
              <span style={{ color: accentColor }}>Impact</span>
            </div>
            <div className="flex h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              {stats.topLanguages.map((lang, idx) => (
                <div
                  key={idx}
                  style={{
                    width: `${lang.percent}%`,
                    backgroundColor: idx === 0 ? accentColor : idx === 1 ? '#4A90E2' : '#8B5CF6'
                  }}
                />
              ))}
            </div>
            <div className="flex gap-3">
              {stats.topLanguages.map((lang, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: idx === 0 ? accentColor : idx === 1 ? '#4A90E2' : '#8B5CF6' }} />
                  <span className="text-[10px] font-mono text-[var(--text-dim)]">{lang.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.showAdvanced && (!!stats.commitsThisYear || !!stats.pullRequests) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mb-6">
            {!!stats.commitsThisYear && (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">{stats.commitsThisYear}</span>
                <span className="text-[8px] uppercase tracking-widest text-[var(--text-muted)]">Commits / Year</span>
              </div>
            )}
            {!!stats.pullRequests && (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">{stats.pullRequests}</span>
                <span className="text-[8px] uppercase tracking-widest text-[var(--text-muted)]">Pull Requests</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[repeat(13,1fr)] gap-[2px] sm:gap-[3px] mt-auto w-full min-w-0">
        {heatmapCells.map((value, i) => (
          <div
            key={i}
            className="w-full aspect-square rounded-[2px] sm:rounded-[3px]"
            style={cellStyle(value, accentColor)}
          />
        ))}
      </div>
    </motion.div>
  );
}
