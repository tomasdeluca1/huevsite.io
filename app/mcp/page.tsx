import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ConnectPanel } from "@/components/mcp/ConnectPanel";
import { canonical } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";

const MCP_URL = `${SITE_URL}/api/mcp`;

export const metadata: Metadata = {
  title: "Conectá tu agente",
  description: "Agregá huevsite a Cursor, VS Code, Claude o ChatGPT y entrá con tu cuenta.",
  alternates: { canonical: canonical("/mcp") },
};

export default function McpDocsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center">
            <Logo className="h-7 w-auto" />
          </Link>
          <Link href="/dashboard" className="text-sm font-bold text-[var(--accent)]">
            Ir al dashboard
          </Link>
        </div>
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Inicio
        </Link>
        <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">Agentes</p>
        <h1 className="mb-4 text-4xl font-black tracking-tight">Agregá huevsite a tu AI</h1>
        <p className="mb-8 text-lg leading-relaxed text-white/60">
          Un click, o pegá la URL. Entrás con tu cuenta de huevsite y el agente mantiene tu perfil al día. No hace falta copiar un token.
        </p>
        <ConnectPanel mcpUrl={MCP_URL} />
        <p className="mt-8 text-sm text-white/40">
          Si tu cliente solo acepta un token, en el dashboard, Agentes, abrí Token a mano. Al crearlo elegís 30 días, 90 días o nunca. 90 días ya viene marcado. Los que ya tenías siguen sin vencimiento.
        </p>
      </div>
    </div>
  );
}
