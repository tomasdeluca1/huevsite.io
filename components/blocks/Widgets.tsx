"use client";

import React from "react";
import { motion } from "framer-motion";
import { MetricBlockData, SocialBlockData, CVBlockData } from "@/lib/profile-types";
import { SOCIAL_PLATFORMS, SocialPlatformKey } from "@/lib/social-platforms";
import { Download } from "lucide-react";

interface MetricProps {
  data: MetricBlockData;
  accentColor: string;
}

export function MetricBlock({ data, accentColor }: MetricProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-block block-metric h-full flex flex-col justify-center relative group"
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 70%)` }}
      />
      <div className="block-label opacity-40 uppercase tracking-[0.2em] text-[10px] mb-2">{data.label}</div>
      <div className="text-5xl font-black text-white title-tracking mb-1" style={{ color: accentColor }}>
        {data.value}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] opacity-60">En tiempo real</span>
      </div>
    </motion.div>
  );
}

interface SocialProps {
  data: SocialBlockData;
  accentColor: string;
}

export function SocialBlock({ data, accentColor }: SocialProps) {
  const links = data.links || [];

  const getIcon = (platform: string) => {
    const p = SOCIAL_PLATFORMS[platform as SocialPlatformKey];
    return p?.icon ?? "🔗";
  };

  const getLabel = (link: { platform: string; url: string; label?: string }) => {
    if (link.label) return link.label;
    const p = SOCIAL_PLATFORMS[link.platform as SocialPlatformKey];
    return p?.label ?? link.platform;
  };

  const formatUrl = (url: string) => {
    if (!url.startsWith('http') && !url.startsWith('mailto:')) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-block block-social h-full flex flex-col justify-between group"
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      <div className="block-label opacity-40 uppercase tracking-[0.2em] text-[10px] mb-4">Conectemos</div>
      <div className="flex flex-col gap-2 mt-auto">
        {links.filter(l => l.url).map((l, i) => (
          <a
            key={i}
            href={formatUrl(l.url)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/[0.06] transition-all group/item"
          >
            <span className="text-xl grayscale group-hover/item:grayscale-0 transition-all">{getIcon(l.platform)}</span>
            <div className="flex flex-col overflow-hidden">
               <span className="font-bold text-sm text-white group-hover/item:text-[var(--accent)] transition-colors">{getLabel(l)}</span>
               <span className="text-[10px] text-[var(--text-muted)] truncate opacity-50">{l.url.replace('https://', '')}</span>
            </div>
          </a>
        ))}
        {links.filter(l => l.url).length === 0 && (
          <p className="text-xs text-[var(--text-dim)] font-mono py-8 text-center opacity-40">
            // sin coordenadas
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface CVProps {
  data: CVBlockData;
  accentColor: string;
}

export function CVBlock({ data, accentColor }: CVProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-block h-full group flex flex-col items-center justify-center p-6 text-center"
      style={{ 
        backgroundColor: "var(--surface2)",
        borderColor: "var(--border)",
      }}
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg" style={{ backgroundColor: accentColor, color: "black" }}>
        <Download size={28} />
      </div>
      <h3 className="font-bold text-lg text-white mb-1 group-hover:text-[var(--accent)] transition-colors" style={{ "--accent": accentColor } as any}>
        {data.title || "Descargar CV"}
      </h3>
      {data.description && (
        <p className="text-xs text-[var(--text-dim)] font-mono leading-relaxed max-w-[200px] mb-4">
          {data.description}
        </p>
      )}
      {data.fileUrl ? (
        <a 
          href={data.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label={data.title || "Descargar CV"}
        />
      ) : (
        <div className="text-xs text-red-400 font-mono">Sin archivo</div>
      )}
    </motion.div>
  );
}
