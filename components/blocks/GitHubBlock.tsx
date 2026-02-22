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
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bento-block block-github h-full flex flex-col justify-between relative group !p-5"
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
        <div className="block-label mb-4">GitHub · @{username}</div>
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">{stats.stars}</span>
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">stars</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight" style={{ color: accentColor }}>{stats.repos}</span>
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">repos</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">{stats.followers}</span>
            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">followers</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-[repeat(13,1fr)] gap-[2px] mt-auto">
        {heatmap.map((cls, i) => (
          <div
            key={i}
            className={`w-full aspect-square rounded-[2px] ${cls}`}
            style={cls ? { backgroundColor: cls === 'hm-4' ? accentColor : undefined, opacity: cls === 'hm-3' ? 0.6 : cls === 'hm-2' ? 0.35 : cls === 'hm-1' ? 0.15 : 1 } : { backgroundColor: 'var(--surface)' }}
          />
        ))}
      </div>
    </motion.div>
  );
}
