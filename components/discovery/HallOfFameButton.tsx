"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * Friendly fixed floating tab anchored to the right edge → the Builders de la
 * Semana hall of fame. Collapsed it shows just the (gently pulsing) laurel;
 * on hover it slides open to reveal the label + a shine sweep. Stays out of
 * the way of the content while remaining one click from anywhere on the page.
 */
export function HallOfFameButton() {
  const t = useTranslations("winnerHistory");

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 22 }}
      className="fixed right-0 top-1/3 z-40 -translate-y-1/2"
    >
      <Link
        href="/builders-de-la-semana"
        title={t("title")}
        className="group relative flex items-center gap-2 overflow-hidden rounded-l-2xl border border-r-0 border-[var(--accent)]/40 bg-black/70 py-3 pl-3 pr-3 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 hover:border-[var(--accent)] hover:bg-black/85 hover:pr-4"
      >
        {/* shine sweep on hover */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

        <motion.img
          src="/badge/laurel-dark.png"
          alt=""
          className="h-7 w-auto shrink-0 drop-shadow-[0_0_10px_rgba(200,255,0,0.5)]"
          animate={{ scale: [1, 1.09, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        />

        <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-black uppercase tracking-wide text-[var(--accent)] opacity-0 transition-all duration-300 group-hover:max-w-[220px] group-hover:opacity-100">
          {t("title")}
        </span>
      </Link>
    </motion.div>
  );
}
