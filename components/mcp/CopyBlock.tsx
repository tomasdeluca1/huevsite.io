"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyBlock({ label, code, compact = false }: { label: string; code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const status = copied ? "Copiado" : "Copiar";

  const button = (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      aria-label={copied ? `Copiado: ${label}` : `Copiar ${label}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent)]"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span aria-live="polite">{status}</span>
    </button>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/80">{code}</p>
        {button}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-2">
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{label}</span>
        {button}
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-white/80">{code}</pre>
    </div>
  );
}
