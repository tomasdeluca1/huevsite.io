"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Vuelve a pedir la página al servidor cada `seconds` mientras la pestaña está a la vista. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [live, seconds, router]);

  return (
    <button
      type="button"
      onClick={() => setLive((value) => !value)}
      aria-pressed={live}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-[var(--text-dim)] transition-colors hover:border-[var(--border-bright)] hover:text-white"
    >
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${live ? "bg-[var(--accent)] animate-pulse" : "bg-[var(--text-muted)]"}`}
      />
      {live ? `En vivo · cada ${seconds} s` : "En pausa"}
    </button>
  );
}
