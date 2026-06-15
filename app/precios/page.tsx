import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PricingTiers } from "@/components/landing/PricingTiers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Precios · huevsite.io",
  description: "Free, Pro y Founder. Elegí cómo querés que te encuentren.",
};

// Reconstruye SOLO los utm_* entrantes como query string saneado (evita arrastrar
// params arbitrarios al checkout / login).
function buildUtmQuery(sp?: { [key: string]: string | string[] | undefined }): string {
  if (!sp) return "";
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const parts: string[] = [];
  for (const k of keys) {
    const raw = sp[k];
    const val = Array.isArray(raw) ? raw[0] : raw;
    if (val) parts.push(`${k}=${encodeURIComponent(val)}`);
  }
  return parts.join("&");
}

export default async function PreciosPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pricingUser = user ? { id: user.id, email: user.email } : null;
  const utm = buildUtmQuery(searchParams);

  return (
    <main className="landing min-h-screen bg-[var(--bg)] font-display">
      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="logo">
            huev<span style={{ color: "var(--accent)" }}>site</span>.io
          </Link>
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-ghost">
            {user ? "Mi huevsite" : "Iniciar sesión"}
          </Link>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="section-label" style={{ color: "var(--accent)", justifyContent: "center" }}>
            // huevsite pro
          </div>
          <h1 className="section-title">
            Que te <span style={{ color: "var(--accent)" }}>encuentren.</span>
          </h1>
          <p className="section-sub">
            Recruiters, clientes y otros builders te descubren cuando destacás. Los perfiles Pro
            aparecen primero en el feed, el showcase y el leaderboard.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          <PricingTiers user={pricingUser} loginNext="/precios" utm={utm} />
        </div>

        <p className="text-center text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-12 opacity-50">
          Pagos seguros vía Lemon Squeezy · Cancelás cuando quieras
        </p>
      </div>
    </main>
  );
}
