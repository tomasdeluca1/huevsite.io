import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ConnectPanel } from "@/components/mcp/ConnectPanel";
import { CopyBlock } from "@/components/mcp/CopyBlock";
import { claudeConfig, cursorConfig, cursorInstallLink, tokenConfig, vscodeConfig, vscodeInstallLink } from "@/lib/mcp/install-links";
import { MCP_TOOL_NAMES } from "@/lib/mcp/tools";
import { safeJsonLd } from "@/lib/json-ld";
import { getLocale } from "@/lib/locale";
import { canonical } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import { breadcrumbLd, ORGANIZATION_ID } from "@/lib/structured-data";

const MCP_URL = `${SITE_URL}/api/mcp`;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mcpDocs");
  const locale = await getLocale();
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    keywords: [
      "mcp huevsite",
      t("keywordConnectAgent"),
      "cursor mcp",
      "vs code mcp",
      "claude mcp",
      "chatgpt mcp",
      "model context protocol",
      t("keywordUpdateProfile"),
    ],
    alternates: { canonical: canonical("/mcp") },
    openGraph: {
      title,
      description,
      url: canonical("/mcp"),
      type: "website",
      siteName: "huevsite.io",
      locale: locale === "en" ? "en_US" : "es_AR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@huevsite_io",
      creator: "@huevsite_io",
    },
  };
}

export default async function McpDocsPage() {
  const t = await getTranslations("mcpDocs");
  const description = t("metaDescription");
  const manualToken = t("manualToken");
  const cursor = cursorInstallLink(MCP_URL);
  const vscode = vscodeInstallLink(MCP_URL);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebAPI",
      "@id": `${MCP_URL}#webapi`,
      name: "huevsite MCP",
      description,
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
      description,
      installUrl: canonical("/mcp"),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@id": ORGANIZATION_ID },
      featureList: [...MCP_TOOL_NAMES, "armar_mi_perfil", "publicar_avance"],
    },
    breadcrumbLd([
      { name: "huevsite.io", path: "/" },
      { name: t("agents"), path: "/mcp" },
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
            {t("goToDashboard")}
          </Link>
        </div>
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          {t("home")}
        </Link>
        <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">{t("agents")}</p>
        <h1 className="mb-4 text-4xl font-black tracking-tight">{t("title")}</h1>
        <p className="mb-8 text-lg leading-relaxed text-white/60">
          {t("intro")}
        </p>
        <ConnectPanel mcpUrl={MCP_URL} />
        <p className="mt-8 text-sm text-white/40">
          {t("tokenIntro", { agents: t("agents"), manualToken })}
        </p>

        <section id="prompts" className="mt-12 space-y-4">
          <h2 className="text-xl font-black">{t("serverPrompts")}</h2>
          <p className="text-sm leading-relaxed text-white/60">
            {t.rich("serverPromptsIntro", {
              starter: "armar_mi_perfil",
              publish: "publicar_avance",
              code: (chunks) => <span className="font-mono text-white/80">{chunks}</span>,
            })}
          </p>
          <CopyBlock label="armar_mi_perfil" code={t("starterPrompt")} />
          <CopyBlock label="publicar_avance" code={t("publishPrompt")} />
        </section>

        <section id="config" className="mt-12 space-y-4">
          <h2 className="text-xl font-black">{t("configTitle")}</h2>
          <p className="text-sm leading-relaxed text-white/60">
            {t("configIntro")}
          </p>

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">Cursor</h3>
          <p className="text-sm text-white/50">{t.rich("cursorConfig", { file: () => <span className="font-mono">.cursor/mcp.json</span> })}</p>
          <CopyBlock label="Cursor mcp.json" code={cursorConfig(MCP_URL)} />
          <CopyBlock label={t("cursorLink")} code={cursor} />

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">VS Code</h3>
          <p className="text-sm text-white/50">{t.rich("vscodeConfig", { file: () => <span className="font-mono">.vscode/mcp.json</span> })}</p>
          <CopyBlock label="VS Code mcp.json" code={vscodeConfig(MCP_URL)} />
          <CopyBlock label={t("vscodeLink")} code={vscode} />

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">Claude</h3>
          <p className="text-sm text-white/50">{t.rich("claudeConfig", { file: () => <span className="font-mono">claude_desktop_config.json</span> })}</p>
          <CopyBlock label="Claude" code={claudeConfig(MCP_URL)} />

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">ChatGPT</h3>
          <p className="text-sm text-white/50">{t("chatgptConfig")}</p>
          <CopyBlock label={t("chatgptUrl")} code={MCP_URL} />
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-black">{t("tokenTitle")}</h2>
          <p className="text-sm leading-relaxed text-white/60">
            {t("tokenInstructions", { agents: t("agents"), manualToken, placeholder: "TU_TOKEN" })}
          </p>
          <CopyBlock label={manualToken} code={tokenConfig(MCP_URL)} />
        </section>
      </div>
    </div>
  );
}
