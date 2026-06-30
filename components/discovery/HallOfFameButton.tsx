"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * Animated "Builders de la Semana" button → the hall-of-fame history page.
 * Laurel with a pulsing lime glow + a shine sweep on hover. Used on the
 * Explore and Leaderboard heroes.
 */
export function HallOfFameButton({ className = "" }: { className?: string }) {
  const t = useTranslations("winnerHistory");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={className}
    >
      <Link
        href="/builders-de-la-semana"
        className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/[0.06] px-4 py-2.5 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.12]"
      >
        {/* shine sweep on hover */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

        <motion.img
          src="/badge/laurel-dark.png"
          alt=""
          className="h-7 w-auto drop-shadow-[0_0_10px_rgba(200,255,0,0.45)]"
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        />

        <span className="text-xs font-black uppercase tracking-wide text-[var(--accent)] md:text-sm">
          {t("title")}
        </span>

        <span className="text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-1">→</span>
      </Link>
    </motion.div>
  );
}
