"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface Props {
  profileId: string;
  initialIsFollowing: boolean;
  accentColor: string;
  onToggle?: (isFollowing: boolean) => void;
}

export function FollowButton({ profileId, initialIsFollowing, accentColor, onToggle }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const willFollow = !isFollowing;
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch("/api/social/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: profileId }),
      });

      if (res.ok) {
        setIsFollowing(willFollow);
        onToggle?.(willFollow);
      } else if (res.status === 401) {
        window.location.href = "/login";
      } else {
        const data = await res.json();
        alert(data.error || "Error al seguir.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border"
      style={
        isFollowing
          ? { borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}15` }
          : { backgroundColor: accentColor, color: "black", borderColor: "transparent" }
      }
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : isFollowing ? (
        <><UserMinus size={15} /> Siguiendo</>
      ) : (
        <><UserPlus size={15} /> Seguir</>
      )}
    </button>
  );
}
