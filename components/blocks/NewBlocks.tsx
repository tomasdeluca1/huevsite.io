"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  MediaBlockData,
  CertificationBlockData,
  AchievementBlockData,
  CustomBlockData,
  CollabBlockData,
  EcosystemBlockData,
  isDarkColor
} from "@/lib/profile-types";
import { ExternalLink, Award, Trophy, Star, Globe, ArrowUpRight, ZoomIn } from "lucide-react";
import Link from "next/link";
import { useBlockPreview } from "@/lib/block-preview-context";

export function MediaBlock({ data, accentColor }: { data: MediaBlockData; accentColor: string }) {
  const t = useTranslations('blocks');
  const isPreview = useBlockPreview();
  const [isZoomed, setIsZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDirectVideo = data.url.match(/\.(mp4|webm|ogg)$/i);
  const isYouTube = data.url.includes("youtube.com") || data.url.includes("youtu.be");
  const isVimeo = data.url.includes("vimeo.com");
  const isVideo = isDirectVideo || isYouTube || isVimeo;
  const externalLink = data.link?.trim() || ((!data.url.includes('supabase.co') && !data.url.startsWith('/storage')) ? data.url : "");
  const hasExternalLink = externalLink.length > 0;

  // Lock scroll when zoomed (disabled in preview)
  useEffect(() => {
    if (isPreview) return;
    if (isZoomed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isZoomed, isPreview]);

  const getEmbedUrl = (url: string) => {
    if (isYouTube) {
      const id = url.includes("youtu.be") ? url.split("/").pop() : new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}`;
    }
    if (isVimeo) {
      const id = url.split("/").pop();
      return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1`;
    }
    return url;
  };

  return (
    <>
      <motion.div
        className="huevsite-block block-media h-full p-0 overflow-hidden relative group border"
        style={{ borderColor: isDarkColor(accentColor) ? 'rgba(255,255,255,0.1)' : 'var(--border)', cursor: isPreview ? 'default' : 'zoom-in' }}
        onClick={() => !isPreview && setIsZoomed(true)}
      >
        {isYouTube || isVimeo ? (
          <iframe
            src={getEmbedUrl(data.url)}
            className="w-full h-full object-cover absolute inset-0 pointer-events-none grayscale group-hover:grayscale-0 transition-all duration-700"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
          />
        ) : isDirectVideo ? (
          <video
            src={data.url}
            className="w-full h-full object-cover absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-700"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={data.url}
            alt={data.title || "Media"}
            className="w-full h-full object-cover absolute inset-0 transition-all duration-700 group-hover:scale-105"
          />
        )}

        {/* Overlay gradient for text readability */}
        {(data.title || data.description) && (
          <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end transform translate-y-2 group-hover:translate-y-0 transition-transform">
            {data.title && (
              <h3 className="text-white font-black text-xl mb-1 title-tracking">{data.title}</h3>
            )}
            {data.description && (
              <p className="text-white/60 text-xs font-medium line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
                {data.description}
              </p>
            )}
          </div>
        )}

        {/* Zoom icon on hover */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all pointer-events-none transform translate-y-2 group-hover:translate-y-0">
          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            <ZoomIn size={16} />
          </div>
        </div>

        {/* Play indicator for videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-16 h-16 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Lightbox Modal — portal to body so it escapes framer-motion stacking context */}
      {mounted && createPortal(
        <AnimatePresence>
          {isZoomed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/98 p-4 md:p-12 cursor-zoom-out backdrop-blur-sm"
              onClick={() => setIsZoomed(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative max-w-7xl max-h-full w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full aspect-video md:aspect-auto flex justify-center bg-black/40 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 group/modal">
                  {isYouTube || isVimeo ? (
                    <iframe
                      src={isYouTube
                        ? `https://www.youtube.com/embed/${data.url.includes("youtu.be") ? data.url.split("/").pop() : new URL(data.url).searchParams.get("v")}?autoplay=1`
                        : `https://player.vimeo.com/video/${data.url.split("/").pop()}?autoplay=1`
                      }
                      className="w-full aspect-video max-h-[75vh] md:max-h-[80vh]"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; fullscreen"
                    />
                  ) : isDirectVideo ? (
                    <video
                      src={data.url}
                      className="max-w-full max-h-[75vh] md:max-h-[80vh] rounded-2xl"
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      src={data.url}
                      alt={data.title}
                      className="max-w-full max-h-[75vh] md:max-h-[80vh] rounded-2xl object-contain shadow-2xl"
                    />
                  )}

                  {hasExternalLink && (
                    <a
                      href={externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-6 right-6 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black transition-all flex items-center gap-2 font-bold text-sm shadow-xl"
                    >
                      {t('custom.visitLink')} <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                <div className="mt-10 text-center max-w-3xl">
                  {data.title && <h3 className="text-white text-3xl md:text-4xl font-black tracking-tighter mb-4">{data.title}</h3>}
                  {data.description && <p className="text-white/60 text-lg leading-relaxed font-medium mb-8">{data.description}</p>}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all"
                      onClick={() => setIsZoomed(false)}
                    >
                      {t('media.escToClose')}
                    </button>
                    {hasExternalLink && (
                      <a
                        href={externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95"
                        style={{ backgroundColor: accentColor, color: isDarkColor(accentColor) ? 'white' : 'black' }}
                      >
                        {t('media.openOriginal')}
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export function CertificationBlock({ data, accentColor }: { data: CertificationBlockData; accentColor: string }) {
  return (
    <motion.div className="huevsite-block block-certification h-full flex flex-col justify-between group overflow-hidden relative" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Decorative background element */}
      <div
        className="absolute -right-6 -top-6 w-24 h-24 opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-500"
        style={{ backgroundColor: accentColor }}
      />

      <div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center border bg-black/40 backdrop-blur-sm"
            style={{ borderColor: `${accentColor}40`, color: accentColor }}
          >
            {data.icon ? (
              <img src={data.icon} alt={data.issuer} className="w-6 h-6 object-contain" />
            ) : (
              <Award size={20} />
            )}
          </div>
          {data.link && (
            <a
              href={data.link}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: accentColor }}
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>

        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight mb-2 group-hover:text-[var(--accent)] transition-colors relative z-10" style={{ '--accent': accentColor } as any}>
          {data.name}
        </h3>

        <div className="flex items-center gap-2 mb-1 relative z-10">
          <span className="text-sm font-medium text-white/90">{data.issuer}</span>
        </div>
      </div>

      <div className="text-xs font-mono text-[var(--text-muted)] mt-4 pt-4 border-t border-[var(--border)] relative z-10">
        {data.date}
      </div>
    </motion.div>
  );
}

export function AchievementBlock({ data, accentColor }: { data: AchievementBlockData; accentColor: string }) {
  return (
    <motion.div className="huevsite-block block-achievement h-full relative group border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors overflow-hidden">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-center gap-3 mb-3 relative z-10">
        <Trophy size={18} style={{ color: accentColor }} />
        <h3 className="text-lg font-bold text-white tracking-tight">
          {data.title}
        </h3>
      </div>

      <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-4 relative z-10">
        {data.description}
      </p>

      {data.date && (
        <div className="text-xs font-mono px-2 py-1 rounded inline-block relative z-10" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
          {data.date}
        </div>
      )}
    </motion.div>
  );
}

export function CustomBlock({ data, accentColor }: { data: CustomBlockData; accentColor: string }) {
  const t = useTranslations('blocks');
  return (
    <motion.div className="huevsite-block block-custom h-full flex flex-col group relative overflow-hidden bg-gradient-to-b from-[var(--surface)] to-black/40">
      <div className="block-label mb-3 uppercase tracking-widest text-[10px] font-bold relative z-10" style={{ color: accentColor }}>
        // {data.label}
      </div>

      <div className="flex-1 relative z-10">
        <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2 leading-tight">
          {data.title}
        </h3>
        <p className="text-xs md:text-sm text-[var(--text-dim)] leading-relaxed">
          {data.description}
        </p>
      </div>

      {data.link && (
        <div className="mt-6 pt-4 border-t border-[var(--border)] relative z-10">
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: accentColor }}
          >
            {t('custom.seeMore')} <ExternalLink size={14} />
          </a>
        </div>
      )}
    </motion.div>
  );
}

export function CollabBlock({ data, accentColor }: { data: CollabBlockData; accentColor: string }) {
  return (
    <motion.div className="huevsite-block block-collab h-full flex flex-col group relative overflow-hidden bg-[var(--surface)]">
      <div className="block-label mb-4 uppercase tracking-widest text-[10px] font-bold" style={{ color: accentColor }}>
        // TRABAJO CON...
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2 cursor-ns-resize">
        {data.users.map((user, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface2)] border border-[var(--border)] group-hover:border-[var(--border-bright)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center font-bold text-sm border" style={{ borderColor: `${accentColor}40`, color: accentColor }}>
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm">@{user.username}</span>
                <span className="text-xs text-[var(--text-muted)] font-mono">{user.role}</span>
              </div>
            </div>
            <a href={`/${user.username}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-black/20 text-[var(--text-muted)] hover:text-white transition-colors" style={{ color: accentColor }}>
              <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function EcosystemBlock({ 
  data, 
  accentColor, 
  subSites = [],
  username,
  isCustomDomain = false
}: { 
  data: EcosystemBlockData; 
  accentColor: string; 
  subSites: any[];
  username?: string;
  isCustomDomain?: boolean;
}) {
  const t = useTranslations('blocks');
  return (
    <motion.div
      className="huevsite-block block-ecosystem h-full flex flex-col group relative overflow-hidden bg-gradient-to-br from-[var(--surface)] to-black/20"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Premium background glow */}
      <div 
        className="absolute -right-20 -top-20 w-64 h-64 opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-[80px] transition-opacity duration-1000"
        style={{ backgroundColor: accentColor }}
      />
      
      <div className="flex items-center justify-between mb-5 relative z-10 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[var(--accent)]/30 transition-colors">
            <Globe size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-all duration-500" style={{ '--accent': accentColor } as any} />
          </div>
          <div>
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] group-hover:text-white transition-colors">
              {data.title || t('ecosystem.fallbackTitle')}
            </h3>
            <div className="h-0.5 w-4 bg-[var(--accent)]/40 mt-1 group-hover:w-full transition-all duration-700" style={{ '--accent': accentColor } as any} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" style={{ '--accent': accentColor } as any} />
          <div className="text-[9px] text-[var(--text-dim)] font-mono uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/10 group-hover:border-[var(--accent)]/20 transition-colors">
            {t('ecosystem.projectCount', { count: subSites.length })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {subSites.map((site: any) => {
          const siteUrl = isCustomDomain ? `/${site.slug}` : `/${username}/${site.slug}`;
          return (
            <Link
              key={site.id}
              href={siteUrl}
              className="group/item flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/[0.08] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-500 text-left relative overflow-hidden"
              style={{ '--accent': accentColor } as any}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)]/10 blur-[20px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
              
              <div className="relative shrink-0">
                {site.avatarUrl ? (
                  <img src={site.avatarUrl} alt={site.title} className="w-10 h-10 rounded-xl object-cover bg-black border border-white/10 shadow-sm relative z-10 group-hover/item:scale-105 transition-transform" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-[var(--text-muted)] text-[10px] font-black uppercase tracking-wider relative z-10 shadow-sm group-hover/item:text-[var(--accent)] transition-colors">
                    {site.title.substring(0, 2)}
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1 relative z-10 justify-center">
                <span className="text-[13px] font-bold text-white group-hover/item:text-[var(--accent)] transition-colors truncate w-full leading-tight mb-0.5">
                  {site.title}
                </span>
                {site.description && (
                  <span className="text-[10px] text-[var(--text-muted)] truncate w-full group-hover/item:text-[var(--text-dim)] transition-colors leading-tight block">
                    {site.description}
                  </span>
                )}
              </div>
              
              <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover/item:bg-[var(--accent)] group-hover/item:border-[var(--accent)] group-hover/item:text-black transition-all duration-300 relative z-10 shadow-sm">
                 <ArrowUpRight size={12} className="opacity-0 group-hover/item:opacity-100 transition-all transform scale-50 group-hover/item:scale-100" />
              </div>
            </Link>
          );
        })}
        {subSites.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-10 opacity-40 group-hover:opacity-60 transition-opacity">
            <Globe size={24} className="mb-2" />
            <div className="text-[10px] font-mono uppercase tracking-widest">{t('ecosystem.noLinked')}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
