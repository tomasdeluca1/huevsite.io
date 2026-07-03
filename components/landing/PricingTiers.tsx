"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { lemonLifetimeCheckoutUrl, buildLemonCheckoutUrl } from "@/lib/lemon-checkout-url";
import { trackEvent } from "@/lib/track";

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
  founderRemaining,
}: {
  user: PricingUser | null;
  loginNext?: string;
  /** Query string de UTMs (sin ? inicial), p.ej. "utm_source=email&utm_campaign=somos-200". */
  utm?: string;
  /** Founder batch: asientos restantes (vivo, cap - is_lifetime). Omitir/negativo = sin contador. */
  founderRemaining?: number | null;
}) {
  const t = useTranslations("pricing");
  // Deslogueado: volvemos a la misma página CON los UTMs, así tras loguearse el
  // checkout ya los arrastra. Logueado: van directo a la URL de Lemon.
  const nextTarget = appendQuery(loginNext, utm);
  const loginHref = `/login?next=${encodeURIComponent(nextTarget)}`;
  const proHref = user ? appendQuery(buildLemonCheckoutUrl(user.id, user.email), utm) : loginHref;
  const founderHref = user
    ? appendQuery(buildLemonCheckoutUrl(user.id, user.email, lemonLifetimeCheckoutUrl), utm)
    : loginHref;
  const trackTier = (tier: "free" | "pro" | "founder") =>
    trackEvent("landing_pricing_click", { tier, loggedIn: !!user?.id });

  return (
    <>
      {/* FREE */}
      <div className="flex flex-col bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--text-muted)] mb-3 block">{t("freeLabel")}</span>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-5xl font-black text-white">$0</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-8">{t("freeSubtitle")}</p>
        <ul className="space-y-3 text-left mb-8 flex-1">
          {[t("freeFeature1"), t("freeFeature2"), t("freeFeature3"), t("freeFeature4")].map(item => (
            <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-dim)]">
              <Check size={14} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Link
          href={user ? "/dashboard" : "/login"}
          onClick={() => trackTier("free")}
          className="btn btn-ghost w-full !py-4 !rounded-2xl text-center justify-center"
        >
          {user ? t("freeCtaUser") : t("freeCtaGuest")}
        </Link>
      </div>

      {/* PRO — highlighted */}
      <div className="flex flex-col bg-white/[0.03] border border-[var(--accent)]/40 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl shadow-[var(--accent)]/5 md:-mt-4 md:mb-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--accent)]/10 blur-[100px] rounded-full opacity-60 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--accent)]">{t("proLabel")}</span>
            <span className="text-[9px] bg-[var(--accent)] text-black px-2 py-0.5 rounded font-black uppercase tracking-wider">{t("proBadge")}</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-black text-white">$9</span>
            <span className="text-sm font-mono text-[var(--text-muted)]">{t("proPriceUnit")}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-8">{t("proSubtitle")}</p>
          <ul className="space-y-3 text-left mb-8 flex-1">
            {[t("proFeature1"), t("proFeature2"), t("proFeature3"), t("proFeature4"), t("proFeature5"), t("proFeature6")].map(item => (
              <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-dim)]">
                <Check size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href={proHref}
            onClick={() => trackTier("pro")}
            className="btn btn-accent w-full !py-4 !text-base !font-bold !rounded-2xl text-center justify-center"
          >
            {user ? t("proCtaUser") : t("proCtaGuest")}
          </Link>
          <p className="mt-4 text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest opacity-40 text-center">{t("proCancelNote")}</p>
        </div>
      </div>

      {/* FOUNDER — one-time / lifetime */}
      <div className="flex flex-col bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--text-muted)]">{t("founderLabel")}</span>
          <span className="text-[9px] border border-white/15 text-[var(--text-dim)] px-2 py-0.5 rounded font-black uppercase tracking-wider">{t("founderBadge")}</span>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-5xl font-black text-white">$79</span>
          <span className="text-sm font-mono text-[var(--text-muted)]">{t("founderPriceUnit")}</span>
        </div>
        {/* Founder batch: live scarcity (never renders a made-up number — the
            count comes from profiles.is_lifetime via getFounderSeats). */}
        {typeof founderRemaining === "number" && founderRemaining > 0 && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] w-fit">
            {t("founderSeatsLeft", { n: founderRemaining })}
          </div>
        )}
        <p className="text-xs text-[var(--text-muted)] mb-8">{t("founderSubtitle")}</p>
        <ul className="space-y-3 text-left mb-8 flex-1">
          {[t("founderFeature1"), t("founderFeature2"), t("founderFeature3"), t("founderFeature4")].map(item => (
            <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-dim)]">
              <Check size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {lemonLifetimeCheckoutUrl ? (
          <Link
            href={founderHref}
            onClick={() => trackTier("founder")}
            className="btn btn-ghost w-full !py-4 !rounded-2xl text-center justify-center"
          >
            {t("founderCta")}
          </Link>
        ) : (
          <button
            disabled
            className="btn btn-ghost w-full !py-4 !rounded-2xl text-center justify-center opacity-40 cursor-not-allowed"
          >
            {t("founderCtaSoon")}
          </button>
        )}
      </div>
    </>
  );
}
