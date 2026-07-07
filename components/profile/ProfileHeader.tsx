"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, ArrowUpRight, Share2 } from "lucide-react";
import { BlockData } from "@/lib/profile-types";
import { ShareProfileModal } from "@/components/share/ShareProfileModal";

interface Props {
  accentColor: string;
  currentUserId?: string | null;
  subscriptionTier?: string;
  username: string;
  subSites?: { id: string; title: string; slug: string; description?: string; avatarUrl?: string }[];
  blocks?: BlockData[];
  isCustomDomain?: boolean;
  borderRadius?: string;
  /** Embed chrome-less (iframe en nordelta.tech): oculta la barra superior. */
  embed?: boolean;
}

/**
 * Chrome superior del perfil: barra (logo + explorar + compartir + CTA) y, para
 * Pro con sub-sites, el panel "Ecosistema". Las stats sociales + Seguir/Nominar
 * viven ahora en ProfileSocialBar (se reordena debajo del board en mobile).
 */
export function ProfileHeader({
  accentColor,
  currentUserId,
  subscriptionTier,
  subSites = [],
  blocks = [],
  username,
  isCustomDomain = false,
  borderRadius = "1.5rem",
  embed = false,
}: Props) {
  const [isShareOpen, setIsShareOpen] = useState(false);

  const ecosystemBlock = blocks.find(b => b.type === 'ecosystem' && b.visible) as any;
  const hideHeaderEcosystem = ecosystemBlock?.hideHeaderEcosystem;

  return (
    <header className={`relative z-[100] ${embed ? "mb-0" : "mb-6 md:mb-10"}`}>
      {/* Upper bar: Logo + Explore Link + Main CTA — oculto en embed */}
      {!isCustomDomain && !embed && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="logo shrink-0 text-xl md:text-2xl">
              huev<span>site</span>.io
            </Link>
            <Link
              href="/explore"
              className="hidden sm:flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              ← Explorar
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-2 !text-[10px] md:!text-xs !py-2 md:!py-3 !px-3 md:!px-4 rounded-xl md:!rounded-2xl border border-white/5 bg-white/5 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all text-white/70 hover:text-white font-bold"
              aria-label="Compartir este huevsite"
            >
              <Share2 size={14} className="text-[var(--accent)]" />
              <span className="hidden sm:inline uppercase tracking-widest">Compartir</span>
            </button>

            {currentUserId ? (
              <Link
                href="/dashboard"
                className="btn btn-ghost !text-[10px] !py-2 !px-4 !rounded-xl border border-white/5 bg-white/5 md:hidden transition-all hover:bg-white/10"
              >
                Mi huevsite
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn btn-ghost !text-[10px] !py-2 !px-4 !rounded-xl border border-white/5 bg-white/5 md:hidden transition-all hover:bg-white/10"
              >
                Crear mi huevsite
              </Link>
            )}

            <div className="hidden md:block">
              {currentUserId ? (
                <Link
                  href="/dashboard"
                  className="btn btn-ghost !px-5 !text-xs !py-3 !rounded-2xl hover:!border-[var(--accent)] transition-all bg-white/5 border border-white/5"
                >
                  Mi huevsite
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="btn btn-ghost !px-5 !text-xs !py-3 !rounded-2xl hover:!border-[var(--accent)] transition-all bg-white/5 border border-white/5"
                >
                  Crear mi huevsite
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {subscriptionTier === "pro" && subSites.length > 0 && !hideHeaderEcosystem && (
        <div className="mt-8 md:mt-12 backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] p-5 sm:p-6 overflow-hidden relative group" style={{ borderRadius: `calc(${borderRadius} + 0.5rem)` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none" />

          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Globe size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] group-hover:text-white transition-colors">Ecosistema</h3>
            </div>
            <div className="text-[9px] text-[var(--text-dim)] font-mono uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">
              {subSites.length} {subSites.length === 1 ? "Proyecto" : "Proyectos"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 relative z-10">
            {subSites.map((site) => (
              <Link
                key={site.id}
                href={isCustomDomain ? `/${site.slug}` : `/${username}/${site.slug}`}
                className="group/item flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/[0.08] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 hover:shadow-[0_8px_32px_-12px_var(--accent-dim)] transition-all duration-300 text-left relative overflow-hidden"
              >
                {/* Micro-gradient strictly inside the item */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/20 blur-[30px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />

                {site.avatarUrl ? (
                  <img src={site.avatarUrl} alt={site.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-black border border-white/10 shadow-sm relative z-10" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-wider relative z-10 shadow-sm">
                    {site.title.substring(0, 2)}
                  </div>
                )}

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="text-[13px] font-black text-white truncate group-hover/item:text-[var(--accent)] transition-colors tracking-tight">{site.title}</div>
                  {site.description && <div className="text-[10px] text-[var(--text-muted)] truncate mt-1 max-w-[90%]">{site.description}</div>}
                </div>

                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover/item:bg-[var(--accent)] group-hover/item:border-[var(--accent)] group-hover/item:text-black transition-all duration-300 relative z-10">
                   <ArrowUpRight size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ShareProfileModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        username={username}
        accentColor={accentColor}
      />
    </header>
  );
}
