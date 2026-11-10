import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { CopyBlock } from "@/components/mcp/CopyBlock";
import { canonical } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";

const MCP_URL = `${SITE_URL}/api/mcp`;

export const metadata: Metadata = {
  title: "Conectá tu agente",
  description: "MCP de huevsite para que Claude, Cursor o ChatGPT actualicen tu perfil con un token personal.",
  alternates: { canonical: canonical("/mcp") },
};

const CURSOR = `{
  "mcpServers": {
    "huevsite": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer TU_TOKEN"
      }
    }
  }
}`;

const CLAUDE = `{
  "mcpServers": {
    "huevsite": {
      "type": "http",
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer TU_TOKEN"
      }
    }
  }
}`;

const CLAUDE_REMOTE = `{
  "mcpServers": {
    "huevsite": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "${MCP_URL}",
        "--header",
        "Authorization: Bearer TU_TOKEN"
      ]
    }
  }
}`;

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

        <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
          MCP
        </p>
        <h1 className="mb-4 text-4xl font-black tracking-tight">Conectá tu agente a huevsite</h1>
        <p className="mb-10 text-lg leading-relaxed text-white/60">
          Creás un token en el dashboard y se lo das a Claude, Cursor o ChatGPT. El agente puede leer y actualizar
          tu perfil, tus proyectos y tus lanzamientos. El token no sirve para el perfil de nadie más.
        </p>

        <section className="mb-12 space-y-4">
          <h2 className="text-xl font-black">1. Creá el token</h2>
          <ol className="list-decimal space-y-2 pl-5 text-white/70">
            <li>Entrá al dashboard, barra de la izquierda, Agentes.</li>
            <li>Ponele un nombre (por ejemplo, Claude de la laptop) y crealo.</li>
            <li>Copialo en ese momento. Guardamos solo el hash, así que no lo volvemos a mostrar.</li>
            <li>Si se te escapó o lo pegaste en un chat, revocalo y hacé otro. Podés tener hasta 5 activos.</li>
          </ol>
          <p className="text-sm text-white/45">
            No lo subas a un repo ni lo dejes en un screenshot. Va en el header <span className="font-mono text-white/70">Authorization: Bearer</span>.
          </p>
        </section>

        <section className="mb-12 space-y-4">
          <h2 className="text-xl font-black">2. Pegá la config</h2>
          <p className="text-white/70">
            La URL del servidor es <span className="font-mono text-[var(--accent)]">{MCP_URL}</span>. Reemplazá <span className="font-mono">TU_TOKEN</span> por el que te mostró el dashboard.
          </p>

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">Cursor</h3>
          <p className="text-sm text-white/50">En <span className="font-mono">.cursor/mcp.json</span> del proyecto, o en los MCP de Cursor Settings.</p>
          <CopyBlock label="Cursor" code={CURSOR} />

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">Claude Desktop</h3>
          <p className="text-sm text-white/50">En <span className="font-mono">claude_desktop_config.json</span>, si tu versión acepta servidores remotos.</p>
          <CopyBlock label="Claude Desktop" code={CLAUDE} />
          <p className="text-sm text-white/50">Si solo habla stdio, usá el puente mcp-remote:</p>
          <CopyBlock label="Claude con mcp-remote" code={CLAUDE_REMOTE} />

          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/50">ChatGPT</h3>
          <p className="text-white/70">
            En modo desarrollador, agregá un conector con la URL de arriba. Si te deja poner un header, usá
            {" "}<span className="font-mono">Authorization: Bearer TU_TOKEN</span>.
            Si el conector solo ofrece OAuth, todavía no está: seguí con Cursor o Claude. OAuth queda como paso siguiente.
          </p>
        </section>

        <section className="mb-12 space-y-3">
          <h2 className="text-xl font-black">Qué puede hacer</h2>
          <ul className="space-y-2 text-white/70">
            <li><span className="font-mono text-white">get_my_profile</span> lee tu headline, bio, links, stack y proyectos.</li>
            <li><span className="font-mono text-white">update_profile</span> cambia esos campos, con los mismos límites que el dashboard.</li>
            <li><span className="font-mono text-white">list_my_projects</span>, <span className="font-mono text-white">create_project</span>, <span className="font-mono text-white">update_project</span>.</li>
            <li><span className="font-mono text-white">delete_project</span> solo borra si le pasás <span className="font-mono">confirm: true</span>.</li>
            <li><span className="font-mono text-white">post_update</span> deja un avance de build in public. Cuenta para el cron de avances de builders.</li>
            <li><span className="font-mono text-white">announce_launch</span> mete un proyecto en Builders Hunt. Free: uno por mes. Programar una semana futura es Pro.</li>
            <li><span className="font-mono text-white">sync_from_github</span> refresca las stats de los bloques de GitHub que ya tenés. No crea el bloque.</li>
          </ul>
          <p className="text-sm text-white/45">
            El cupo de bloques es el de siempre: 5 visibles en free, 22 en Pro (más los que sumaste por compartir).
            Un avance sobre un proyecto creado hace menos de dos horas lo toma el cron como eco y no lo publica.
            El servidor no manda mails ni postea en redes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black">Límites y registro</h2>
          <p className="text-white/70">
            Cada token tiene 60 llamadas por hora en free y 600 si tenés Pro (incluye la prueba y el Pro por referidos).
            Además hay un tope corto para que un agente no dispare todo junto. Cada llamada queda en un registro que ves en Agentes: qué herramienta, si salió bien, y cuándo. Ahí no se guarda el token ni el texto de la bio.
          </p>
          <p className="text-sm text-white/45">
            Username, email, dominio propio y la newsletter se siguen cambiando desde el dashboard. Esos caminos tocan la URL, Vercel o el mail, y el agente no entra ahí.
          </p>
        </section>
      </div>
    </div>
  );
}
