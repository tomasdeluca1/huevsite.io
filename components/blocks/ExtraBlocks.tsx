"use client";

import { motion } from "framer-motion";
import { StackBlockData, CommunityBlockData, WritingBlockData } from "@/lib/profile-types";

export function StackBlock({ data, accentColor }: { data: StackBlockData; accentColor: string }) {
  const items = data.items || [];

  return (
    <motion.div className="bento-block block-stack h-full">
      <div className="block-label">Stack</div>
      <div className="flex flex-wrap gap-2 mt-4">
        {items.length > 0 ? (
          items.map((item, i) => (
            <div
              key={i}
              className="px-3 py-1.5 rounded-full text-xs font-mono font-medium border border-[var(--border-bright)] bg-black/20 text-white truncate"
              title={item}
              style={{ borderColor: i % 2 === 0 ? `${accentColor}40` : undefined }}
            >
              {item}
            </div>
          ))
        ) : (
          <div className="text-[var(--text-dim)] text-xs">No hay tecnologías agregadas</div>
        )}
      </div>
    </motion.div>
  );
}

export function CommunityBlock({ data, accentColor }: { data: CommunityBlockData; accentColor: string }) {
  const communities = data.communities || [];

  return (
    <motion.div className="bento-block block-community h-full group">
      <div className="block-label mb-4 uppercase tracking-[0.2em]">COMUNIDADES</div>
      <div className="flex flex-wrap gap-2.5">
        {communities.length > 0 ? (
          communities.map((comm, i) => {
            const commColor = comm.color || accentColor;
            return (
              <span 
                key={i}
                className="px-4 py-2 rounded-[0.9rem] text-xs font-semibold tracking-wide border transition-all"
                style={{ 
                  backgroundColor: `${commColor}08`, 
                  borderColor: `${commColor}40`, 
                  color: commColor,
                  boxShadow: `inset 0 0 10px ${commColor}05`
                }}
              >
                {comm.name}
              </span>
            );
          })
        ) : (
          <div className="text-[var(--text-dim)] text-xs">No hay comunidades agregadas</div>
        )}
      </div>
    </motion.div>
  );
}

export function WritingBlock({ data, accentColor }: { data: WritingBlockData; accentColor: string }) {
  const posts = data.posts || [];

  const getValidUrl = (url?: string) => {
    if (!url || url === "#") return "#";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  return (
    <motion.div className="bento-block block-writing h-full">
      <div className="block-label">Writing</div>
      <div className="writing-posts relative z-20">
        {posts.length > 0 ? (
          posts.map((post, i) => {
            const validUrl = getValidUrl(post.link);
            const isClickable = validUrl !== "#";
            return (
              <a
                key={i}
                href={validUrl}
                className="writing-post block cursor-pointer transition-colors"
                style={{ borderLeftColor: accentColor }}
                target={isClickable ? "_blank" : undefined}
                rel={isClickable ? "noopener noreferrer" : undefined}
              >
                <div className="wp-title">{post.title || "Sin título"}</div>
                <div className="wp-meta">{post.date || "Sin fecha"} · click para leer</div>
              </a>
            );
          })
        ) : (
          <div className="text-[var(--text-dim)] text-xs">No hay artículos agregados</div>
        )}
      </div>
    </motion.div>
  );
}
