"use client";

import { motion } from "framer-motion";
import { StackBlockData, CommunityBlockData, WritingBlockData } from "@/lib/profile-types";

export function StackBlock({ data, accentColor }: { data: StackBlockData; accentColor: string }) {
  const items = data.items || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-block block-stack h-full flex flex-col justify-between"
    >
      <div className="block-label opacity-40 uppercase tracking-[0.2em] text-[10px] mb-6">Tech Stack</div>
      <div className="flex flex-wrap gap-2.5 mt-auto">
        {items.length > 0 ? (
          items.map((item, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-white/[0.03] border border-white/5 text-white/70 hover:text-white hover:border-white/20 transition-all cursor-default"
              title={item}
            >
              {item}
            </div>
          ))
        ) : (
          <div className="text-[var(--text-dim)] text-xs opacity-40 italic">// vacuum detected</div>
        )}
      </div>
      
      {/* Subtle Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] opacity-20" style={{ background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)` }} />
    </motion.div>
  );
}

export function CommunityBlock({ data, accentColor }: { data: CommunityBlockData; accentColor: string }) {
  const communities = data.communities || [];

  const formatUrl = (url?: string) => {
    if (!url) return "#";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-block block-community h-full group flex flex-col justify-between"
    >
      <div className="block-label opacity-40 uppercase tracking-[0.2em] text-[10px] mb-6">Comunidades</div>
      <div className="flex flex-wrap gap-3 mt-auto">
        {communities.length > 0 ? (
          communities.map((comm, i) => {
            const commColor = comm.color || accentColor;
            const hasLink = comm.link && comm.link !== "#";
            const Component = hasLink ? 'a' : 'span';
            return (
              <Component 
                key={i}
                href={hasLink ? formatUrl(comm.link) : undefined}
                target={hasLink ? "_blank" : undefined}
                rel={hasLink ? "noopener noreferrer" : undefined}
                className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${hasLink ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ 
                  backgroundColor: `${commColor}05`, 
                  borderColor: `${commColor}20`, 
                  color: commColor,
                  boxShadow: `inset 0 0 15px ${commColor}05`,
                  textShadow: `0 0 10px ${commColor}20`
                }}
              >
                {comm.name}
              </Component>
            );
          })
        ) : (
          <div className="text-[var(--text-dim)] text-xs opacity-40 italic">// waiting for tribe</div>
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
      <div className="block-label opacity-40 uppercase tracking-[0.2em] text-[10px] mb-4">Writing</div>
      <div className="writing-posts relative z-20">
        {posts.length > 0 ? (
          posts.map((post, i) => {
            const validUrl = getValidUrl(post.link);
            const isClickable = validUrl !== "#";
            return (
              <a
                key={i}
                href={validUrl}
                className="writing-post block cursor-pointer transition-colors p-3 hover:bg-white/5 rounded-xl border-l-2 mb-2"
                style={{ borderLeftColor: accentColor }}
                target={isClickable ? "_blank" : undefined}
                rel={isClickable ? "noopener noreferrer" : undefined}
              >
                <div className="wp-title font-bold text-white mb-1">{post.title || "Sin título"}</div>
                <div className="wp-meta text-xs text-[var(--text-dim)] opacity-60">{post.date || "Sin fecha"} · leer más</div>
              </a>
            );
          })
        ) : (
          <div className="text-[var(--text-dim)] text-xs opacity-40 italic">// silence in archives</div>
        )}
      </div>
    </motion.div>
  );
}
