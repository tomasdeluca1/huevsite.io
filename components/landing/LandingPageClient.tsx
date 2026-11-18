"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import LocaleToggle from "@/components/LocaleToggle";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";
import { CommunityValue } from "@/components/landing/CommunityValue";
import { CommunityWallHero } from "@/components/landing/CommunityWallHero";
import type { CommunityWall } from "@/lib/community-wall";
import { LatamFlags } from "@/components/landing/LatamFlags";
import { BuilderSpotlightCard } from "@/components/landing/BuilderSpotlightCard";
import { supabase } from "@/lib/supabase";
import { PricingTiers } from "@/components/landing/PricingTiers";
import { User } from "@supabase/supabase-js";
import { Activity, Compass, PlusCircle, Layout, Check, BookOpen, Globe, BarChart3, Loader2, ArrowRight, Sparkles, Zap, LayoutGrid, Eye, ChevronDown, ChevronUp, X, Trophy, TrendingUp, HeartHandshake, Rocket, ArrowBigUp, CalendarDays, ThumbsUp } from "lucide-react";
import type { LandingTestimonial } from "@/lib/testimonial-service";
import type { Faq } from "@/lib/faq-service";
import type { NetworkPulse, WinnerHistoryItem } from "@/lib/showcase-service";
import { toEmbedUrl } from "@/lib/site-settings-service";
import { trackEvent, HERO_VARIANT_KEY } from "@/lib/track";
import type { FounderOffer } from "@/lib/founder-offer";
import type { CheckoutAttribution } from "@/lib/checkout-attribution";
import { Logo } from "@/components/brand/Logo";

interface LandingPageClientProps {
  showcaseData: any;
  testimonials?: LandingTestimonial[];
  faqs?: Faq[];
  founderVideoUrl?: string;
  founderQuote?: string;
  activeThisWeek?: number;
  networkPulse?: NetworkPulse;
  /** A/B: sticky hero-headline variant, assigned server-side (app/page.tsx). */
  heroAbVariant?: HeroAbVariant;
  /** Precio y checkout Founder según el cupo vivo. */
  founderOffer: FounderOffer;
  /** Query string de UTMs para el login de vuelta. */
  utm?: string;
  attribution?: CheckoutAttribution | null;
  /** El muro del hero: fotos de la comunidad, los más activos primero. */
  communityWall?: CommunityWall;
  /** Builders de la Semana, el más reciente primero. */
  winners?: WinnerHistoryItem[];
  /** Proyectos visibles en perfiles. */
  projectCount?: number;
}

type HeroVariant = "claim" | "social" | "product";
/** T1 experiment: identity-challenge H1 (control) vs outcome-focused H1. */
export type HeroAbVariant = "identity" | "outcome";

