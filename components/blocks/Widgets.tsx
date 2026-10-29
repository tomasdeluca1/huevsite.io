"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MetricBlockData, SocialBlockData, CVBlockData, getContrastColor } from "@/lib/profile-types";
import { SOCIAL_PLATFORMS, SocialPlatformKey, resolveSquareLabel, resolveFollowUrl, compactUrl } from "@/lib/social-platforms";
import { SOCIAL_ICONS, FallbackIcon } from "@/components/icons/SocialIcons";
import { Download } from "lucide-react";
import { useBlockPreview } from "@/lib/block-preview-context";

interface MetricProps {
  data: MetricBlockData;
  accentColor: string;
}

export function MetricBlock({ data, accentColor }: MetricProps) {
  const isPreview = useBlockPreview();
  const t = useTranslations('blocks');
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
        <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--text-muted)] opacity-60">{t('metric.live')}</span>
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
  const t = useTranslations('blocks');
  const links = (data.links || []).filter(l => l.url);
  const visibleLinks = isPreview ? links.slice(0, 3) : links;
  const severalWebsites = links.filter(l => l.platform === "website").length > 1;

  const renderIcon = (l: { platform: string; favicon?: string }, size: number, className?: string) => {
    if (l.platform === "website" && l.favicon) {
      return <img src={l.favicon} alt="" width={size} height={size} className={`rounded-sm ${className || ""}`} />;
    }
    const Icon = SOCIAL_ICONS[l.platform as SocialPlatformKey] ?? FallbackIcon;
    return <Icon size={size} className={className} />;
  };

  const getLabel = (link: { platform: string; url: string; label?: string }) => {
    if (link.label) return link.label;
    const p = SOCIAL_PLATFORMS[link.platform as SocialPlatformKey];
    return p?.label ?? link.platform;
  };

  const brandOf = (platform: string) =>
    (SOCIAL_PLATFORMS[platform as SocialPlatformKey] as { brandColor?: string } | undefined)?.brandColor || "#ffffff";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="huevsite-block block-social h-full flex flex-col group"
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      <div className="block-label opacity-40 uppercase tracking-[0.2em] text-[10px] text-left mb-3">{t('social.connect')}</div>

      {visibleLinks.length > 0 && (
        <>
          {/* Celular: grilla de 4 columnas de cuadrados tocables (el <a> es el cuadrado entero) */}
          <div className="grid grid-cols-4 gap-2 md:hidden">
            {visibleLinks.map((l, i) => {
              const name = getLabel(l);
              return (
                <a
                  key={i}
                  href={resolveFollowUrl(l)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  title={name}
                  className="aspect-square min-w-0 flex flex-col items-center justify-center gap-[7px] px-2 max-[340px]:px-1 py-3 rounded-2xl bg-white/[0.03] border border-white/5 active:bg-white/[0.08] hover:border-white/20 transition-colors"
                  style={{ color: brandOf(l.platform) }}
                >
                  {renderIcon(l, 20, "w-[19px] h-[19px] min-[390px]:w-[21px] min-[390px]:h-[21px] shrink-0")}
                  <span className="max-w-full whitespace-nowrap text-[6px] min-[390px]:text-[6.8px] font-black uppercase leading-none tracking-wider text-white">
                    {resolveSquareLabel(l, { severalWebsites })}
                  </span>
                </a>
              );
            })}
          </div>
          {!isPreview && (
            <p className="md:hidden mt-3 text-[10px] text-[var(--text-dim)] font-mono opacity-50 text-left">
              {t('social.openInApp')}
            </p>
          )}

          {/* Escritorio: lista con nombre largo y URL compacta */}
          <div className="hidden md:flex flex-col gap-1.5">
            {visibleLinks.map((l, i) => {
              const brandColor = brandOf(l.platform);
              return (
                <a
                  key={i}
                  href={resolveFollowUrl(l)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] transition-all group/item overflow-hidden relative"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover/item:opacity-[0.03] transition-opacity pointer-events-none"
                    style={{ backgroundColor: brandColor }}
                  />
                  <span className="shrink-0 transition-transform group-hover/item:scale-110 duration-300" style={{ color: brandColor }}>
                    {renderIcon(l, 20)}
                  </span>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="font-bold text-white break-words text-sm">
                      {getLabel(l)}
                    </span>
                    {!isPreview && (
                      <span className="text-[10px] text-[var(--text-muted)] break-all opacity-50 font-mono">
                        {compactUrl(l.url)}
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </>
      )}
      {links.length === 0 && (
        <p className="text-xs text-[var(--text-dim)] font-mono py-8 text-center opacity-40">
          {t('social.noCoords')}
        </p>
      )}
    </motion.div>
  );
}

interface CVProps {
  data: CVBlockData;
  accentColor: string;
}

export function CVBlock({ data, accentColor }: CVProps) {
  const t = useTranslations('blocks');
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
        {data.title || t('cv.download')}
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
          aria-label={data.title || t('cv.download')}
        />
      ) : (
        <div className="text-xs text-red-400 font-mono">{t('cv.noFile')}</div>
      )}
    </motion.div>
  );
}
