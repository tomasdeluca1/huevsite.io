import Link from "next/link";
import { Check } from "lucide-react";
import { lemonLifetimeCheckoutUrl, buildLemonCheckoutUrl } from "@/lib/lemon-checkout-url";

interface PricingUser {
  id?: string | null;
  email?: string | null;
}

// Appendea un query string (sin ? ni & inicial) a una URL, respetando si ya tiene ?.
function appendQuery(url: string, qs?: string): string {
  if (!qs) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${qs}`;
}

/**
 * Los 3 tiers (Free / Pro / Founder) como bloque reusable, fuente única de verdad
 * para la landing (#precios) y la página dedicada /precios.
 *
 * Identidad en el checkout: si hay usuario, los botones de pago llevan user_id+email
 * (el webhook de Lemon Squeezy mapea la compra). Si NO hay usuario, NO mandamos a un
 * checkout anónimo (rompía el mapeo): mandamos a /login?next=<loginNext> para que,
 * al volver logueado, el botón ya cargue la identidad.
 *
 * El contenedor (grid) lo pone el padre, así la landing puede envolverlo en motion.
 */
export function PricingTiers({
  user,
  loginNext = "/precios",
  utm,
}: {
  user: PricingUser | null;
  loginNext?: string;
  /** Query string de UTMs (sin ? inicial), p.ej. "utm_source=email&utm_campaign=somos-200". */
  utm?: string;
}) {
  // Deslogueado: volvemos a la misma página CON los UTMs, así tras loguearse el
  // checkout ya los arrastra. Logueado: van directo a la URL de Lemon.
  const nextTarget = appendQuery(loginNext, utm);
  const loginHref = `/login?next=${encodeURIComponent(nextTarget)}`;
  const proHref = user ? appendQuery(buildLemonCheckoutUrl(user.id, user.email), utm) : loginHref;
  const founderHref = user
    ? appendQuery(buildLemonCheckoutUrl(user.id, user.email, lemonLifetimeCheckoutUrl), utm)
    : loginHref;

  return (
    <>
      {/* FREE */}
      <div className="flex flex-col bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--text-muted)] mb-3 block">Free</span>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-5xl font-black text-white">$0</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-8">Para empezar a mostrar lo que buildeás.</p>
        <ul className="space-y-3 text-left mb-8 flex-1">
          {['Tu URL huevsite.io/vos', 'Bloques para proyectos, GitHub y stack', 'Builder Score + feed + showcase', 'Importás de Linktree o GitHub'].map(item => (
            <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-dim)]">
              <Check size={14} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Link
          href={user ? "/dashboard" : "/login"}
          className="btn btn-ghost w-full !py-4 !rounded-2xl text-center justify-center"
        >
          {user ? "Ir a mi huevsite" : "Armá tu huevsite — gratis"}
        </Link>
      </div>

      {/* PRO — highlighted */}
      <div className="flex flex-col bg-white/[0.03] border border-[var(--accent)]/40 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl shadow-[var(--accent)]/5 md:-mt-4 md:mb-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--accent)]/10 blur-[100px] rounded-full opacity-60 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--accent)]">Pro</span>
            <span className="text-[9px] bg-[var(--accent)] text-black px-2 py-0.5 rounded font-black uppercase tracking-wider">Más elegido</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-black text-white">$9</span>
            <span className="text-sm font-mono text-[var(--text-muted)]">USD/mes</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-8">Para builders que quieren destacar y ser descubiertos.</p>
          <ul className="space-y-3 text-left mb-8 flex-1">
            {['Dominio .com personalizado', 'Insights y métricas en tiempo real', 'Boost de Scoring (más visibilidad)', 'Sub-sitios ilimitados', 'Hasta 22 bloques en tu grid', 'Verified Badge oficial'].map(item => (
              <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-dim)]">
                <Check size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href={proHref}
            className="btn btn-accent w-full !py-4 !text-base !font-bold !rounded-2xl text-center justify-center"
          >
            {user ? "Mejorar a Pro →" : "Hacerme Pro →"}
          </Link>
          <p className="mt-4 text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest opacity-40 text-center">Cancelás cuando quieras</p>
        </div>
      </div>

      {/* FOUNDER — one-time / lifetime */}
      <div className="flex flex-col bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--text-muted)]">Founder</span>
          <span className="text-[9px] border border-white/15 text-[var(--text-dim)] px-2 py-0.5 rounded font-black uppercase tracking-wider">Pago único</span>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-5xl font-black text-white">$79</span>
          <span className="text-sm font-mono text-[var(--text-muted)]">una vez</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-8">Pro de por vida, pagás una vez. Para los primeros que apuestan al proyecto.</p>
        <ul className="space-y-3 text-left mb-8 flex-1">
          {['Todo lo de Pro, para siempre', 'Sin pagos mensuales nunca más', 'Badge Founder exclusivo', 'Apoyás a un proyecto indie de LATAM'].map(item => (
            <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-dim)]">
              <Check size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {lemonLifetimeCheckoutUrl ? (
          <Link
            href={founderHref}
            className="btn btn-ghost w-full !py-4 !rounded-2xl text-center justify-center"
          >
            Quiero el lifetime →
          </Link>
        ) : (
          <button
            disabled
            className="btn btn-ghost w-full !py-4 !rounded-2xl text-center justify-center opacity-40 cursor-not-allowed"
          >
            Pronto
          </button>
        )}
      </div>
    </>
  );
}
