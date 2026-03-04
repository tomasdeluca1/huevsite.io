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
      className={`huevsite-block block-hero h-full flex group overflow-hidden ${rowSpan === 1 ? 'flex-col sm:flex-row items-center gap-4 md:gap-6 py-5 px-6' : 'flex-col justify-between p-6 md:p-8'}`}
      style={{
        '--accent': accentColor,
      } as any}
    >
      <div className={`relative z-10 flex items-center w-full ${rowSpan === 1 ? 'flex-row gap-4 md:gap-6' : 'flex-col h-full justify-between'}`}>
        <div className={rowSpan === 1 ? 'shrink-0' : ''}>
          <div className={`flex items-start justify-between ${rowSpan === 1 ? 'mb-0' : 'mb-4'}`}>
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-40 transition-opacity group-hover:opacity-60"
                style={{ backgroundColor: accentColor }}
              />
              <div className={`${rowSpan === 1 ? 'w-12 h-12 md:w-16 md:h-16 text-lg' : 'w-20 h-20 text-2xl'} hero-avatar border-2 border-white/10 shadow-xl rounded-full flex items-center justify-center font-black text-black`} style={{ background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}, #00FF88)` }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}
                <div className={`${rowSpan === 1 ? 'w-3 h-3 md:w-4 md:h-4' : 'w-4 h-4 md:w-5 md:h-5'} hero-status shadow-lg`} />
              </div>
            </div>
          </div>
        </div>

        <div className={`flex flex-col min-w-0 ${rowSpan === 1 ? 'flex-1' : 'flex-1 w-full items-center text-center'}`}>
          <div className={rowSpan === 1 ? 'flex flex-wrap items-baseline gap-2 md:gap-3' : 'flex flex-col items-center'}>
            <h1 className={`${rowSpan === 1 ? 'text-lg md:text-xl' : 'text-3xl'} hero-name text-white font-extrabold tracking-tighter leading-tight`}>
              {name}
            </h1>
            <div className="hero-role text-[9px] md:text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest opacity-60">
              // {roles.length > 0 ? roles.join(', ') : 'builder'}
            </div>
          </div>

          <div className={`${rowSpan === 1 ? 'text-xs md:text-sm mt-0.5' : 'text-base md:text-lg mt-2'} hero-tagline text-[var(--text-dim)] font-medium leading-[1.3] md:leading-relaxed`}>
            {tagline}
          </div>

          {rowSpan !== 1 && (
            <div className="hero-tags mt-auto pt-6 flex flex-wrap gap-2 justify-center">
              {status && (
                <span className="tag accent flex items-center gap-1.5 bg-[var(--accent-dim)] border border-[var(--accent-mid)] text-[var(--accent)] text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {status}
                </span>
              )}
              {location && (
                <span className="tag bg-white/5 border border-white/10 text-[var(--text-muted)] text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {location}
                </span>
              )}
            </div>
          )}
        </div>

        {rowSpan === 1 && (status || location) && (
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-right ml-4">
            {status && (
              <span className="text-[9px] md:text-[10px] font-bold flex items-center gap-1.5 text-blue-400 whitespace-nowrap">
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {status}
              </span>
            )}
            {location && <span className="text-[9px] md:text-[10px] text-[var(--text-muted)] font-mono whitespace-nowrap">{location}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
