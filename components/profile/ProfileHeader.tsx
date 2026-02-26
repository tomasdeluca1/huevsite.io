"use client";

import { useState } from "react";
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

  const handleFollowChange = (nowFollowing: boolean) => {
    setLocalFollowersCount(prev => nowFollowing ? prev + 1 : prev - 1);
  };

  return (
    <header className="relative z-[100] mb-10">
      {/* Upper bar: Logo + User Actions + Main CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="logo shrink-0">
            huev<span>site</span>.io
          </Link>
          
          {/* Mobile only CTA */}
          <div className="md:hidden">
        {currentUserId ? (
          <Link href="/dashboard" className="btn btn-ghost !text-[10px] !py-2 !px-4 !rounded-xl">
            Mi huevsite 🇦🇷
          </Link>
        ) : (
          <Link href="/login" className="btn btn-ghost !text-[10px] !py-2 !px-4 !rounded-xl">
            Buildeá el tuyo 🇦🇷
          </Link>
        )}
      </div>
        </div>

        {/* Center/Right Section: Stats and Social Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
          {isEnabledSocialNetwork && profileId && (
            <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-1.5 py-1.5 shadow-sm">
              <button
                onClick={() => setModalType("followers")}
                className="flex flex-col items-center px-4 py-1.5 rounded-xl hover:bg-white/5 transition-all group"
              >
                <span className="font-mono font-bold text-white text-base leading-tight group-hover:scale-110 transition-transform">
                  {localFollowersCount}
                </span>
                <span className="text-[9px] uppercase tracking-tighter text-[var(--text-muted)] font-bold">Followers</span>
              </button>

              <div className="w-px h-6 bg-[var(--border)] my-auto" />

              <button
                onClick={() => setModalType("following")}
                className="flex flex-col items-center px-4 py-1.5 rounded-xl hover:bg-white/5 transition-all group"
              >
                <span className="font-mono font-bold text-white text-base leading-tight group-hover:scale-110 transition-transform">
                  {followingCount}
                </span>
                <span className="text-[9px] uppercase tracking-tighter text-[var(--text-muted)] font-bold">Following</span>
              </button>

              <div className="w-px h-6 bg-[var(--border)] my-auto" />

              <div className="flex flex-col items-center px-4 py-1.5">
                <span className="font-mono font-bold text-white text-base leading-tight">
                  {nominationsCount}
                </span>
                <span className="text-[9px] uppercase tracking-tighter text-[var(--text-muted)] font-bold">Noms 🏆</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            {showFollowButton && profileId && (
              <FollowButton
                profileId={profileId}
                initialIsFollowing={isFollowing}
                accentColor={accentColor}
                onToggle={handleFollowChange}
              />
            )}
            
            {isEnabledSocialNetwork && profileId && currentUserId && (
              <NominateButton
                userId={profileId}
                accentColor={accentColor}
              />
            )}
            
            <div className="hidden md:block">
              {currentUserId ? (
                <Link href="/dashboard" className="btn btn-ghost !px-5 !text-xs !py-3 !rounded-2xl hover:!border-[var(--accent)] transition-all">
                  Ir a mi huevsite 🇦🇷
                </Link>
              ) : (
                <Link href="/login" className="btn btn-ghost !px-5 !text-xs !py-3 !rounded-2xl hover:!border-[var(--accent)] transition-all">
                  Buildeá el tuyo 🇦🇷
                </Link>
              )}
            </div>
          </div>
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
