"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { WinnerSection } from "@/components/landing/WinnerSection";
import { BuilderSpotlightCard } from "@/components/landing/BuilderSpotlightCard";
import { LatamFlags } from "@/components/landing/LatamFlags";
import { supabase } from "@/lib/supabase";
import { PricingTiers } from "@/components/landing/PricingTiers";
import { User } from "@supabase/supabase-js";
import { Activity, Compass, Users, PlusCircle, Layout, Check, BookOpen, Globe, BarChart3, Loader2, ArrowRight, Sparkles, Zap, Star, LayoutGrid, Eye, ChevronDown, X, Trophy, TrendingUp, HeartHandshake } from "lucide-react";
import type { LandingTestimonial } from "@/lib/testimonial-service";
import type { Faq } from "@/lib/faq-service";
import type { NetworkPulse } from "@/lib/showcase-service";
import { toEmbedUrl } from "@/lib/site-settings-service";

interface LandingPageClientProps {
  showcaseData: any;
  testimonials?: LandingTestimonial[];
  faqs?: Faq[];
  founderVideoUrl?: string;
  founderQuote?: string;
  activeThisWeek?: number;
  networkPulse?: NetworkPulse;
}

type HeroVariant = "claim" | "social" | "product";

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, any>) => void;
    };
  }
}

