"use client";

import { useState, useEffect } from "react";
import { FollowButton } from "@/components/social/FollowButton";
import { NominateButton } from "@/components/social/NominateButton";
import { FollowListModal } from "@/components/social/FollowListModal";
import { ScoreInfoModal } from "@/components/social/ScoreInfoModal";

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
  /** Embed chrome-less (iframe en nordelta.tech): deja solo el score. */
  embed?: boolean;
  /** Clases extra para el contenedor raíz (spacing/order desde el padre). */
  className?: string;
}

/**
 * Stats sociales (Seguidores / Siguiendo / Nominaciones / Score) + acciones
 * (Seguir / Nominar). Extraído de ProfileHeader para poder reordenarlo en
 * mobile: en el teléfono aparece DEBAJO del board; en desktop se mantiene
 * arriba, justo debajo de la barra superior del header.
 */
export function ProfileSocialBar({
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
  embed = false,
  className = "",
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

  const shouldRender = embed
    ? isEnabledSocialNetwork && !!profileId
    : isEnabledSocialNetwork || showFollowButton;

  if (!shouldRender) return null;

  return (
    <div className={`relative z-[90] ${className}`}>
      <div className="overflow-visible px-3 sm:px-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        {isEnabledSocialNetwork && profileId && (
          <div className={embed ? "flex items-center justify-center w-full lg:w-auto" : "grid grid-cols-4 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full lg:w-auto"}>
            {!embed && (
            <>
            <button
              onClick={() => setModalType("followers")}
              className="flex flex-col items-center px-1 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-white/5 border border-white/5 sm:bg-transparent sm:border-transparent hover:bg-white/5 transition-all group shrink-0 hover:border-white/5"
            >
              <span className="font-mono font-bold text-white text-sm sm:text-lg leading-tight group-hover:scale-110 transition-transform">
                {localFollowersCount || 0}
              </span>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.2em] text-[var(--text-muted)] font-black">
                Seguidores
              </span>
            </button>

            <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0" />

            <button
              onClick={() => setModalType("following")}
              className="flex flex-col items-center px-1 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-white/5 border border-white/5 sm:bg-transparent sm:border-transparent hover:bg-white/5 transition-all group shrink-0 hover:border-white/5"
            >
              <span className="font-mono font-bold text-white text-sm sm:text-lg leading-tight group-hover:scale-110 transition-transform">
                {followingCount || 0}
              </span>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.2em] text-[var(--text-muted)] font-black">
                Siguiendo
              </span>
            </button>

            <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0" />

            <div className="flex flex-col items-center px-1 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-white/5 border border-white/5 sm:bg-transparent sm:border-transparent shrink-0">
              <span className="font-mono font-bold text-white text-sm sm:text-lg leading-tight">
                {localNominationsCount || 0}
              </span>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.2em] text-[var(--text-muted)] font-black">
                Nominaciones
              </span>
            </div>

            <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0" />
            </>
            )}

            <button
              onClick={() => setIsScoreOpen(true)}
              className="flex flex-col items-center px-1 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 sm:bg-transparent sm:border-transparent group relative shrink-0 hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-all"
            >
              <span className="font-mono text-[var(--accent)] text-lg sm:text-xl leading-tight group-hover:scale-110 transition-transform font-black">
                {builderScore || 0}
              </span>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.2em] text-[var(--text-muted)] font-black">
                Score 🔥
              </span>

              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-4 py-2 rounded-xl text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 pointer-events-none z-50 shadow-2xl">
                ¿Qué es esto?
              </div>
            </button>
          </div>
        )}

        {!embed && (
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
        )}
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

      <ScoreInfoModal isOpen={isScoreOpen} onClose={() => setIsScoreOpen(false)} accentColor={accentColor} profileId={profileId} />
    </div>
  );
}
