import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ConnectPanel } from "@/components/mcp/ConnectPanel";
import { CopyBlock } from "@/components/mcp/CopyBlock";
import { PUBLISH_PROMPT, STARTER_PROMPT } from "@/lib/mcp/guide";
import { claudeConfig, cursorConfig, cursorInstallLink, tokenConfig, vscodeConfig, vscodeInstallLink } from "@/lib/mcp/install-links";
import { MCP_TOOL_NAMES } from "@/lib/mcp/tools";
import { safeJsonLd } from "@/lib/json-ld";
import { canonical } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import { breadcrumbLd, ORGANIZATION_ID } from "@/lib/structured-data";

const MCP_URL = `${SITE_URL}/api/mcp`;
const TITLE = "Conectá tu agente";
const DESCRIPTION = "Agregá huevsite a Cursor, VS Code, Claude o ChatGPT. Entrás con tu cuenta y el agente actualiza tu perfil.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "mcp huevsite",
    "conectar agente",
    "cursor mcp",
    "vs code mcp",
    "claude mcp",
    "chatgpt mcp",
    "model context protocol",
    "actualizar perfil con ia",
  ],
  alternates: { canonical: canonical("/mcp") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: canonical("/mcp"),
    type: "website",
    siteName: "huevsite.io",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    site: "@huevsite_io",
    creator: "@huevsite_io",
  },
};

export default function McpDocsPage() {
  const cursor = cursorInstallLink(MCP_URL);
  const vscode = vscodeInstallLink(MCP_URL);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebAPI",
      "@id": `${MCP_URL}#webapi`,
      name: "huevsite MCP",
      description: DESCRIPTION,
      url: MCP_URL,
      documentation: canonical("/mcp"),
      termsOfService: `${SITE_URL}/terms`,
      provider: { "@id": ORGANIZATION_ID },
      isAccessibleForFree: true,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/mcp#app`,
      name: "huevsite MCP",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: canonical("/mcp"),
      description: DESCRIPTION,
      installUrl: canonical("/mcp"),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@id": ORGANIZATION_ID },
      featureList: [...MCP_TOOL_NAMES, "armar_mi_perfil", "publicar_avance"],
    },
    breadcrumbLd([
      { name: "huevsite.io", path: "/" },
      { name: "Agentes", path: "/mcp" },
    ]),
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-16 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
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

        <section id="prompts" className="mt-12 space-y-4">
          <h2 className="text-xl font-black">Prompts del servidor</h2>
          <p className="text-sm leading-relaxed text-white/60">
            Si el cliente lista prompts, aparecen como <span className="font-mono text-white/80">armar_mi_perfil</span> y <span className="font-mono text-white/80">publicar_avance</span>. Si no los lista, copiá el texto y pegalo en el chat. armar_mi_perfil es el prompt de arranque.
          </p>
          <CopyBlock label="armar_mi_perfil" code={STARTER_PROMPT} />
          <CopyBlock label="publicar_avance" code={PUBLISH_PROMPT} />
        </section>

        <section id="config" className="mt-12 space-y-4">
          <h2 className="text-xl font-black">Config para pegar</h2>
          <p className="text-sm leading-relaxed text-white/60">
            Si el botón no abre la app, pegá el JSON o la URL. La auth es OAuth: el cliente te abre el navegador y entrás con tu cuenta de huevsite.
          </p>

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">Cursor</h3>
          <p className="text-sm text-white/50">En <span className="font-mono">.cursor/mcp.json</span> del proyecto, o en los MCP de Cursor Settings.</p>
          <CopyBlock label="Cursor mcp.json" code={cursorConfig(MCP_URL)} />
          <CopyBlock label="Link de Cursor" code={cursor} />

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">VS Code</h3>
          <p className="text-sm text-white/50">En <span className="font-mono">.vscode/mcp.json</span>, o con el link de instalación.</p>
          <CopyBlock label="VS Code mcp.json" code={vscodeConfig(MCP_URL)} />
          <CopyBlock label="Link de VS Code" code={vscode} />

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">Claude</h3>
          <p className="text-sm text-white/50">Conector custom, o <span className="font-mono">claude_desktop_config.json</span> si acepta servidores remotos.</p>
          <CopyBlock label="Claude" code={claudeConfig(MCP_URL)} />

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">ChatGPT</h3>
          <p className="text-sm text-white/50">En Plugins, Add custom MCP server. Nombre huevsite. Authentication: OAuth. Server URL:</p>
          <CopyBlock label="URL para ChatGPT" code={MCP_URL} />
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-black">Si pide un token</h2>
          <p className="text-sm leading-relaxed text-white/60">
            En el dashboard, Agentes, abrí Token a mano. Creá uno, copialo en ese momento y reemplazá TU_TOKEN. Ese camino sigue andando.
          </p>
          <CopyBlock label="Token a mano" code={tokenConfig(MCP_URL)} />
        </section>
      </div>
    </div>
  );
}