export default function LandingPageClient({ showcaseData, testimonials = [], faqs = [], founderVideoUrl = "", founderQuote = "", activeThisWeek = 0, networkPulse }: LandingPageClientProps) {
  const founderVideo = founderVideoUrl ? toEmbedUrl(founderVideoUrl) : null;
  const [heatmap, setHeatmap] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Developer', 'Founder']);
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

  const heroExperiment = {
    claim: {
      eyebrow: "Reclamá tu URL antes de seguir scrolleando",
      title: (
        <>
          Tu <span className="accent">nombre</span>, tu trabajo, <br className="hidden md:block" />
          tu rincón en <br className="hidden md:block" />
          internet.
        </>
      ),
      description: "Tu URL única, lista en 3 minutos. Probá si tu username está libre ahora mismo — sin crear cuenta todavía.",
      primaryHref: "/explore",
      primaryLabel: "Ver cómo se ve uno bueno",
      secondaryHref: "/onboarding",
      secondaryLabel: "Armá tu huevsite — gratis",
    },
    social: {
      eyebrow: "mostrá lo que buildeás",
      title: (
        <>
          No digas que sos builder.<br className="hidden md:block" />{" "}
          <span className="accent">Probalo.</span>
        </>
      ),
      description: "El perfil vivo donde los builders de LATAM se muestran, se rankean y se descubren. Tus proyectos, tu código y tus métricas reales — en una URL que pelea por la portada.",
      primaryHref: user ? "/dashboard" : "/login",
      primaryLabel: user ? "Ir a mi dashboard" : "Armá tu huevsite — gratis",
      secondaryHref: "/explore",
      secondaryLabel: "Ver perfiles reales",
    },
    product: {
      eyebrow: "Así luce tu perfil en producción",
      title: (
        <>
          Tu perfil. <span className="accent">Vivo</span>. <br className="hidden md:block" />
          Listo para <br className="hidden md:block" />
          compartir.
        </>
      ),
      description: "Un bento grid con tus proyectos, GitHub y stack. Una URL que dice más que cualquier CV en dos líneas.",
      primaryHref: "/explore",
      primaryLabel: "Ver perfiles reales →",
      secondaryHref: user ? "/dashboard" : "/login",
      secondaryLabel: user ? "Ir a mi dashboard" : "Armá tu huevsite — gratis",
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

  const contentPath = [
    {
      href: "/explore",
      label: "Explorar builders",
      copy: "Mirar cómo se presentan otros y sacar ideas rápido.",
      icon: Compass,
    },
    {
      href: "/feed",
      label: "Ver lanzamientos",
      copy: "Entrar por actividad real, no por una landing abstracta.",
      icon: Activity,
    },
    {
      href: "/blog",
      label: "Entender el sistema",
      copy: "Leer cómo funciona el score, los sub-sites y la visibilidad.",
      icon: BookOpen,
    },
  ];

  const currentHero = heroExperiment[heroVariant];
  const normalizedClaim = claimInput.trim().toLowerCase();
  const claimPath = normalizedClaim ? `/onboarding?claim=${encodeURIComponent(normalizedClaim)}` : "/onboarding";
  const claimHref = user ? claimPath : `/login?next=${encodeURIComponent(claimPath)}`;
  const trackLandingEvent = (eventName: string, payload: Record<string, any>) => {
    if (typeof window === "undefined") return;
    window.umami?.track(eventName, payload);
  };

  const submitClaim = () => {
    if (claimStatus !== "available") return;
    window.localStorage.setItem("huevsite_pending_claim", normalizedClaim);
    trackLandingEvent("landing_claim_submit", { variant: heroVariant, username: normalizedClaim });
    window.location.href = claimHref;
  };

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
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

      // Single consolidated hero ("show, don't tell"). The previous 3-way split
      // was dropped — at this traffic it couldn't reach significance. We ship the
      // strongest variant and track conversion to inform a future test at scale.
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
      {/* NAV */}
      <nav>
        <Link href="/" className="logo">huev<span style={{ color: 'var(--accent)' }}>site</span>.io</Link>
        <div className="nav-right hidden md:flex">
          <Link href="/feed" className="btn btn-ghost">
            <span>Lanzamientos</span>
          </Link>
          <Link href="/explore" className="btn btn-ghost">
            <span>Explorar</span>
          </Link>
          <Link href="/blog" className="btn btn-ghost">
            <span>Blog</span>
          </Link>
          <a href="#precios" className="btn btn-ghost">
            <span>Precios</span>
          </a>
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-accent !px-6 ml-1">
            {user ? (
              <>
                <Layout size={16} className="mr-2" />
                <span>Mi huevsite</span>
              </>
            ) : (
              <>
                <span>Armá tu huevsite →</span>
              </>
            )}
          </Link>
        </div>

        {/* Mobile Mini Nav (just Login/Dashboard for space) */}
        <div className="md:hidden">
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-accent !py-1.5 !px-4 !text-[11px] !font-bold">
            {user ? "Dashboard" : "Entrar"}
          </Link>
        </div>
      </nav>

      {/* MOBILE FLOATING NAV */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:hidden fixed bottom-8 left-1/2 z-[100] w-[90%] max-w-[400px]"
          >
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center justify-between shadow-2xl">
              <Link href="/feed" className="flex-1 flex flex-col items-center gap-1 py-1.5 text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors">
                <Activity size={18} />
                <span className="text-[9px] font-bold uppercase tracking-tighter">Feed</span>
              </Link>
              <Link href="/explore" className="flex-1 flex flex-col items-center gap-1 py-1.5 text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors">
                <Compass size={18} />
                <span className="text-[9px] font-bold uppercase tracking-tighter">Explorar</span>
              </Link>
              <Link href="/blog" className="flex-1 flex flex-col items-center gap-1 py-1.5 text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors">
                <BookOpen size={18} />
                <span className="text-[9px] font-bold uppercase tracking-tighter">Blog</span>
              </Link>
              <Link href={user ? "/dashboard" : "/login"} className="flex-1 flex flex-col items-center gap-1 py-1.5 text-[var(--accent)] transition-colors">
                {user ? <Layout size={18} /> : <PlusCircle size={18} />}
                <span className="text-[9px] font-bold uppercase tracking-tighter">{user ? 'Mi huevsite' : 'Crear'}</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section className="hero">
        <div className={`hero-shell ${(user && heroVariant !== "product") ? "hero-shell--solo" : "hero-shell--with-claim"}`}>
          <div className="hero-copy">
            <div className="badge">
              {/* Prime slot: the network's liveness beats a static tagline (falls
                  back to the eyebrow when the number would read weak). */}
              {activeThisWeek >= 10 ? (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                  </span>
                  <span>+{(Math.round(activeThisWeek / 10) * 10).toLocaleString()} builders activos esta semana</span>
                </>
              ) : (
                <>
                  <span className="dot"></span>
                  {currentHero.eyebrow}
                </>
              )}
              <LatamFlags />
            </div>

            <h1 className="text-center xl:text-left leading-[1.05]">
              {currentHero.title}
            </h1>

            <p className="text-center xl:text-left mx-auto xl:mx-0">{currentHero.description}</p>

            <div className="hero-ctas flex justify-center xl:justify-start items-center flex-wrap gap-3">
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

            {/* Live username claim — the highest-intent hook on the page: a typed
                username means the visitor already owns the URL in their head.
                Validates in real time against /api/username/check. */}
            {!user && (
              <div className="mt-4 flex flex-col items-center xl:items-start gap-2">
                <div
                  className={`flex items-center rounded-2xl border bg-black/30 overflow-hidden transition-colors ${
                    claimStatus === "available"
                      ? "border-[var(--accent)]/50"
                      : claimStatus === "taken" || claimStatus === "invalid"
                      ? "border-red-400/40"
                      : "border-white/10"
                  }`}
                >
                  <span className="pl-4 py-3 text-sm font-mono text-[var(--text-muted)] select-none">huevsite.io/</span>
                  <input
                    value={claimInput}
                    onChange={(e) => setClaimInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") submitClaim(); }}
                    placeholder="tuusuario"
                    maxLength={20}
                    aria-label="Probá tu username"
                    className="bg-transparent py-3 pr-1 text-sm font-mono text-white outline-none w-[110px] sm:w-[140px] placeholder:text-white/25"
                  />
                  <span className="flex w-5 shrink-0 items-center justify-center">
                    {claimStatus === "checking" && <Loader2 size={14} className="animate-spin text-white/40" />}
                    {claimStatus === "available" && <Check size={14} className="text-[var(--accent)]" />}
                    {(claimStatus === "taken" || claimStatus === "invalid") && <X size={14} className="text-red-400" />}
                  </span>
                  <button
                    onClick={submitClaim}
                    disabled={claimStatus !== "available"}
                    className="m-1.5 ml-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black transition-opacity disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Reclamar →
                  </button>
                </div>
                {claimStatus === "invalid" && (
                  <div className="text-[11px] font-mono text-red-300/80">Solo minúsculas, números y _ (3 a 20 caracteres).</div>
                )}
                {claimStatus === "taken" && (
                  <div className="flex flex-wrap items-center justify-center xl:justify-start gap-1.5">
                    <span className="text-[11px] font-mono text-red-300/80">Ese ya fue reclamado. Probá:</span>
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
              </div>
            )}

            <div className="social-proof">
              <div className="avatars">
                {(() => {
                  const pool = [
                    ...(showcaseData.randoms || []),
                    ...(showcaseData.winners?.map((w: any) => w.user).filter(Boolean) || []),
                  ];
                  const withImage = pool.filter((p: any) => p?.image).slice(0, 5);
                  const slots = Array.from({ length: 5 }, (_, i) => withImage[i] ?? null);
                  const fallbackLetters = ["F", "M", "S", "L", "P"];
                  const fallbackClasses = ["a1", "a2", "a3", "a4", "a5"];
                  return slots.map((p, i) =>
                    p?.image ? (
                      <div key={i} className="avatar" style={{ padding: 0, overflow: "hidden" }}>
                        <img src={p.image} alt={p.name || p.username} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div key={i} className={`avatar ${fallbackClasses[i]}`}>{fallbackLetters[i]}</div>
                    )
                  );
                })()}
              </div>
              {/* Round to NEAREST 10 — flooring understated our own proof (188 → "+180"). */}
              <span className="social-proof-text"><strong>+{(Math.round((showcaseData.total_builders || 50) / 10) * 10).toLocaleString()} builders</strong> ya armaron su huevsite</span>
            </div>
          </div>

          {(
            <div className="hero-product-preview">
              <div className="hpp-badge">
                <Eye size={12} />
                Vista previa real
              </div>
              {heroProfiles.length > 0 ? (
                <BuilderSpotlightCard builders={heroProfiles} />
              ) : (
                <div className="hpp-card">
                  <div className="hpp-header">
                    <div className="hpp-avatar">B</div>
                    <div className="hpp-info">
                      <div className="hpp-name">Builder Name</div>
                      <div className="hpp-role">Developer · Indie Hacker</div>
                    </div>
                    <div className="hpp-score">847 pts</div>
                  </div>
                  <div className="hpp-tagline">"Construyendo cosas que no existían ayer."</div>
                  <div className="hpp-grid">
                    <div className="hpp-block hpp-block--span2">
                      <div className="hpp-block-label">Building now</div>
                      <div className="hpp-block-title">SaaS en progreso</div>
                      <div className="hpp-block-tech">Next.js · Supabase · TypeScript</div>
                    </div>
                    <div className="hpp-block hpp-block--accent">
                      <div className="hpp-block-label">Score</div>
                      <div className="hpp-block-num">847</div>
                    </div>
                    <div className="hpp-block">
                      <div className="hpp-block-label">Stack</div>
                      <div className="hpp-stack-tags">
                        <span>React</span><span>Node</span><span>Figma</span>
                      </div>
                    </div>
                  </div>
                  <div className="hpp-url">
                    <span className="hpp-url-prefix">huevsite.io/</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>tu_username</span>
                  </div>
                </div>
              )}
              <div className="hpp-metrics">
                <div className="hpp-metric">
                  <strong>~3 min</strong>
                  <span>para publicar</span>
                </div>
                <div className="hpp-metric">
                  <strong>gratis</strong>
                  <span>para empezar</span>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="w-full max-w-6xl mt-8 grid gap-3 md:grid-cols-3">
          {contentPath.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => trackLandingEvent("landing_content_path_click", { variant: heroVariant, href: item.href })}
                className="group rounded-[1.6rem] border border-white/8 bg-white/[0.025] px-5 py-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Icon size={18} />
                </div>
                <div className="text-sm font-black tracking-tight text-white">{item.label}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{item.copy}</p>
                <div className="mt-4 text-[11px] font-mono uppercase tracking-[0.18em] text-white/35 transition-colors group-hover:text-[var(--accent)]">
                  Seguir por aca
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* NETWORK PULSE — live proof this is a network, not a link tool: real
          ranking, real growth, real endorsements. Each cell hides below its
          threshold so a weak number never ships as anti-proof. */}
      {(networkPulse?.top3?.length ?? 0) >= 3 && (() => {
        const cells: ReactNode[] = [];
        cells.push(
          <Link key="rank" href="/leaderboard" className="group rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)]">
              <Trophy size={13} /> Ranking en vivo
            </div>
            <div className="space-y-2.5">
              {networkPulse!.top3.map((b, i) => (
                <div key={b.username} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-black text-white/30">#{i + 1}</span>
                  {b.image ? (
                    <img src={b.image} alt={b.name || b.username} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">{(b.name || b.username).charAt(0).toUpperCase()}</div>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{b.name || b.username}</span>
                  <span className="text-xs font-mono text-[var(--accent)]">{b.builder_score.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">Ver el ranking →</div>
          </Link>
        );
        if ((networkPulse!.newThisWeek ?? 0) >= 5) {
          cells.push(
            <Link key="new" href="/explore" className="group flex flex-col justify-between rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:bg-white/[0.04]">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)]">
                <TrendingUp size={13} /> La red crece
              </div>
              <div>
                <div className="text-4xl font-black tracking-tight text-white">+{networkPulse!.newThisWeek}</div>
                <div className="mt-1 text-sm text-[var(--text-dim)]">builders se unieron esta semana</div>
              </div>
              <div className="mt-4 text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">Explorar builders →</div>
            </Link>
          );
        }
        if ((networkPulse!.endorsementsTotal ?? 0) >= 50) {
          cells.push(
            <Link key="endorse" href="/explore" className="group flex flex-col justify-between rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:bg-white/[0.04]">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)]">
                <HeartHandshake size={13} /> Entre builders
              </div>
              <div>
                <div className="text-4xl font-black tracking-tight text-white">+{networkPulse!.endorsementsTotal.toLocaleString()}</div>
                <div className="mt-1 text-sm text-[var(--text-dim)]">endorsements de builder a builder</div>
              </div>
              <div className="mt-4 text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">Ver la comunidad →</div>
            </Link>
          );
        }
        return (
          <section style={{ padding: '56px 24px 0' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div className="section-label" style={{ justifyContent: 'center', marginBottom: '20px' }}>// la red, en vivo</div>
              <div className={`grid gap-3 ${cells.length === 3 ? "sm:grid-cols-3" : cells.length === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : "max-w-md mx-auto"}`}>
                {cells}
              </div>
            </div>
          </section>
        );
      })()}

      <WinnerSection initialData={showcaseData} user={user} />

      {/* ONBOARDING SECTION */}
      <section className="onboarding-section">
        <div className="onboarding-inner">
          <div>
            <div className="section-label">// onboarding</div>
            <h2 className="section-title">Listo en 3 minutos.<br /><span style={{ color: 'var(--accent)' }}>En serio.</span></h2>
            <p className="section-sub" style={{ marginBottom: '36px' }}>Sin plantillas vacías. Sin lienzo en blanco. El sistema arma tu perfil solo, vos solo lo afinás.</p>

            <div className="steps">
              <div className="step active">
                <div className="step-num">1</div>
                <div className="step-content">
                  <div className="step-title">¿Qué sos?</div>
                  <div className="step-desc">Elegís tu perfil (dev, diseñador, founder, todo lo anterior). Sin formularios aburridos.</div>
                </div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div className="step-content">
                  <div className="step-title">Importás Linktree o GitHub</div>
                  <div className="step-desc">Traemos señal real para arrancar sin bloques vacíos ni mock data.</div>
                </div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div className="step-content">
                  <div className="step-title">Elegís color y username</div>
                  <div className="step-desc">El sistema te crea un board base prolijo y vos sólo lo afinás después.</div>
                </div>
              </div>
              <div className="step">
                <div className="step-num">4</div>
                <div className="step-content">
                  <div className="step-title">Publicás con tu username</div>
                  <div className="step-desc">huevsite.io/tuusuario. Entrás al feed, al showcase y al leaderboard desde el día uno. Profit.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="onboard-ui">
            <div className="ou-q">¿Qué perfil tenés?</div>
            <div className="ou-sub">Podés elegir más de uno.</div>
            <div className="ou-options">
              <div className={`ou-option ${selectedRoles.includes('Developer') ? 'selected' : ''}`} onClick={() => toggleRole('Developer')}>
                <div className="em" style={{ fontSize: '28px', marginBottom: '6px' }}>⌨️</div>
                <div className="nm">Developer</div>
                <div className="dc">Código, repos, commits</div>
              </div>
              <div className={`ou-option ${selectedRoles.includes('Designer') ? 'selected' : ''}`} onClick={() => toggleRole('Designer')}>
                <div className="em" style={{ fontSize: '28px', marginBottom: '6px' }}>🎨</div>
                <div className="nm">Designer</div>
                <div className="dc">Figma, UI, sistemas</div>
              </div>
              <div className={`ou-option ${selectedRoles.includes('Founder') ? 'selected' : ''}`} onClick={() => toggleRole('Founder')}>
                <div className="em" style={{ fontSize: '28px', marginBottom: '6px' }}>🚀</div>
                <div className="nm">Founder</div>
                <div className="dc">Startups, MRR, tracción</div>
              </div>
              <div className={`ou-option ${selectedRoles.includes('Indie Hacker') ? 'selected' : ''}`} onClick={() => toggleRole('Indie Hacker')}>
                <div className="em" style={{ fontSize: '28px', marginBottom: '6px' }}>🛠</div>
                <div className="nm">Indie Hacker</div>
                <div className="dc">Side projects, solodev</div>
              </div>
            </div>
            <button className="ou-next">Seguir →</button>
            <div className="ou-skip">también podés conectar GitHub directamente</div>
          </div>
        </div>
      </section>

      {/* PRO FEATURES PROMO */}
      {/* TESTIMONIALS — social proof before the ask (Marc Lou #29). Hidden when empty. */}
      {testimonials.length > 0 && (
        <section style={{ padding: '90px 40px 0' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>// lo que dicen los builders</div>
            <h2 className="section-title text-center">No lo decimos nosotros.</h2>
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
                ¿Usás huevsite? Dejá el tuyo →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section id="precios" className="pro-promo-section" style={{ padding: '100px 40px', background: 'linear-gradient(180deg, transparent 0%, rgba(200,255,0,0.03) 100%)', borderTop: '1px solid rgba(255,255,255,0.05)', scrollMarginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label" style={{ color: 'var(--accent)' }}>// huevsite pro</div>
          <h2 className="section-title">Que te <span style={{ color: 'var(--accent)' }}>encuentren.</span></h2>
          <p className="section-sub" style={{ marginBottom: '60px' }}>Recruiters, clientes y otros builders te descubren cuando destacás. Los perfiles Pro aparecen primero en el feed, el showcase y el leaderboard.</p>

          <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', display: 'grid', gap: '20px' }}>
            {[
              { icon: Globe, title: 'Tu propio dominio', desc: 'Conectá dominio.com en segundos. Dale a tu portfolio la autoridad que merece con una URL 100% tuya.' },
              { icon: BarChart3, title: 'Insights de Builder', desc: 'No vueles a ciegas. Mirá quién te visita, de dónde vienen y qué es lo que más les gusta de tu trabajo.' },
              { icon: Zap, title: 'Explosión de Visibilidad', desc: 'Sumá puntos extra a tu Builder Score automáticamente. Tracción real para aparecer antes que nadie en el feed.' },
              { icon: LayoutGrid, title: 'Sub-sitios ilimitados', desc: '¿Tenés un SaaS? ¿Un newsletter? ¿Un curso? Creá landing pages específicas para cada proyecto bajo un mismo techo.' },
              { icon: Layout, title: 'Grid Expandido', desc: 'Hasta 22 bloques para que no falte nada. Más de 4× el espacio del plan free para tus proyectos, links y obsesiones.' },
              { icon: Star, title: 'Estatus de Elite', desc: 'El badge de Verificado no es solo estética: es confianza inmediata para recruiters y clientes.' }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="pro-feature-card group">
                  <div className="pro-feature-icon">
                    <Icon size={20} />
                  </div>
                  <h3 className="pro-feature-title">{f.title}</h3>
                  <p className="pro-feature-desc">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Pricing — three choices: Free / Pro / Founder (popcorn pricing). */}
          {showPricing && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-28 grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch"
            >
              <PricingTiers user={user ? { id: user.id, email: user.email } : null} />
            </motion.div>
          )}
        </div>
      </section>

      {/* FAQ — objection handling at the decision point (admin-managed). Hidden when empty. */}
      {faqs.length > 0 && (
        <section style={{ padding: '90px 24px 0' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>// preguntas frecuentes</div>
            <h2 className="section-title text-center">Lo que te estás preguntando.</h2>
            <div className="mt-10 space-y-3">
              {faqs.map((f) => {
                const open = openFaq === f.id;
                return (
                  <div key={f.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-colors hover:border-white/10">
                    <button
                      onClick={() => setOpenFaq(open ? null : f.id)}
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
      <section style={{ padding: '80px 24px 72px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {founderVideo && (founderVideo.embed || founderVideo.file) ? (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)] mb-4 text-center">
                Quién está detrás
              </div>
              <div className="rounded-[1.5rem] overflow-hidden border border-white/[0.08] bg-black aspect-video shadow-2xl shadow-[var(--accent)]/5">
                {founderVideo.file ? (
                  <video src={founderVideo.file} controls playsInline className="w-full h-full object-cover" />
                ) : (
                  <iframe
                    src={founderVideo.embed!}
                    title="El founder de huevsite"
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
                  <div className="text-[var(--text-muted)]">Founder de huevsite</div>
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
                  className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent)]/40 shadow-lg shadow-[var(--accent)]/10"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--accent)] mb-3">
                  Quién está detrás
                </div>
                <p className="text-base sm:text-[19px] text-white/90 leading-relaxed font-medium mb-4">
                  {founderQuote
                    ? `“${founderQuote}”`
                    : (
                      <>“Soy Tomas. Armé huevsite para que el laburo de los builders de LATAM <span style={{ color: 'var(--accent)' }}>se vea, no se cuente</span>. Es lo que uso yo todos los días.”</>
                    )}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 text-[13px] font-mono text-[var(--text-muted)]">
                  <span className="font-bold text-white/80">Tomas Deluca</span>
                  <span className="text-[var(--accent)] group-hover:underline">@_tomidelu</span>
                  <span className="hidden sm:inline text-white/20">·</span>
                  <span className="hidden sm:inline">Product Engineer &amp; v0 ambassador</span>
                </div>
              </div>
            </a>
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta-section">
        <div className="final-cta-glow" aria-hidden="true" />
        <div className="final-cta-inner">
          <div className="section-label" style={{ justifyContent: 'center' }}>// para builders de verdad</div>
          <h2 className="final-cta-title">
            Tu obra.<br /><span style={{ color: 'var(--accent)' }}>Tu URL.</span>
          </h2>
          <p className="final-cta-sub">
            Gratis para empezar.<br />Pasate a PRO cuando necesites romper los límites.
          </p>
          <div className="final-cta-actions">
            <Link href={user ? "/dashboard" : "/login"} className="btn btn-accent" style={{ fontSize: '17px', padding: '16px 40px' }}>
              {user ? (
                <>
                  <Layout size={18} className="mr-2 inline" />
                  <span>Mi huevsite</span>
                </>
              ) : (
                <span>Armá tu huevsite →</span>
              )}
            </Link>
            {!user && (
              <Link href="/explore" className="btn btn-ghost" style={{ fontSize: '15px', padding: '16px 28px' }}>
                Ver ejemplos primero
              </Link>
            )}
          </div>
          <div className="final-cta-meta">
            <span>Sin tarjeta de crédito</span>
            <span className="final-cta-dot">·</span>
            <span>Listo en 3 minutos</span>
            <span className="final-cta-dot">·</span>
            <span>Hecho por y para builders</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="logo">huev<span style={{ color: 'var(--accent)' }}>site</span>.io</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Mostrá lo que buildeás. A project by{' '}
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
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Link href="/blog" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>Blog</Link>
          <Link href="https://x.com/i/communities/2026312282527932637" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>X Community</Link>
          <Link href="https://discord.gg/qE4CWG6D" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>Discord Community</Link>
          <Link href="https://github.com/tomasdeluca1" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
