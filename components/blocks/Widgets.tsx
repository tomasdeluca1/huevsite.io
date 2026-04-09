"use client";

import React from "react";
import { motion } from "framer-motion";
import { MetricBlockData, SocialBlockData, CVBlockData, getContrastColor } from "@/lib/profile-types";
import { SOCIAL_PLATFORMS, SocialPlatformKey } from "@/lib/social-platforms";
import { Download, Instagram, Youtube, Github, Linkedin, Twitter, MessageSquare, Send, Globe, Mail } from "lucide-react";
import { useBlockPreview } from "@/lib/block-preview-context";

interface MetricProps {
  data: MetricBlockData;
  accentColor: string;
}

export function MetricBlock({ data, accentColor }: MetricProps) {
  const isPreview = useBlockPreview();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="huevsite-block block-metric h-full flex flex-col justify-center relative group"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 70%)` }}
      />
      <div className={`block-label opacity-40 uppercase tracking-[0.2em] text-left ${isPreview ? 'text-[10px] mb-1' : 'text-[10px] mb-2'}`}>{data.label}</div>
      <div className={`font-black text-white title-tracking text-left ${isPreview ? 'text-3xl mb-0' : 'text-3xl md:text-5xl mb-1'}`} style={{ color: accentColor }}>
        {data.value}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--text-muted)] opacity-60">En tiempo real</span>
      </div>
    </motion.div>
  );
}

interface SocialProps {
  data: SocialBlockData;
  accentColor: string;
}

export function SocialBlock({ data, accentColor }: SocialProps) {
  const isPreview = useBlockPreview();
  const links = data.links || [];

  const getIcon = (platform: string, color: string, favicon?: string) => {
    const size = 20;
    switch (platform) {
      case "instagram": return <Instagram size={size} style={{ color }} />;
      case "youtube": return <Youtube size={size} style={{ color }} />;
      case "github": return <Github size={size} style={{ color }} />;
      case "linkedin": return <Linkedin size={size} style={{ color }} />;
      case "twitter": return <span className="ml-1 text-xl">𝕏</span>
      case "discord": return <MessageSquare size={size} style={{ color }} />;
      case "telegram": return <Send size={size} style={{ color }} />;
      case "website": return favicon
        ? <img src={favicon} alt="" width={size} height={size} className="rounded-sm" />
        : <Globe size={size} style={{ color }} />;
      default: return <span className="text-lg md:text-xl">{SOCIAL_PLATFORMS[platform as SocialPlatformKey]?.icon || "🔗"}</span>;
    }
  };

  const getPlatformData = (platform: string) => {
    return SOCIAL_PLATFORMS[platform as SocialPlatformKey];
  };

  const getLabel = (link: { platform: string; url: string; label?: string }) => {
    if (link.label) return link.label;
    const p = getPlatformData(link.platform);
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
      className="huevsite-block block-social h-full flex flex-col justify-between group"
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      <div className="block-label opacity-40 uppercase tracking-[0.2em] text-[10px] text-left mb-3">Conectemos</div>
      <div className="flex flex-col gap-1.5 mt-auto">
        {links.filter(l => l.url).slice(0, isPreview ? 3 : undefined).map((l, i) => {
          const pData = getPlatformData(l.platform);
          const brandColor = (pData as any)?.brandColor || "#ffffff";

          return (
            <a
              key={i}
              href={formatUrl(l.url)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] transition-all group/item overflow-hidden relative"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover/item:opacity-[0.03] transition-opacity pointer-events-none"
                style={{ backgroundColor: brandColor }}
              />
              <span className="shrink-0 transition-transform group-hover/item:scale-110 duration-300">
                {getIcon(l.platform, brandColor, l.favicon)}
              </span>
              <div className="flex flex-col min-w-0 text-left">
                <span className="font-bold text-white line-clamp-1 text-xs md:text-sm">
                  {getLabel(l)}
                </span>
                {!isPreview && (
                  <span className="text-[9px] md:text-[10px] text-[var(--text-muted)] truncate opacity-50 font-mono">
                    {l.url.replace('https://', '').replace('http://', '').split('?')[0]}
                  </span>
                )}
              </div>
            </a>
          );
        })}
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
      className="huevsite-block h-full group flex flex-col items-center justify-center text-center"
      style={{
        backgroundColor: "var(--surface2)",
        borderColor: "var(--border)",
      }}
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg" style={{ backgroundColor: accentColor, color: getContrastColor(accentColor) }}>
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
