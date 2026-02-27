"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FollowButton } from "@/components/social/FollowButton";
import { NominateButton } from "@/components/social/NominateButton";
import { FollowListModal } from "@/components/social/FollowListModal";

interface Props {
  profileId?: string;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  nominationsCount: number;
  accentColor: string;
  showFollowButton: boolean;
  currentUserId?: string | null;
  isEnabledSocialNetwork: boolean;
}

export function ProfileHeader({
  profileId,
  isFollowing,
  followersCount,
  followingCount,
  nominationsCount,
  accentColor,
  showFollowButton,
  currentUserId,
  isEnabledSocialNetwork,
}: Props) {
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);
  const [localFollowersCount, setLocalFollowersCount] = useState(followersCount);
  const [localNominationsCount, setLocalNominationsCount] = useState(nominationsCount);

  // Scroll lock when modal is open
  useEffect(() => {
    if (modalType) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [modalType]);

  const handleFollowChange = (nowFollowing: boolean) => {
    setLocalFollowersCount(prev => nowFollowing ? prev + 1 : prev - 1);
  };

  const handleNominateChange = (nowNominated: boolean) => {
    setLocalNominationsCount(prev => nowNominated ? prev + 1 : prev - 1);
  };

  return (
    <header className="relative z-[100] mb-8 md:mb-12">
      {/* Upper bar: Logo + Explore Link + Main CTA */}
      <div className="flex items-center justify-between gap-4 mb-6">
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
          {currentUserId ? (
            <Link href="/dashboard" className="btn btn-ghost !text-[10px] !py-2 !px-4 !rounded-xl border border-white/5 bg-white/5 md:hidden">
              Mi Dashboard 🇦🇷
            </Link>
          ) : (
            <Link href="/login" className="btn btn-ghost !text-[10px] !py-2 !px-4 !rounded-xl border border-white/5 bg-white/5 md:hidden">
              Empezar 🇦🇷
            </Link>
          )}

          <div className="hidden md:block">
            {currentUserId ? (
              <Link href="/dashboard" className="btn btn-ghost !px-5 !text-xs !py-3 !rounded-2xl hover:!border-[var(--accent)] transition-all bg-white/5 border border-white/5">
                Dashboard 🇦🇷
              </Link>
            ) : (
              <Link href="/login" className="btn btn-ghost !px-5 !text-xs !py-3 !rounded-2xl hover:!border-[var(--accent)] transition-all bg-white/5 border border-white/5">
                Crear mi huevsite 🇦🇷
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats and Social Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-1 rounded-3xl md:bg-white/[0.02] md:border md:border-white/5 md:backdrop-blur-md">
        {isEnabledSocialNetwork && profileId && (
          <div className="flex items-center justify-between sm:justify-start bg-[var(--surface)] sm:bg-transparent border border-[var(--border)] sm:border-none rounded-2xl px-1 py-1 sm:p-0 shadow-sm sm:shadow-none w-full lg:w-auto">
            <button
              onClick={() => setModalType("followers")}
              className="flex flex-col items-center flex-1 sm:flex-none px-4 py-2 sm:py-3 rounded-xl hover:bg-white/5 transition-all group"
            >
              <span className="font-mono font-bold text-white text-base leading-tight group-hover:scale-110 transition-transform">
                {localFollowersCount || 0}
              </span>
              <span className="text-[9px] uppercase tracking-tighter text-[var(--text-muted)] font-bold">Followers</span>
            </button>

            <div className="w-px h-6 bg-[var(--border)] my-auto opacity-50 block sm:hidden md:block" />

            <button
              onClick={() => setModalType("following")}
              className="flex flex-col items-center flex-1 sm:flex-none px-4 py-2 sm:py-3 rounded-xl hover:bg-white/5 transition-all group"
            >
              <span className="font-mono font-bold text-white text-base leading-tight group-hover:scale-110 transition-transform">
                {followingCount || 0}
              </span>
              <span className="text-[9px] uppercase tracking-tighter text-[var(--text-muted)] font-bold">Following</span>
            </button>

            <div className="w-px h-6 bg-[var(--border)] my-auto opacity-50 block sm:hidden md:block" />

            <div className="flex flex-col items-center flex-1 sm:flex-none px-4 py-2 sm:py-3">
              <span className="font-mono font-bold text-white text-base leading-tight">
                {localNominationsCount || 0}
              </span>
              <span className="text-[9px] uppercase tracking-tighter text-[var(--text-muted)] font-bold">Noms 🏆</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 w-full lg:w-auto">
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
          
          {isEnabledSocialNetwork && profileId && currentUserId && (
            <div className="flex-1 lg:flex-none">
              <NominateButton
                userId={profileId}
                accentColor={accentColor}
                onStatusChange={handleNominateChange}
              />
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
    </header>
  );
}
