"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { WinnerSection } from "@/components/landing/WinnerSection";
import { BuilderSpotlightCard } from "@/components/landing/BuilderSpotlightCard";
import { LatamFlags } from "@/components/landing/LatamFlags";
import { supabase } from "@/lib/supabase";
import { lemonCheckoutUrl } from "@/lib/lemon-checkout-url";
import { User } from "@supabase/supabase-js";
import { Activity, Compass, Users, PlusCircle, Layout, Check, BookOpen, Globe, BarChart3, Loader2, ArrowRight, Sparkles, Zap, Star, LayoutGrid, Eye } from "lucide-react";

interface LandingPageClientProps {
  showcaseData: any;
}

type HeroVariant = "claim" | "social" | "product";

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, any>) => void;
    };
  }
}

export default function LandingPageClient({ showcaseData }: LandingPageClientProps) {
  const [heatmap, setHeatmap] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Developer', 'Founder']);
  const [user, setUser] = useState<User | null>(null);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [heroVariant] = useState<HeroVariant>("social");
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
      secondaryLabel: "Crear el mío gratis",
    },
    social: {
      eyebrow: "mostrá lo que buildeás",
      title: (
        <>
          No digas que sos builder.<br className="hidden md:block" />{" "}
          <span className="accent">Probalo.</span>
        </>
      ),
      description: "Tu portfolio vivo: proyectos, código y métricas reales en un link que se actualiza solo. Donde los builders de LATAM se muestran de verdad.",
      primaryHref: user ? "/dashboard" : "/login",
      primaryLabel: user ? "Ir a mi dashboard" : "Armá el tuyo — gratis",
      secondaryHref: "/feed",
      secondaryLabel: "Ver el feed",
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
      secondaryLabel: user ? "Ir a mi dashboard" : "Crear el mío gratis",
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
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-accent !px-6 ml-1">
            {user ? (
              <>
                <Layout size={16} className="mr-2" />
                <span>Mi huevsite</span>
              </>
            ) : (
              <>
                <span>Crear mi huevsite →</span>
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
              <span className="dot"></span>
              {currentHero.eyebrow}
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
              <span className="hero-username-preview">huevsite.io/<strong style={{ color: 'var(--accent)' }}>{normalizedClaim || 'tuusuario'}</strong></span>
            </div>

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
              <span className="social-proof-text"><strong>+{(Math.floor((showcaseData.total_builders || 50) / 10) * 10).toLocaleString()} builders</strong> ya armaron su huevsite</span>
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

          {false && (
            <div className={`hero-claim-panel hero-claim-panel--${claimStatus}`}>
              <div className="hero-claim-orb" aria-hidden="true" />
              <div className="hero-claim-eyebrow">
                <Sparkles size={14} />
                Reclamá tu huevsite
              </div>

              <div className="hero-claim-title">Probá tu username ahora</div>
              <p className="hero-claim-sub">
                Si está libre, te llevamos al onboarding con ese nombre ya cargado.
              </p>

              <div className="hero-claim-action">
                <div className="hero-claim-url-label">Tu URL potencial</div>

                <div className="hero-claim-input-wrap">
                  <span className="hero-claim-prefix">huevsite.io/</span>
                  <input
                    value={claimInput}
                    onChange={(e) => setClaimInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                    placeholder="tuusuario"
                    className="hero-claim-input"
                  />
                  <div className="hero-claim-status">
                    {claimStatus === "checking" && <Loader2 size={16} className="animate-spin text-white/40" />}
                    {claimStatus === "available" && <Check size={16} className="text-[var(--accent)]" />}
                  </div>
                </div>

                <button
                  onClick={submitClaim}
                  disabled={claimStatus !== "available"}
                  className="hero-claim-button"
                >
                  {claimStatus === "available" ? (
                    <>
                      Reclamar {normalizedClaim}
                      <ArrowRight size={16} />
                    </>
                  ) : claimStatus === "checking" ? (
                    "Chequeando disponibilidad..."
                  ) : (
                    "Elegí un username disponible"
                  )}
                </button>

                <div className={`hero-claim-feedback hero-claim-feedback--${claimStatus}`}>
                  {claimStatus === "idle" && "Usá entre 3 y 20 caracteres. Solo minúsculas, números y guión bajo."}
                  {claimStatus === "invalid" && "Ese formato no va. Probá con minúsculas, números o _."}
                  {claimStatus === "available" && `Disponible. ${user ? "Vamos a prellenarlo." : "Te lo preparamos para el login."}`}
                  {claimStatus === "taken" && "Ese ya fue reclamado. Probá una variante."}
                  {claimStatus === "error" && "No pudimos validar ahora mismo. Reintentá en unos segundos."}
                </div>
              </div>

              {claimSuggestions.length > 0 && (
                <div className="hero-claim-suggestions-wrap">
                  <div className="hero-claim-suggestions-label">Probá alguna de estas</div>
                  <div className="hero-claim-suggestions">
                    {claimSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setClaimInput(suggestion);
                          trackLandingEvent("landing_claim_suggestion_click", { variant: heroVariant, suggestion });
                        }}
                        className="hero-claim-chip"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="hero-claim-metrics">
                <div className="hero-metric-card">
                  <span className="hero-metric-label">Tiempo hasta publicar</span>
                  <strong>~3 min</strong>
                </div>
                <div className="hero-metric-card">
                  <span className="hero-metric-label">Desde el hero</span>
                  <strong>username validado</strong>
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
                  <div className="step-desc">huevsite.io/tuusuario. Compartís el link. Profit.</div>
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
      <section className="pro-promo-section" style={{ padding: '100px 40px', background: 'linear-gradient(180deg, transparent 0%, rgba(200,255,0,0.03) 100%)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label" style={{ color: 'var(--accent)' }}>// huevsite pro</div>
          <h2 className="section-title">Llevá tu marca al <span style={{ color: 'var(--accent)' }}>próximo nivel.</span></h2>
          <p className="section-sub" style={{ marginBottom: '60px' }}>Features avanzadas para builders que quieren destacar y ser descubiertos.</p>

          <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', display: 'grid', gap: '20px' }}>
            {[
              { icon: Globe, title: 'Tu propio dominio', desc: 'Conectá dominio.com en segundos. Dale a tu portfolio la autoridad que merece con una URL 100% tuya.' },
              { icon: BarChart3, title: 'Insights de Builder', desc: 'No vueles a ciegas. Mirá quién te visita, de dónde vienen y qué es lo que más les gusta de tu trabajo.' },
              { icon: Zap, title: 'Explosión de Visibilidad', desc: 'Sumá puntos extra a tu Builder Score automáticamente. Tracción real para aparecer antes que nadie en el feed.' },
              { icon: LayoutGrid, title: 'Sub-sitios ilimitados', desc: '¿Tenés un SaaS? ¿Un newsletter? ¿Un curso? Creá landing pages específicas para cada proyecto bajo un mismo techo.' },
              { icon: Layout, title: 'Grid Expandido', desc: 'Hasta 32 bloques para que no falte nada. El doble de espacio para tus proyectos, links y obsesiones.' },
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

          {/* Pricing Section (Only for Login users) */}
          {showPricing && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-32 max-w-lg mx-auto"
            >
              <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-12 text-center relative overflow-hidden group">
                {/* Subtle Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--accent)]/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />

                <div className="relative z-10">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--text-muted)] mb-4 block">// suscripción pro</span>
                  <h3 className="text-3xl font-black mb-8 tracking-tighter">Desbloqueá todo</h3>

                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-6xl font-black text-white">$5</span>
                    <span className="text-sm font-mono text-[var(--text-muted)]">USD/mes</span>
                  </div>
                  <div className="mb-10">
                    <span className="text-[10px] bg-[#C8FF00] text-black px-2 py-0.5 rounded font-black uppercase">Próximamente $9</span>
                  </div>

                  <ul className="space-y-4 text-left mb-12 max-w-[280px] mx-auto">
                    {['Dominio .com personalizado', 'Insights y métricas en tiempo real', 'Boost de Scoring (más visibilidad)', 'Sub-sitios ilimitados por cuenta', 'Hasta 32 bloques en tu grid', 'Verified Badge oficial'].map(item => (
                      <li key={item} className="flex items-center gap-3 text-sm text-[var(--text-dim)]">
                        <Check size={14} className="text-[var(--accent)] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={lemonCheckoutUrl}
                    className="btn btn-accent w-full !py-5 !text-base !font-bold !rounded-2xl shadow-xl shadow-[var(--accent)]/5 hover:shadow-[var(--accent)]/20 transition-all"
                  >
                    {user ? "Mejorar mi huevsite →" : "Hacerme PRO ahora →"}
                  </Link>

                  <p className="mt-6 text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest opacity-40">
                    Cancela en cualquier momento
                  </p>
                </div>
              </div>
            </motion.div>
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
                <span>Crear mi huevsite →</span>
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
