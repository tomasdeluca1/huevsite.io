"use client";

import { useEffect, useState } from "react";

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date();
      // Target: Lunes 00:00 UTC-3 (domingo a la medianoche)
      // Ajustamos el tiempo actual a UTC-3
      const argTime = new Date(now.getTime() - 3 * 3600000);
      
      const target = new Date(Date.UTC(argTime.getUTCFullYear(), argTime.getUTCMonth(), argTime.getUTCDate()));
      const dayNum = target.getUTCDay() || 7; // 1=Lunes, 7=Domingo
      
      // Si estamos en lunes, queremos el proximo lunes. Si es domingo, el lunes de mañana.
      const daysUntilMonday = 8 - dayNum; // domingo(7) -> 1, lunes(1) -> 7, etc.
      
      target.setUTCDate(target.getUTCDate() + daysUntilMonday);
      target.setUTCHours(3, 0, 0, 0); // Lunes 03:00 UTC = Lunes 00:00 UTC-3

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };

      return {
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      };
    }

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return <div className="font-mono text-sm tracking-widest text-[var(--accent)] animate-pulse">00d 00h 00m</div>;

  return (
    <div className="font-mono text-sm tracking-widest text-[var(--accent)]">
      {timeLeft.d}d {String(timeLeft.h).padStart(2, '0')}h {String(timeLeft.m).padStart(2, '0')}m {String(timeLeft.s).padStart(2, '0')}s
    </div>
  );
}
