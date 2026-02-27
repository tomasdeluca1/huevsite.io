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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-block block-hero h-full flex flex-col justify-between group overflow-visible"
      style={{ 
        '--accent': accentColor,
        background: `linear-gradient(145deg, rgba(20,20,20,0.6) 0%, rgba(10,10,10,0.8) 100%)`
      } as any}
    >
      {/* Background Glow */}
      <div 
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-125"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-40 transition-opacity group-hover:opacity-60"
              style={{ backgroundColor: accentColor }}
            />
            <div className="hero-avatar relative w-24 h-24 md:w-28 md:h-28 border-2 border-white/10 shadow-2xl" style={{ background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}, #00FF88)` }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-4xl">{name.charAt(0).toUpperCase()}</span>
              )}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#00C853] rounded-full border-4 border-[#111] shadow-lg" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white title-tracking leading-none mb-3">
          {name}
        </h1>
        <div className="text-base font-mono text-[var(--text-muted)] opacity-80 mb-6">
          // {tagline}
        </div>
      </div>

      <div className="relative z-10">
        {data.description && (
          <p className="text-lg text-[var(--white)] font-medium leading-relaxed mb-8 max-w-[90%] opacity-90">
            {data.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 pt-4">
          {status && (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-[var(--accent)]/30 bg-[var(--accent)]/10" style={{ color: accentColor }}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {status}
            </span>
          )}
          {location && (
            <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/50">
              {location}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
