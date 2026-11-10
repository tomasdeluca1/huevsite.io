"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{label}</span>
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
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--accent)]"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-white/80">{code}</pre>
    </div>
  );
}
