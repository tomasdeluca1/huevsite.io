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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-block block-hero h-full flex flex-col justify-between"
      style={{ '--accent': accentColor } as any}
    >
      <div>
        <div className="hero-avatar" style={{ background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}, #00FF88)` }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full border border-[var(--border)]" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
          <div className="hero-status"></div>
        </div>
        <div className="hero-name">{name}</div>
        <div className="hero-role">
          // {tagline}
        </div>
      </div>
      <div className="mt-4">
        {data.description && <p className="hero-tagline">{data.description}</p>}
        <div className="hero-tags mt-auto pt-4">
          {status && (
            <span className="tag accent" style={{ background: `${accentColor}20`, borderColor: `${accentColor}40`, color: accentColor }}>
              {status}
            </span>
          )}
          {location && <span className="tag">{location}</span>}
        </div>
      </div>
    </motion.div>
  );
}
