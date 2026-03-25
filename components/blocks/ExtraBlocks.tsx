"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { StackBlockData, CommunityBlockData, WritingBlockData } from "@/lib/profile-types";
import { useBlockPreview } from "@/lib/block-preview-context";

export function StackBlock({ data, accentColor }: { data: StackBlockData; accentColor: string }) {
  const items = data.items || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="huevsite-block block-stack h-full flex flex-col justify-between"
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
      className="huevsite-block block-community h-full group flex flex-col justify-between"
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
  const isPreview = useBlockPreview();
  const [readingPost, setReadingPost] = useState<any | null>(null);
  const posts = data.posts || [];

  const getValidUrl = (url?: string) => {
    if (!url || url === "#") return "#";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  return (
    <>
      <motion.div className="huevsite-block block-writing h-full flex flex-col group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="block-label opacity-40 uppercase tracking-[0.2em] text-[10px] mb-6 flex justify-between items-center relative z-20">
          <span>Writing / Blog</span>
          {posts.length > 0 && <span className="text-[var(--text-muted)] font-mono">{posts.length} posts</span>}
        </div>

        <div className="writing-posts relative z-20 flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
          {posts.length > 0 ? (
            posts.map((post, i) => {
              const hasInternalContent = !!post.content;
              const validUrl = getValidUrl(post.link);
              const isClickable = validUrl !== "#" || hasInternalContent;

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (isPreview) return;
                    if (hasInternalContent) setReadingPost(post);
                    else if (validUrl !== "#") window.open(validUrl, '_blank');
                  }}
                  className="writing-post block transition-all p-4 hover:bg-white/[0.03] rounded-2xl border border-transparent hover:border-white/5 mb-3 group/post"
                  style={{ cursor: isPreview ? 'default' : 'pointer' }}
                >
                  <div className="flex flex-col gap-1.5">
                    <h4 className="wp-title font-bold text-white leading-snug group-hover/post:text-[var(--accent)] transition-colors" style={{ '--accent': accentColor } as any}>
                      {post.title || "Untitled thoughts"}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-60 uppercase">{post.date || "Just now"}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider opacity-60 group-hover/post:opacity-100 transition-opacity" style={{ color: accentColor }}>
                        {hasInternalContent ? 'Leer interna' : 'Externo'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-40 italic text-center text-xs px-8 leading-relaxed">
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mb-4 not-italic font-bold">W</div>
              Nothin' written yet. Silence is golden.
            </div>
          )}
        </div>
      </motion.div>

      {/* Reader Modal Overlay */}
      {readingPost && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-[var(--surface)] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col p-8 md:p-12 overflow-hidden overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setReadingPost(null)}
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-white"
            >
              esc
            </button>

            <div className="space-y-8 pt-12 md:pt-0">
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--accent)] font-bold" style={{ color: accentColor }}>{readingPost.date}</div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-gradient">{readingPost.title}</h2>
              </div>

              <div className="prose prose-invert max-w-none text-[var(--text-dim)] text-lg leading-relaxed font-medium whitespace-pre-wrap">
                {readingPost.content}
              </div>

              <div className="pt-12 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/5 flex items-center justify-center font-bold text-[var(--accent)]" style={{ color: accentColor }}>H</div>
                  <div className="text-xs font-bold text-white opacity-40 uppercase tracking-widest">Publicado en Huevsite.io</div>
                </div>
                {readingPost.link && readingPost.link !== "#" && (
                  <a href={getValidUrl(readingPost.link)} target="_blank" className="text-xs font-bold uppercase tracking-widest hover:text-white transition-colors" style={{ color: accentColor }}>
                    Ver fuente →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
