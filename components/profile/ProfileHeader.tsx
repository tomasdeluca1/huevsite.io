"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FollowButton } from "@/components/social/FollowButton";
import { NominateButton } from "@/components/social/NominateButton";
import { FollowListModal } from "@/components/social/FollowListModal";

import { ScoreInfoModal } from "@/components/social/ScoreInfoModal";
import { BadgeCheck, Globe, ChevronDown, ArrowUpRight } from "lucide-react";

interface Props {
  profileId?: string;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  nominationsCount: number;
  builderScore: number;
  accentColor: string;
  showFollowButton: boolean;
  currentUserId?: string | null;
  isEnabledSocialNetwork?: boolean;
  subscriptionTier?: string;
  subSites?: { id: string; title: string; slug: string; description?: string; avatarUrl?: string }[];
  username: string;
  isCustomDomain?: boolean;
}

export function ProfileHeader({
  profileId,
  isFollowing,
  followersCount,
  followingCount,
  nominationsCount,
  builderScore,
  accentColor,
  showFollowButton,
  currentUserId,
  isEnabledSocialNetwork,
  subscriptionTier,
  subSites = [],
  username,
  isCustomDomain = false,
}: Props) {
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);
  const [localFollowersCount, setLocalFollowersCount] = useState(followersCount);
  const [localNominationsCount, setLocalNominationsCount] = useState(nominationsCount);
  const [isScoreOpen, setIsScoreOpen] = useState(false);

  // Sync props to state
  useEffect(() => {
    setLocalFollowersCount(followersCount);
    setLocalNominationsCount(nominationsCount);
  }, [followersCount, nominationsCount]);

  // Scroll lock when modal is open
  useEffect(() => {
    if (modalType || isScoreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalType, isScoreOpen]);

  const handleFollowChange = (nowFollowing: boolean) => {
    setLocalFollowersCount((prev: number) => (nowFollowing ? prev + 1 : prev - 1));
  };

  const handleNominateChange = (nowNominated: boolean) => {
    setLocalNominationsCount((prev: number) => (nowNominated ? prev + 1 : prev - 1));
  };

  return (
    <header className="relative z-[100] mb-8 md:mb-12">
      {/* Upper bar: Logo + Explore Link + Main CTA */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {!isCustomDomain && (
            <>
              <Link href="/" className="logo shrink-0 text-xl md:text-2xl">
                huev<span>site</span>.io
              </Link>
              <Link
                href="/explore"
                className="hidden sm:flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                ← Explorar
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCustomDomain && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Stats and Social Actions Bar */}
      <div className="huevsite-block !p-3 sm:!p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 !rounded-[2.5rem]">
        {isEnabledSocialNetwork && profileId && (
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2 w-full lg:w-auto">
            <button
              onClick={() => setModalType("followers")}
              className="flex flex-col items-center px-2 py-3 sm:px-5 sm:py-2.5 rounded-2xl bg-white/5 border border-white/5 sm:bg-transparent sm:border-transparent hover:bg-white/5 transition-all group shrink-0 hover:border-white/5"
            >
              <span className="font-mono font-bold text-white text-base sm:text-lg leading-tight group-hover:scale-110 transition-transform">
                {localFollowersCount || 0}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black">
                Seguidores
              </span>
            </button>

            <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0" />

            <button
              onClick={() => setModalType("following")}
              className="flex flex-col items-center px-2 py-3 sm:px-5 sm:py-2.5 rounded-2xl bg-white/5 border border-white/5 sm:bg-transparent sm:border-transparent hover:bg-white/5 transition-all group shrink-0 hover:border-white/5"
            >
              <span className="font-mono font-bold text-white text-base sm:text-lg leading-tight group-hover:scale-110 transition-transform">
                {followingCount || 0}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black">
                Siguiendo
              </span>
            </button>

            <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0" />

            <div className="flex flex-col items-center px-2 py-3 sm:px-5 sm:py-2.5 rounded-2xl bg-white/5 border border-white/5 sm:bg-transparent sm:border-transparent shrink-0">
              <span className="font-mono font-bold text-white text-base sm:text-lg leading-tight">
                {localNominationsCount || 0}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black">
                Nominaciones
              </span>
            </div>

            <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0" />

            <button
              onClick={() => setIsScoreOpen(true)}
              className="flex flex-col items-center px-2 py-3 sm:px-5 sm:py-2.5 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 sm:bg-transparent sm:border-transparent group relative shrink-0 hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-all"
            >
              <span className="font-mono text-[var(--accent)] text-lg sm:text-xl leading-tight group-hover:scale-110 transition-transform font-black">
                {builderScore || 0}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black">
                Score 🔥
              </span>

              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-4 py-2 rounded-xl text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 pointer-events-none z-50 shadow-2xl">
                ¿Qué es esto?
              </div>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          {showFollowButton && profileId && (
            <div className="flex-1 lg:flex-none">
              <FollowButton
                profileId={profileId}
                initialIsFollowing={isFollowing}
                accentColor={accentColor}
                onToggle={handleFollowChange}
              />
            </div>
          )}

          {isEnabledSocialNetwork && profileId && currentUserId && currentUserId !== profileId && (
            <div className="flex-1 lg:flex-none">
              <NominateButton userId={profileId} accentColor={accentColor} onStatusChange={handleNominateChange} />
            </div>
          )}
        </div>
      </div>

      {profileId && (
        <FollowListModal
          isOpen={modalType !== null}
          onClose={() => setModalType(null)}
          userId={profileId}
          type={modalType || "followers"}
          accentColor={accentColor}
        />
      )}

      {subscriptionTier === "pro" && subSites.length > 0 && (
        <div className="mt-8 md:mt-12 backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-5 sm:p-6 overflow-hidden relative group">
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
            {subSites.map((site, index) => (
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

      <ScoreInfoModal isOpen={isScoreOpen} onClose={() => setIsScoreOpen(false)} accentColor={accentColor} profileId={profileId} />
    </header>
  );
}
