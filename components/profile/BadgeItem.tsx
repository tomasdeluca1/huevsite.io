"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ProfileBadge } from "@/lib/profile-types";

const BADGE_VISUALS: Record<
  ProfileBadge["key"],
  { bg: string; glow: string; border: string }
> = {
  profile_complete:     { bg: "linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)", glow: "rgba(99,102,241,0.55)",  border: "rgba(129,140,248,0.45)" },
  active_this_week:     { bg: "linear-gradient(135deg, #10b981, #34d399, #6ee7b7)", glow: "rgba(52,211,153,0.55)",  border: "rgba(110,231,183,0.45)" },
  twitter_connected:    { bg: "linear-gradient(135deg, #1d9bf0, #0ea5e9, #38bdf8)", glow: "rgba(29,155,240,0.55)",  border: "rgba(56,189,248,0.45)"  },
  github_linked:        { bg: "linear-gradient(135deg, #6e7681, #8b949e, #c9d1d9)", glow: "rgba(139,148,158,0.55)", border: "rgba(201,209,217,0.45)" },
  multi_block:          { bg: "linear-gradient(135deg, #a855f7, #7c3aed, #6366f1)", glow: "rgba(168,85,247,0.55)",  border: "rgba(196,181,253,0.45)" },
  rising_builder:       { bg: "linear-gradient(135deg, #f59e0b, #f97316, #ef4444)", glow: "rgba(249,115,22,0.55)",  border: "rgba(251,191,36,0.45)"  },
  builder_of_the_week:  { bg: "linear-gradient(135deg, #f59e0b, #fbbf24, #fde68a)", glow: "rgba(251,191,36,0.65)",  border: "rgba(252,211,77,0.55)"  },
  premium:              { bg: "linear-gradient(135deg, #84cc16, #C8FF00, #bef264)", glow: "rgba(200,255,0,0.6)",    border: "rgba(200,255,0,0.45)"   },
  ambassador:           { bg: "linear-gradient(135deg, #ec4899, #a855f7, #d946ef)", glow: "rgba(217,70,239,0.55)",  border: "rgba(240,171,252,0.45)" },
};

interface BadgeItemProps {
  badge: ProfileBadge;
  earned?: boolean;
  size?: "sm" | "md";
}

interface TooltipPos {
  x: number;
  y: number;
}

function BadgeTooltip({ badge, earned, pos }: { badge: ProfileBadge; earned: boolean; pos: TooltipPos }) {
  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -100%)" }}
    >
      <div
        className="rounded-xl border border-white/10 px-3 py-2 text-center shadow-2xl"
        style={{ background: "rgba(10,10,10,0.97)", backdropFilter: "blur(12px)", minWidth: 140, maxWidth: 200 }}
      >
        <div className="text-[11px] font-black text-white mb-1">{badge.label}</div>
        <div className="text-[10px] text-white/50 leading-snug whitespace-normal">
          {earned ? badge.description : badge.hint}
        </div>
      </div>
      {/* Arrow */}
      <div
        className="mx-auto"
        style={{
          width: 8, height: 8, marginTop: -4,
          background: "rgba(10,10,10,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          transform: "rotate(45deg)",
          borderTop: "none", borderLeft: "none",
        }}
      />
    </div>,
    document.body
  );
}

export function BadgeItem({ badge, earned = true, size = "md" }: BadgeItemProps) {
  const v = BADGE_VISUALS[badge.key];
  const isMd = size === "md";
  const dim = isMd ? 52 : 28;

  const ref = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function showTooltip() {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  }

  function hideTooltip() {
    setTooltipPos(null);
  }

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ gap: isMd ? 6 : 4 }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {/* Badge circle */}
      <div
        ref={ref}
        className="relative transition-all duration-300"
        style={{
          width: dim,
          height: dim,
          filter: earned ? "none" : "grayscale(1)",
          opacity: earned ? 1 : 0.35,
        }}
      >
        {/* Outer glow — earned only */}
        {earned && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ inset: -4, boxShadow: `0 0 14px 3px ${v.glow}`, borderRadius: "50%" }}
          />
        )}

        {/* Border ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: `1.5px solid ${v.border}` }}
        />

        {/* Gradient background */}
        <div
          className="absolute rounded-full"
          style={{ inset: 2, background: v.bg }}
        />

        {/* Inner shine */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: 2,
            background: "linear-gradient(160deg, rgba(255,255,255,0.28) 0%, transparent 55%)",
          }}
        />

        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center select-none">
          <span
            className="font-black leading-none"
            style={{
              fontSize: isMd ? 18 : 10,
              color: badge.key === "premium" ? "#111" : "rgba(255,255,255,0.95)",
              textShadow: badge.key === "premium" ? "none" : "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            {badge.icon}
          </span>
        </div>
      </div>

      {/* Label — md only */}
      {isMd && (
        <span
          className="font-black uppercase tracking-widest transition-colors"
          style={{
            fontSize: 8,
            letterSpacing: "0.13em",
            color: earned ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
          }}
        >
          {badge.shortLabel}
        </span>
      )}

      {/* Portal tooltip */}
      {mounted && tooltipPos && (
        <BadgeTooltip badge={badge} earned={earned} pos={tooltipPos} />
      )}
    </div>
  );
}
