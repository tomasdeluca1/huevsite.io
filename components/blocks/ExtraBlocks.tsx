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
  const name = data.name || "Comunidad";

  return (
    <motion.div className="bento-block block-community h-full">
      <div className="block-label">Comunidades</div>
      <div className="community-badges">
        <span className="comm-badge" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}>
          {name}
        </span>
      </div>
    </motion.div>
  );
}

export function WritingBlock({ data, accentColor }: { data: WritingBlockData; accentColor: string }) {
  const posts = data.posts || [];

  return (
    <motion.div className="bento-block block-writing h-full">
      <div className="block-label">Writing</div>
      <div className="writing-posts">
        {posts.length > 0 ? (
          posts.map((post, i) => (
            <a key={i} href={post.link || "#"} className="writing-post" style={{ borderLeftColor: accentColor }} target={post.link ? "_blank" : undefined} rel={post.link ? "noopener noreferrer" : undefined}>
              <div className="wp-title">{post.title || "Sin título"}</div>
              <div className="wp-meta">{post.date || "Sin fecha"} · click para leer</div>
            </a>
          ))
        ) : (
          <div className="text-[var(--text-dim)] text-xs">No hay artículos agregados</div>
        )}
      </div>
    </motion.div>
  );
}
