"use client";

import { motion } from "framer-motion";
import { GitHubBlockData } from "@/lib/profile-types";
import { useEffect, useState } from "react";

import { ExternalLink } from "lucide-react";

interface Props {
  data: GitHubBlockData;
  accentColor: string;
}

export function GitHubBlock({ data, accentColor }: Props) {
  const [heatmap, setHeatmap] = useState<string[]>([]);

  const stats = data.stats || { stars: 0, repos: 0, followers: 0 };
  const username = data.username || "usuario";

  useEffect(() => {
    if (data.stats.heatmap && data.stats.heatmap.length > 0) {
      setHeatmap(data.stats.heatmap.map(val => val === 0 ? "" : `hm-${val}`));
    } else {
      const cells = [];
      for (let i = 0; i < 26; i++) {
        const r = Math.random();
        if (r > 0.8) cells.push("hm-4");
        else if (r > 0.6) cells.push("hm-3");
        else if (r > 0.4) cells.push("hm-2");
        else if (r > 0.2) cells.push("hm-1");
        else cells.push("");
      }
      setHeatmap(cells);
    }
  }, [data.stats.heatmap]);

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

        {data.showAdvanced && stats.topLanguages && (
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

        {data.showAdvanced && (stats.totalCommits || stats.issuesClosed) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mb-6">
            {stats.totalCommits && (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">{stats.totalCommits}</span>
                <span className="text-[8px] uppercase tracking-widest text-[var(--text-muted)]">Commits / Year</span>
              </div>
            )}
            {stats.issuesClosed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">{stats.issuesClosed}</span>
                <span className="text-[8px] uppercase tracking-widest text-[var(--text-muted)]">Issues Fixed</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[repeat(13,1fr)] gap-[2px] sm:gap-[3px] mt-auto w-full min-w-0">
        {heatmap.map((cls, i) => (
          <div
            key={i}
            className={`w-full aspect-square rounded-[2px] sm:rounded-[3px] ${cls}`}
            style={cls ? { backgroundColor: cls === 'hm-4' ? accentColor : undefined, opacity: cls === 'hm-3' ? 0.6 : cls === 'hm-2' ? 0.35 : cls === 'hm-1' ? 0.15 : 1 } : { backgroundColor: 'rgba(255,255,255,0.05)' }}
          />
        ))}
      </div>
    </motion.div>
  );
}
