"use client";

import { useEffect, useRef, useState } from "react";

// Un número que sube hasta su valor en vez de aparecer de golpe.
export function CountUp({ value, from = 0, duration = 700, className }: { value: number; from?: number; duration?: number; className?: string }) {
  const [shown, setShown] = useState(from);
  const startRef = useRef(from);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = startRef.current;
    if (reduce || start === value) { setShown(value); startRef.current = value; return; }
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else startRef.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className={className}>{shown.toLocaleString("es-AR")}</span>;
}
