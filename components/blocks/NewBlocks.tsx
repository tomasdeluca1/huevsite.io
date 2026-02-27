"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MediaBlockData,
  CertificationBlockData,
  AchievementBlockData,
  CustomBlockData,
  isDarkColor
} from "@/lib/profile-types";
import { ExternalLink, Award, Trophy, Star, Sparkles } from "lucide-react";

import { useEffect } from "react";

export function MediaBlock({ data, accentColor }: { data: MediaBlockData; accentColor: string }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const isDirectVideo = data.url.match(/\.(mp4|webm|ogg)$/i);
  const isYouTube = data.url.includes("youtube.com") || data.url.includes("youtu.be");
  const isVimeo = data.url.includes("vimeo.com");
  const isVideo = isDirectVideo || isYouTube || isVimeo;
  
  const isExternal = !data.url.includes('supabase.co') && !data.url.startsWith('/storage');

  // Lock scroll when zoomed
  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isZoomed]);

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
        className="bento-block block-media h-full p-0 overflow-hidden relative group cursor-zoom-in border"
        style={{ borderColor: isDarkColor(accentColor) ? 'rgba(255,255,255,0.1)' : 'var(--border)' }}
        onClick={() => setIsZoomed(true)}
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
            <Sparkles size={16} style={{ color: accentColor }} />
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

      {/* Lightbox Modal */}
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

                {/* Overlay link button inside media if external */}
                {isExternal && (
                  <a 
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-6 right-6 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black transition-all flex items-center gap-2 font-bold text-sm shadow-xl"
                  >
                    Visitar enlace <ExternalLink size={16} />
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
                    Esc para cerrar
                  </button>
                  {isExternal && (
                    <a 
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95"
                      style={{ backgroundColor: accentColor, color: isDarkColor(accentColor) ? 'white' : 'black' }}
                    >
                      Abrir original
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function CertificationBlock({ data, accentColor }: { data: CertificationBlockData; accentColor: string }) {
  return (
    <motion.div className="bento-block block-certification h-full flex flex-col justify-between group overflow-hidden relative" style={{ backgroundColor: 'var(--surface)'}}>
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
        
        <h3 className="text-xl font-bold text-white tracking-tight leading-tight mb-2 group-hover:text-[var(--accent)] transition-colors relative z-10" style={{ '--accent': accentColor } as any}>
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
    <motion.div className="bento-block block-achievement h-full relative group p-6 border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors overflow-hidden">
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
  return (
    <motion.div className="bento-block block-custom h-full flex flex-col group relative overflow-hidden bg-gradient-to-b from-[var(--surface)] to-black/40 p-6">
      <div className="block-label mb-3 uppercase tracking-widest text-[10px] font-bold relative z-10" style={{ color: accentColor }}>
        // {data.label}
      </div>
      
      <div className="flex-1 relative z-10">
        <h3 className="text-2xl font-black text-white tracking-tight mb-3">
          {data.title}
        </h3>
        <p className="text-sm text-[var(--text-dim)] leading-relaxed">
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
            Ver más <ExternalLink size={14} />
          </a>
        </div>
      )}
    </motion.div>
  );
}