export default function LandingPageClient({ showcaseData, testimonials = [], faqs = [], founderVideoUrl = "", founderQuote = "", activeThisWeek = 0, networkPulse, heroAbVariant = "identity", founderOffer, utm, attribution, communityWall = { total: 0, builders: [] }, winners = [], projectCount = 0 }: LandingPageClientProps) {
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const locale = useLocale();
  // Format numbers with the ACTIVE locale explicitly. Bare `.toLocaleString()`
  // uses the runtime default locale, which differs between the Node server
  // ("1.635") and the browser ("1635"), causing a hydration mismatch.
  const fmtNum = (n: number) => n.toLocaleString(locale === "en" ? "en-US" : "es-AR");
  const founderVideo = founderVideoUrl ? toEmbedUrl(founderVideoUrl) : null;
  const [heatmap, setHeatmap] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [heroVariant] = useState<HeroVariant>("social");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [claimInput, setClaimInput] = useState("");
  const [claimStatus, setClaimStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "error">("idle");
  const [claimSuggestions, setClaimSuggestions] = useState<string[]>([]);

  const heroProfiles = useMemo(() => {
    if (!showcaseData) return [];
    const transformUser = (rawUser: any) => {
      if (!rawUser) return null;
      const transformedBlocks = (rawUser.blocks || []).map((block: any) => {
        const { id, type, order, col_span, row_span, visible, ...cleanData } = block.data || {};
        return {
          id: block.id, type: block.type, order: block.order,
          col_span: block.col_span || col_span || 1,
          row_span: block.row_span || row_span || 1,
          visible: block.visible, ...cleanData,
        };
      });
      return { ...rawUser, blocks: transformedBlocks };
    };
    if (showcaseData.randoms?.length > 0) {
      return showcaseData.randoms.map((r: any) => transformUser(r)).filter(Boolean);
    }
    if (showcaseData.winners?.length > 0) {
      return showcaseData.winners.map((w: any) => transformUser(w.user)).filter(Boolean);
    }
    return [];
  }, [showcaseData]);

  const heroRich = {
    accent: (chunks: ReactNode) => <span className="accent">{chunks}</span>,
    br: () => <br className="hidden md:block" />,
  };

  const heroExperiment = {
    claim: {
      eyebrow: t("heroClaimEyebrow"),
      title: t.rich("heroClaimTitle", heroRich),
      description: t("heroClaimDescription"),
      primaryHref: "/explore",
      primaryLabel: t("heroClaimPrimary"),
      secondaryHref: "/onboarding",
      secondaryLabel: t("heroClaimSecondary"),
    },
    social: {
      eyebrow: t("heroSocialEyebrow"),
      // T1: only the H1 changes between variants (isolate the variable).
      title: t.rich(heroAbVariant === "outcome" ? "heroSocialTitleOutcome" : "heroSocialTitle", heroRich),
      description: t("heroSocialDescription"),
      primaryHref: user ? "/dashboard" : "/login",
      primaryLabel: user ? t("heroDashboardCta") : t("heroBuildCta"),
      secondaryHref: "/explore",
      secondaryLabel: t("heroSocialSecondary"),
    },
    product: {
      eyebrow: t("heroProductEyebrow"),
      title: t.rich("heroProductTitle", heroRich),
      description: t("heroProductDescription"),
      primaryHref: "/explore",
      primaryLabel: t("heroProductPrimary"),
      secondaryHref: user ? "/dashboard" : "/login",
      secondaryLabel: user ? t("heroDashboardCta") : t("heroBuildCta"),
    },
  } satisfies Record<HeroVariant, {
    eyebrow: string;
    title: ReactNode;
    description: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
  }>;

  const currentHero = heroExperiment[heroVariant];
  const normalizedClaim = claimInput.trim().toLowerCase();
  const claimPath = normalizedClaim ? `/onboarding?claim=${encodeURIComponent(normalizedClaim)}` : "/onboarding";
  const claimHref = user ? claimPath : `/login?next=${encodeURIComponent(claimPath)}`;
  // Every landing event carries the A/B dimension so any funnel metric can be
  // split by variant in umami without per-callsite plumbing.
  const trackLandingEvent = (eventName: string, payload: Record<string, any>) => {
    trackEvent(eventName, { ab: heroAbVariant, ...payload });
  };

  const submitClaim = () => {
    if (claimStatus !== "available") return;
    window.localStorage.setItem("huevsite_pending_claim", normalizedClaim);
    trackLandingEvent("landing_claim_submit", { variant: heroVariant, username: normalizedClaim });
    window.location.href = claimHref;
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    // Subscribe to auth changes to ensure UI updates when user is logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Si caemos en /?code=... (por error de config de Supabase), redirigimos al callback
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        window.location.href = `/auth/callback?code=${code}`;
      }

      // Persist the server-assigned A/B variant so every future visit (SSR reads
      // the cookie) and downstream funnel event (localStorage) sees the same one.
      document.cookie = `${HERO_VARIANT_KEY}=${heroAbVariant}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
      try {
        window.localStorage.setItem(HERO_VARIANT_KEY, heroAbVariant);
      } catch { /* storage unavailable */ }

      trackLandingEvent("landing_hero_seen", { variant: "social" });
    }

    const cells = [];
    for (let i = 0; i < 182; i++) {
      const r = Math.random();
      let cls = 'hm-cell';
      if (r > 0.85) cls += ' hm-4';
      else if (r > 0.65) cls += ' hm-3';
      else if (r > 0.45) cls += ' hm-2';
      else if (r > 0.3) cls += ' hm-1';
      cells.push(cls);
    }
    setHeatmap(cells);

    // Scroll stop detection - simplified to show for everyone
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Siempre lo ocultamos al movernos para evitar ruido
      setShowMobileNav(false);
      clearTimeout(scrollTimeout);

      // Lo mostramos al frenar el scroll
      scrollTimeout = setTimeout(() => {
        setShowMobileNav(true);
      }, 400);
    };

    // Mostrarlo inicialmente si estamos quietos
    setShowMobileNav(true);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    if (normalizedClaim.length === 0) {
      setClaimStatus("idle");
      setClaimSuggestions([]);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(normalizedClaim)) {
      setClaimStatus("invalid");
      setClaimSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setClaimStatus("checking");
        const response = await fetch(`/api/username/check?u=${encodeURIComponent(normalizedClaim)}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (data.available) {
          setClaimStatus("available");
          setClaimSuggestions([]);
        } else {
          setClaimStatus("taken");
          setClaimSuggestions(data.suggestions || []);
        }
        // Availability rate of what visitors actually type — if "taken"
        // dominates, the suggestion chips become the conversion-critical path.
        trackLandingEvent("landing_claim_check", { result: data.available ? "available" : "taken" });
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        setClaimStatus("error");
        setClaimSuggestions([]);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [normalizedClaim]);

  // Price Section - Show to everyone
  const showPricing = true;

  return (
    <div className="landing">
      {/* NAV — same header component, but tabs hidden so it doesn't compete with the hero */}
      <DiscoveryHeader currentUserId={user?.id ?? null} hideTabs />

      {/* MOBILE FLOATING NAV */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:hidden fixed bottom-8 left-1/2 z-[100] w-[90%] max-w-[400px]"
          >
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center justify-between shadow-2xl">
              <Link href="/feed" className="flex-1 flex flex-col items-center gap-1 py-1.5 text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors">
                <Activity size={18} />
                <span className="text-[9px] font-bold uppercase tracking-tighter">{tNav("feed")}</span>
              </Link>
              <Link href="/explore" className="flex-1 flex flex-col items-center gap-1 py-1.5 text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors">
                <Compass size={18} />
                <span className="text-[9px] font-bold uppercase tracking-tighter">{tNav("explore")}</span>
              </Link>
              <Link href="/blog" className="flex-1 flex flex-col items-center gap-1 py-1.5 text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors">
                <BookOpen size={18} />
                <span className="text-[9px] font-bold uppercase tracking-tighter">{tNav("blog")}</span>
              </Link>
              <Link href={user ? "/dashboard" : "/login"} className="flex-1 flex flex-col items-center gap-1 py-1.5 text-[var(--accent)] transition-colors">
                {user ? <Layout size={18} /> : <PlusCircle size={18} />}
                <span className="text-[9px] font-bold uppercase tracking-tighter">{user ? tNav("myHuevsite") : tNav("create")}</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO — el muro de la comunidad, como la imagen al compartir la home */}
      <CommunityWallHero
        builders={communityWall.builders}
        onBuilderClick={(username) => trackLandingEvent("landing_wall_click", { username })}
      >
        <div className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
          {t("wallEyebrow")}
        </div>
        <h1 className="text-balance text-[clamp(38px,6.6vw,76px)] font-extrabold leading-[0.98] tracking-[-0.045em] text-white">
          {communityWall.total > 0
            ? t.rich("wallTitle", { count: fmtNum(communityWall.total), accent: (chunks) => <span className="text-[var(--accent)]">{chunks}</span> })
            : t("wallTitleFallback")}
        </h1>

        {user && (
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href={currentHero.primaryHref}
              className="btn btn-accent !px-8 !py-4 text-base"
              onClick={() => trackLandingEvent("landing_hero_primary_click", { variant: heroVariant, href: currentHero.primaryHref })}
            >
              {currentHero.primaryLabel}
            </Link>
            <Link
              href={currentHero.secondaryHref}
              className="btn btn-ghost !px-6 !py-4 text-sm"
              onClick={() => trackLandingEvent("landing_hero_secondary_click", { variant: heroVariant, href: currentHero.secondaryHref })}
            >
              {currentHero.secondaryLabel}
            </Link>
          </div>
        )}

            {!user && (
              <div className="w-full max-w-[440px] mx-auto flex flex-col items-center gap-3">
                <div
                  className={`flex w-full items-center rounded-2xl border bg-[#0e0e0f]/95 overflow-hidden transition-colors ${
                    claimStatus === "available"
                      ? "border-[var(--accent)]/50"
                      : claimStatus === "taken" || claimStatus === "invalid"
                      ? "border-red-400/40"
                      : "border-white/10"
                  }`}
                >
                  <span className="pl-3.5 sm:pl-4 py-3 text-sm font-mono text-[var(--text-muted)] select-none shrink-0">huevsite.io/</span>
                  <input
                    value={claimInput}
                    onChange={(e) => setClaimInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") submitClaim(); }}
                    placeholder={t("claimPlaceholder")}
                    maxLength={20}
                    aria-label={t("claimAriaLabel")}
                    className="min-w-0 flex-1 bg-transparent py-3 pr-1 text-sm font-mono text-white outline-none placeholder:text-white/25"
                  />
                  <span className="flex w-5 shrink-0 items-center justify-center">
                    {claimStatus === "checking" && <Loader2 size={14} className="animate-spin text-white/40" />}
                    {claimStatus === "available" && <Check size={14} className="text-[var(--accent)]" />}
                    {(claimStatus === "taken" || claimStatus === "invalid") && <X size={14} className="text-red-400" />}
                  </span>
                  <button
                    onClick={submitClaim}
                    disabled={claimStatus !== "available"}
                    className="m-1.5 ml-1.5 shrink-0 rounded-xl bg-[var(--accent)] px-3.5 sm:px-4 py-2 text-sm font-bold text-black transition-opacity disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap min-h-[44px]"
                  >
                    {t("claimButton")}
                  </button>
                </div>
                {/* Trust microcopy at the point of max intent (the claim bar IS the
                    primary CTA) — the same reassurance was previously only visible
                    on the preview card and the final CTA. */}
                <div className="text-[11px] font-mono text-white/35">{t("claimTrustLine")}</div>
                {claimStatus === "invalid" && (
                  <div className="text-[11px] font-mono text-red-300/80">{t("claimInvalid")}</div>
                )}
                {claimStatus === "taken" && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <span className="text-[11px] font-mono text-red-300/80">{t("claimTaken")}</span>
                    {claimSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setClaimInput(suggestion);
                          trackLandingEvent("landing_claim_suggestion_click", { variant: heroVariant, suggestion });
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-mono text-[var(--text-dim)] hover:border-[var(--accent)]/40 hover:text-white transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <Link
                  href={currentHero.secondaryHref}
                  onClick={() => trackLandingEvent("landing_hero_secondary_click", { variant: heroVariant, href: currentHero.secondaryHref })}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-dim)] hover:text-white transition-colors"
                >
                  {currentHero.secondaryLabel}
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}

      </CommunityWallHero>

      {/* POR QUÉ EXISTE HUEVSITE — el manifiesto corto + números reales de la
          comunidad (nunca inventados: cada celda se oculta si el dato es
          débil o la consulta falla). */}
      <section style={{ padding: 'var(--section-y) var(--section-x) 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="text-center">
          <div className="section-label" style={{ justifyContent: 'center' }}>{t("manifestoLabel")}</div>
          <h2 className="section-title text-center mx-auto">{t.rich("manifestoTitle", heroRich)}</h2>
          <p className="section-sub mx-auto max-w-[620px]">
            {t("manifestoBody")}
            <LatamFlags />
          </p>
        </div>

      </section>

      {/* CÓMO FUNCIONA — el portfolio builder en 3 pasos. La preview de la
          derecha es BuilderSpotlightCard con blocks reales de showcaseData
          (el mismo shape que usa WinnerSection), nunca copy inventado: si no
          hay builders con blocks válidos, el componente no renderiza nada. */}
      <section style={{ padding: 'var(--section-y) var(--section-x) 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className={`grid grid-cols-1 items-center gap-10 ${heroProfiles.length > 0 ? "lg:grid-cols-2 lg:gap-14" : ""}`}>
            <div className={heroProfiles.length > 0 ? "text-center lg:text-left" : "mx-auto max-w-2xl text-center"}>
              <div className={`section-label ${heroProfiles.length > 0 ? "text-center lg:text-left" : "justify-center"}`}>{t("howLabel")}</div>
              <h2 className="section-title">{t.rich("howTitle", heroRich)}</h2>
              <p className={`section-sub ${heroProfiles.length > 0 ? "mx-auto lg:mx-0" : "mx-auto"}`}>{t("howSub")}</p>

              <div className="mt-7 flex flex-col gap-4 text-left">
                {[
                  { icon: Sparkles, title: t("howStep1Title"), desc: t("howStep1Desc") },
                  { icon: LayoutGrid, title: t("howStep2Title"), desc: t("howStep2Desc") },
                  { icon: Globe, title: t("howStep3Title"), desc: t("howStep3Desc") },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.title} className="flex items-start gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black tracking-tight text-white">{i + 1}. {s.title}</div>
                        <p className="mt-0.5 text-sm leading-6 text-[var(--text-dim)]">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  onClick={() => trackLandingEvent("landing_how_primary_click", { href: user ? "/dashboard" : "/login" })}
                  className="btn btn-accent !px-7 !py-3.5 text-base w-full sm:w-auto"
                >
                  {user ? t("heroDashboardCta") : t("heroBuildCta")}
                </Link>
                <Link
                  href="/explore"
                  onClick={() => trackLandingEvent("landing_how_secondary_click", { href: "/explore" })}
                  className="btn btn-ghost !px-6 !py-3.5 text-sm w-full sm:w-auto"
                >
                  {t("howSecondaryCta")}
                </Link>
              </div>
            </div>

            {heroProfiles.length > 0 && (
              <div className="relative w-full max-w-[440px] mx-auto lg:mx-0 lg:ml-auto">
                <div className="hpp-badge mb-3 justify-center lg:justify-start">
                  <Eye size={12} />
                  {t("howPreviewBadge")}
                </div>
                <BuilderSpotlightCard builders={heroProfiles} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LA COMUNIDAD TE DA — la vuelta completa: publicás, te ven, te votan,
          te destacan. Cifras reales + Builder de la Semana, Builders Hunt y score. */}
      <CommunityValue
        totalBuilders={communityWall.total}
        projectCount={projectCount}
        activeThisWeek={activeThisWeek}
        winners={winners}
        networkPulse={networkPulse}
        loggedIn={!!user}
        onTrack={(event, payload) => trackLandingEvent(event, payload ?? {})}
      />

      {/* TESTIMONIALS — social proof before the ask (Marc Lou #29). Hidden when empty. */}
      {testimonials.length > 0 && (
        <section style={{ padding: 'var(--section-y) var(--section-x)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>{t("testimonialsSectionLabel")}</div>
            <h2 className="section-title text-center">{t("testimonialsTitle")}</h2>
            {/* Adaptive: 1 → centered card, 2 → pair, 3+ → grid (never a lonely card). */}
            <div className={`mt-10 ${
              testimonials.length === 1
                ? "max-w-2xl mx-auto"
                : testimonials.length === 2
                ? "grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto"
                : "grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            }`}>
              {testimonials.map((t) => (
                <div key={t.id} className="flex flex-col bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <p className="text-sm text-[var(--text-dim)] leading-relaxed flex-1">“{t.quote}”</p>
                  <a href={`/${t.username}`} className="flex items-center gap-3 mt-5 group">
                    {t.avatarUrl ? (
                      <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate group-hover:underline">{t.name}</div>
                      <div className="text-xs font-mono text-[var(--text-muted)] truncate">@{t.username}</div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/testimonio" className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                {t("testimonialsCta")}
              </Link>
            </div>
          </div>
        </section>
      )}

      <section id="precios" className="pro-promo-section" style={{ padding: 'var(--section-y) var(--section-x)', background: 'linear-gradient(180deg, transparent 0%, rgba(200,255,0,0.03) 100%)', borderTop: '1px solid rgba(255,255,255,0.05)', scrollMarginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label" style={{ color: 'var(--accent)' }}>{t("proSectionLabel")}</div>
          <h2 className="section-title">{t("proTitlePrefix")} <span style={{ color: 'var(--accent)' }}>{t("proTitleAccent")}</span></h2>
          <p className="section-sub" style={{ marginBottom: '60px' }}>{t("proSub")}</p>

          <div className="pro-bento">
            {/* HERO tile — the reach flagship: you get surfaced first */}
            <div className="pro-bento-hero">
              <div>
                <div className="pro-bento-icon"><Zap size={20} /></div>
                <h3 className="pro-bento-hero-title">{t("proFeatureVisibilityTitle")}</h3>
                <p className="pro-bento-hero-desc">{t("proFeatureVisibilityDesc")}</p>
                <div className="pro-bento-surfaces">{t("proBentoHeroSurfaces")}</div>
              </div>
              {/* Ranking motif: your card rising to #1 */}
              <div className="pro-rank" aria-hidden="true">
                <div className="pro-rank-row"><span className="pro-rank-n">03</span><span className="pro-rank-bar" /></div>
                <div className="pro-rank-row"><span className="pro-rank-n">02</span><span className="pro-rank-bar" /></div>
                <div className="pro-rank-row is-you">
                  <span className="pro-rank-n">01</span>
                  <span className="pro-rank-you">@{t("proBentoYou")}</span>
                  <ChevronUp size={16} />
                </div>
              </div>
            </div>

            {[
              { icon: Globe, title: t("proFeatureDomainTitle"), desc: t("proFeatureDomainDesc") },
              { icon: BarChart3, title: t("proFeatureInsightsTitle"), desc: t("proFeatureInsightsDesc") },
              { icon: LayoutGrid, title: t("proFeatureSubsitesTitle"), desc: t("proFeatureSubsitesDesc") },
              { icon: Layout, title: t("proFeatureGridTitle"), desc: t("proFeatureGridDesc") },
              { icon: Rocket, title: t("proFeatureLaunchTitle"), desc: t("proFeatureLaunchDesc") }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="pro-bento-tile">
                  <div className="pro-bento-icon"><Icon size={18} /></div>
                  <h3 className="pro-bento-title">{f.title}</h3>
                  <p className="pro-bento-desc">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Pricing — bridges from the value above into the ask, same section. */}
          {showPricing && (
            <div className="mt-20">
              <div className="section-label" style={{ color: 'var(--accent)' }}>{t("proPricingLabel")}</div>
              <p className="section-sub" style={{ marginBottom: '40px' }}>{t("proPricingLead")}</p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch"
              >
                <PricingTiers
                  user={user ? { id: user.id, email: user.email } : null}
                  loginNext="/"
                  utm={utm}
                  attribution={attribution}
                  founderOffer={founderOffer}
                />
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ — objection handling at the decision point (admin-managed). Hidden when empty. */}
      {faqs.length > 0 && (
        <section style={{ padding: 'var(--section-y) var(--section-x) 0' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>{t("faqSectionLabel")}</div>
            <h2 className="section-title text-center">{t("faqTitle")}</h2>
            <div className="mt-10 space-y-3">
              {faqs.map((f) => {
                const open = openFaq === f.id;
                return (
                  <div key={f.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-colors hover:border-white/10">
                    <button
                      onClick={() => {
                        if (!open) trackLandingEvent("landing_faq_open", { question: f.question });
                        setOpenFaq(open ? null : f.id);
                      }}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left"
                    >
                      <span className="text-[15px] font-bold text-white">{f.question}</span>
                      <ChevronDown size={18} className={`shrink-0 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <div className="px-5 pb-5 -mt-1 text-sm text-[var(--text-dim)] leading-relaxed">
                        {f.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FOUNDER — people buy from people (Marc Lou #15). Video if set in admin, else text. */}
      <section style={{ padding: 'var(--section-y) var(--section-x)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {founderVideo && (founderVideo.embed || founderVideo.file) ? (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)] mb-4 text-center">
                {t("founderEyebrow")}
              </div>
              <div className="rounded-[1.5rem] overflow-hidden border border-white/[0.08] bg-black aspect-video">
                {founderVideo.file ? (
                  <video src={founderVideo.file} controls playsInline className="w-full h-full object-cover" />
                ) : (
                  <iframe
                    src={founderVideo.embed!}
                    title={t("founderVideoTitle")}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                )}
              </div>
              <a href="/_tomidelu" className="group flex items-center justify-center gap-3 mt-5">
                <img
                  src="https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/39wv6adk9l8-1778691295879.webp"
                  alt="Tomas Deluca"
                  className="w-11 h-11 rounded-full object-cover border border-[var(--accent)]/40"
                />
                <div className="text-left text-[13px] font-mono">
                  <div className="font-bold text-white/85 group-hover:underline">
                    Tomas Deluca <span className="text-[var(--accent)]">@_tomidelu</span>
                  </div>
                  <div className="text-[var(--text-muted)]">{t("founderRole")}</div>
                </div>
              </a>
            </div>
          ) : (
            <a
              href="/_tomidelu"
              className="group flex flex-col sm:flex-row sm:items-stretch gap-6 sm:gap-7 p-7 sm:p-9 rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] border border-white/[0.07] hover:border-[var(--accent)]/30 transition-colors text-center sm:text-left"
            >
              <div className="flex flex-col items-center sm:items-start shrink-0">
                {/* plain img: avatar is webp; the landing renders avatars without next/image */}
                <img
                  src="https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/39wv6adk9l8-1778691295879.webp"
                  alt="Tomas Deluca"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent)]/40"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)] mb-3">
                  {t("founderEyebrow")}
                </div>
                <p className="text-base sm:text-[19px] text-white/90 leading-relaxed font-medium mb-4">
                  {founderQuote
                    ? `“${founderQuote}”`
                    : (
                      t.rich("founderQuoteFallback", {
                        accent: (chunks) => <span style={{ color: 'var(--accent)' }}>{chunks}</span>,
                      })
                    )}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 text-[13px] font-mono text-[var(--text-muted)]">
                  <span className="font-bold text-white/80">Tomas Deluca</span>
                  <span className="text-[var(--accent)] group-hover:underline">@_tomidelu</span>
                  <span className="hidden sm:inline text-white/20">·</span>
                  <span className="hidden sm:inline">{t("founderTagline")}</span>
                </div>
              </div>
            </a>
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta-section">
        <div className="final-cta-inner">
          <div className="section-label" style={{ justifyContent: 'center' }}>{t("finalCtaSectionLabel")}</div>
          <h2 className="final-cta-title">
            {t("finalCtaTitleLine1")}<br /><span style={{ color: 'var(--accent)' }}>{t("finalCtaTitleLine2")}</span>
          </h2>
          <p className="final-cta-sub">
            {t("finalCtaSubLine1")}<br />{t("finalCtaSubLine2")}
          </p>
          <div className="final-cta-actions">
            <Link
              href={user ? "/dashboard" : "/login"}
              onClick={() => trackLandingEvent("landing_final_cta_click", { href: user ? "/dashboard" : "/login" })}
              className="btn btn-accent"
              style={{ fontSize: '17px', padding: '16px 40px' }}
            >
              {user ? (
                <>
                  <Layout size={18} className="mr-2 inline" />
                  <span>{t("finalCtaUserButton")}</span>
                </>
              ) : (
                <span>{t("finalCtaGuestButton")}</span>
              )}
            </Link>
            {!user && (
              <Link href="/explore" className="btn btn-ghost" style={{ fontSize: '15px', padding: '16px 28px' }}>
                {t("finalCtaSecondary")}
              </Link>
            )}
          </div>
          <div className="final-cta-meta">
            <span>{t("finalCtaMetaNoCard")}</span>
            <span className="final-cta-dot">·</span>
            <span>{t("finalCtaMetaReady")}</span>
            <span className="final-cta-dot">·</span>
            <span>{t("finalCtaMetaByBuilders")}</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Logo className="h-6 w-auto" />
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {tFooter("tagline")}{' '}
            <a
              href="https://huevsite.studio"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'underline', textDecorationColor: 'var(--border)', textUnderlineOffset: '2px' }}
            >
              Huevsite Studio
            </a>
            .
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/mcp" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>{tFooter("agents")}</Link>
          <Link href="/blog" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>{tFooter("blog")}</Link>
          <Link href="https://x.com/i/communities/2026312282527932637" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>X Community</Link>
          <Link href="https://discord.gg/qE4CWG6D" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>Discord Community</Link>
          <Link href="https://github.com/tomasdeluca1" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>GitHub</Link>
          <LocaleToggle />
        </div>
      </footer>
    </div>
  );
}
