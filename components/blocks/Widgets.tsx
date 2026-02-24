"use client";

import React from "react";
import { motion } from "framer-motion";
import { MetricBlockData, SocialBlockData } from "@/lib/profile-types";
import { SOCIAL_PLATFORMS, SocialPlatformKey } from "@/lib/social-platforms";

interface MetricProps {
  data: MetricBlockData;
  accentColor: string;
}

export function MetricBlock({ data, accentColor }: MetricProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-block block-metric h-full"
    >
      <div className="block-label">{data.label}</div>
      <div className="metric-num" style={{ color: accentColor }}>{data.value}</div>
      <div className="metric-lbl"> {data.label}</div>
      <div className="metric-trend" style={{ color: `${accentColor}CC` }}>↑ actualizado hace poco</div>
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-block block-social h-full flex flex-col justify-between"
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      <div className="block-label">Links y Redes</div>
      <div className="flex flex-col gap-2 mt-4">
        {links.filter(l => l.url).map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-[var(--accent)] hover:text-black transition-all group"
          >
            <span className="text-lg opacity-70 group-hover:opacity-100 w-6 text-center shrink-0">{getIcon(l.platform)}</span>
            <span className="font-medium text-sm truncate">{getLabel(l)}</span>
          </a>
        ))}
        {links.filter(l => l.url).length === 0 && (
          <p className="text-xs text-[var(--text-dim)] font-mono py-4 text-center">
            Sin links todavía.
          </p>
        )}
      </div>
    </motion.div>
  );
}
