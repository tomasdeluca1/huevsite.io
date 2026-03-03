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
      className="huevsite-block block-hero h-full flex flex-col justify-between group overflow-visible"
      style={{
        '--accent': accentColor,
      } as any}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-40 transition-opacity group-hover:opacity-60"
                style={{ backgroundColor: accentColor }}
              />
              <div className="hero-avatar border-2 border-white/10 shadow-xl" style={{ background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}, #00FF88)` }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}
                <div className="hero-status shadow-lg" />
              </div>
            </div>
          </div>

          <h1 className="hero-name text-white">
            {name}
          </h1>
          <div className="hero-role">
            // {roles.length > 0 ? roles.join(', ') : 'builder'}
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <div className="hero-tagline">
            {tagline}
          </div>

          <div className="hero-tags mt-auto pt-2">
            {status && (
              <span className="tag accent flex items-center gap-1.5" style={{ color: accentColor }}>
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {status}
              </span>
            )}
            {location && (
              <span className="tag">
                {location}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
