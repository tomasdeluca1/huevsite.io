import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/Logo";
import { OAUTH_SCOPE, endpointsFromRequest, sameResource } from "@/lib/mcp/oauth/metadata";
import { headers } from "next/headers";
import { redirectAllowed, redirectHostLabel } from "@/lib/mcp/oauth/redirect";
import { resolveOauthClient } from "@/lib/mcp/oauth/http-helpers";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function ErrorCard({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-16 text-white">
      <div className="mx-auto max-w-md">
        <Logo className="mb-8 h-7 w-auto" />
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">{body}</p>
      </div>
    </main>
  );
}

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = {
    response_type: one(searchParams.response_type),
    client_id: one(searchParams.client_id),
    redirect_uri: one(searchParams.redirect_uri),
    code_challenge: one(searchParams.code_challenge),
    code_challenge_method: one(searchParams.code_challenge_method) || "S256",
    state: one(searchParams.state),
    resource: one(searchParams.resource),
    scope: one(searchParams.scope) || OAUTH_SCOPE,
  };
  const query = new URLSearchParams(params).toString();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${query}`)}`);

  const headerList = headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "huevsite.io";
  const proto = headerList.get("x-forwarded-proto") || "https";
  const endpoints = endpointsFromRequest(new Request(`${proto}://${host}/oauth/authorize`));
  const client = params.client_id ? await resolveOauthClient(params.client_id).catch(() => null) : null;
  const redirectOk = !!client && redirectAllowed(params.redirect_uri, client.redirectUris);
  const resourceOk = !!params.resource && sameResource(params.resource, endpoints.resource);
  if (!client || !redirectOk || !resourceOk || params.response_type !== "code" || params.code_challenge_method !== "S256" || params.code_challenge.length < 43) {
    return (
      <ErrorCard
        title="No se puede conectar"
        body="Esta app no pasó la verificación. Volvé al cliente y probá de nuevo. No te mandamos a ningún otro lado."
      />
    );
  }

  const backTo = redirectHostLabel(params.redirect_uri);
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-16 text-white">
      <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-[#0A0A0A] p-8">
        <Logo className="mb-8 h-7 w-auto" />
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Conectar</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          {client.clientName} quiere acceso a tu perfil de huevsite
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/65">
          Va a poder leer y actualizar tu perfil, tus proyectos y tus lanzamientos. No manda mails ni publica en redes.
        </p>
        <p className="mt-3 text-sm text-white/45">
          Si permitís, te devolvemos a <span className="font-mono text-white/70">{backTo}</span>.
        </p>
        <form method="POST" action="/oauth/authorize/decision" className="mt-8 flex gap-3">
          {Object.entries(params).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <button name="action" value="deny" className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/70">
            Cancelar
          </button>
          <button name="action" value="allow" className="flex-1 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-black text-black">
            Permitir
          </button>
        </form>
      </div>
    </main>
  );
}
