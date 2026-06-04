"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Starts on Argentina, then auto-slides through LATAM flags.
const FLAGS = ["🇦🇷", "🇧🇷", "🇲🇽", "🇨🇴", "🇨🇱", "🇵🇪", "🇺🇾", "🇪🇨", "🇧🇴", "🇵🇾", "🇻🇪", "🇨🇷", "🇬🇹", "🇩🇴", "🇵🇦", "🇸🇻", "🇭🇳", "🇵🇷"];

export function LatamFlags({ intervalMs = 1400 }: { intervalMs?: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % FLAGS.length), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        width: "1.15em",
        height: "1.2em",
        overflow: "hidden",
        position: "relative",
        verticalAlign: "middle",
        marginLeft: "0.1em",
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={i}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
        >
          {FLAGS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
