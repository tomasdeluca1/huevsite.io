"use client";

import { motion } from "framer-motion";
import { HeroBlockData } from "@/lib/profile-types";

interface Props {
  data: HeroBlockData;
  accentColor: string;
}

export function HeroBlock({ data, accentColor }: Props) {
  const roles = data.roles || [];
  const name = data.name || "Usuario";
  const tagline = data.tagline || "Builder en huevsite.io";
  const status = data.status || "";
  const location = data.location || "";
  const avatarUrl = data.avatarUrl || "";
  const rowSpan = (data as any).row_span || 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="huevsite-block block-hero h-full flex flex-col group overflow-hidden p-6 md:p-8"
      style={{
        '--accent': accentColor,
      } as any}
    >
      <div className="flex flex-col h-full w-full">
        {/* ROW 1: Imagen y Nombre */}
        <div className="flex items-start gap-5">
          <div className="shrink-0 relative">
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-30 transition-opacity group-hover:opacity-50"
              style={{ backgroundColor: accentColor }}
            />
            <div
              className="hero-avatar w-16 h-16 md:w-20 md:h-20 border-2 border-white/10 shadow-xl rounded-full flex items-center justify-center font-black text-black overflow-hidden relative z-10"
              style={{ background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}, #00FF88)` }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl md:text-2xl">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {/* Status dot */}
            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#121212] bg-[#00FF88] z-20 shadow-lg" />
          </div>

          <div className="flex flex-col min-w-0 pt-1 md:pt-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-[1.1] break-words">
              {name}
            </h1>
            {/* TAGLINE: Justo debajo del nombre */}
            <p className="mt-1 text-sm md:text-base text-[var(--accent)] font-mono opacity-80 break-words">
              {tagline}
            </p>
          </div>
        </div>

        {/* ROW 2: Descripción (con un espacio según el diagrama) */}
        <div className="mt-6 flex-1 min-w-0">
          {data.description && (
            <p className="text-sm md:text-base text-[var(--text-dim)] leading-relaxed break-words font-medium">
              {data.description}
            </p>
          )}
        </div>

        {/* ROW 3: Estado y Lugar */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/5">
          {status && (
            <span className="tag accent flex items-center gap-1.5 bg-[var(--accent-dim)] border border-[var(--accent-mid)] text-[var(--accent)] text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {status}
            </span>
          )}
          {location && (
            <span className="tag bg-white/5 border border-white/10 text-[var(--text-muted)] text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
              {location}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
