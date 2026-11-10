"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { CopyBlock } from "@/components/mcp/CopyBlock";
import { CLIENT_GUIDES, STARTER_PROMPT } from "@/lib/mcp/guide";
import { EXAMPLE_PROMPTS, cursorInstallLink, vscodeInstallLink } from "@/lib/mcp/install-links";

export function ConnectPanel({ mcpUrl }: { mcpUrl: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const cursor = cursorInstallLink(mcpUrl);
  const vscode = vscodeInstallLink(mcpUrl);

  const copy = async (value: string, kind: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <a href={cursor} className="rounded-2xl bg-[var(--accent)] px-4 py-4 text-center text-sm font-black text-black">
          Agregar a Cursor
        </a>
        <a href={vscode} className="rounded-2xl border border-[var(--accent)] px-4 py-4 text-center text-sm font-black text-[var(--accent)]">
          Agregar a VS Code
        </a>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">La URL</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 break-all font-mono text-xs text-white/80">{mcpUrl}</code>
          <button type="button" onClick={() => copy(mcpUrl, "url")} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
            {copied === "url" ? <Check size={14} /> : <Copy size={14} />}
            {copied === "url" ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-white/75">
          Pegalo en el chat del agente. Lee tu perfil, te pregunta lo que falta y no escribe hasta que le digas que sí.
        </p>
        <CopyBlock label="Prompt de arranque" code={STARTER_PROMPT} />
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Pedile algo así</div>
        {EXAMPLE_PROMPTS.map((prompt) => (
          <CopyBlock key={prompt} label="Ejemplo" code={prompt} compact />
        ))}
      </div>

      <div className="space-y-4">
        {CLIENT_GUIDES.map((guide) => (
          <section key={guide.id} className="rounded-2xl border border-white/10 p-4">
            <h2 className="mb-3 text-sm font-black">{guide.title}</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/70">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
