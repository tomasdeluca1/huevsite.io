"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { WinnerSection } from "@/components/landing/WinnerSection";
import { supabase } from "@/lib/supabase";
import { lemonCheckoutUrl } from "@/lib/lemon-checkout-url";
import { User } from "@supabase/supabase-js";
import { Activity, Compass, Users, PlusCircle, Layout, Check, BookOpen, Globe, Link2, BarChart3, TrendingUp, Loader2, ArrowRight, Sparkles } from "lucide-react";

interface LandingPageClientProps {
  showcaseData: any;
}

type HeroVariant = "claim" | "social";

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
  const [heroVariant, setHeroVariant] = useState<HeroVariant>("claim");
  const [claimInput, setClaimInput] = useState("");
  const [claimStatus, setClaimStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "error">("idle");
  const [claimSuggestions, setClaimSuggestions] = useState<string[]>([]);

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
      description: "Probá tu username, confirmá si está libre y entrá al flujo con una acción concreta. Menos rebote, más intención real.",
      primaryHref: "/explore",
      primaryLabel: "Ver cómo se ve uno bueno",
      secondaryHref: "/explore",
      secondaryLabel: "Explorar builders",
    },
    social: {
      eyebrow: "Entrá por tracción real, no por promesas vacías",
      title: (
        <>
          El lugar para <span className="accent">mostrar</span> <br className="hidden md:block" />
          qué estás <br className="hidden md:block" />
          construyendo ahora.
        </>
      ),
      description: "Perfil público, lanzamientos, score, sub-sites y señales de vida en una sola URL que invita a seguir mirando.",
      primaryHref: "/feed",
      primaryLabel: "Entrar por el feed",
      secondaryHref: user ? "/dashboard" : "/login",
      secondaryLabel: user ? "Ir a mi dashboard" : "Crear el mío",
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
  const linktreeMigrationHref = user ? "/dashboard" : `/login?next=${encodeURIComponent("/onboarding")}`;

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

      const storedVariant = window.localStorage.getItem("hs_lp_hero_variant_v2") as HeroVariant | null;
      if (storedVariant === "claim" || storedVariant === "social") {
        setHeroVariant(storedVariant);
        trackLandingEvent("landing_hero_variant_seen", { variant: storedVariant });
      } else {
        const assignedVariant: HeroVariant = Math.random() > 0.5 ? "claim" : "social";
        window.localStorage.setItem("hs_lp_hero_variant_v2", assignedVariant);
        setHeroVariant(assignedVariant);
        trackLandingEvent("landing_hero_variant_seen", { variant: assignedVariant });
      }
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
        <div className={`hero-shell ${user ? "hero-shell--solo" : "hero-shell--with-claim"}`}>
          <div className="hero-copy">
            <div className="badge">
              <span className="dot"></span>
              {currentHero.eyebrow}
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
                <div className="avatar a1">F</div>
                <div className="avatar a2">M</div>
                <div className="avatar a3">S</div>
                <div className="avatar a4">L</div>
                <div className="avatar a5">P</div>
              </div>
              <span className="social-proof-text"><strong>+{(Math.floor((showcaseData.total_builders || 50) / 10) * 10).toLocaleString()} builders</strong> ya armaron su huevsite</span>
            </div>
          </div>

          {!user && (
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

      <section className="linktree-cta-section">
        <div className="linktree-cta-shell">
          <div className="linktree-cta-copy">
            <div className="section-label">// migrá desde linktree</div>
            <h2 className="section-title">
              Si ya usás <span style={{ color: "var(--accent)" }}>Linktree</span>, venite con todo a huevsite.
            </h2>
            <p className="section-sub">
              No arranques de cero. Importamos tus links visibles, tu bio y tu avatar para convertir ese hub
              estático en un perfil que muestra lo que construís.
            </p>

            <div className="linktree-cta-points">
              {[
                {
                  icon: Link2,
                  title: "Traé tus links sin copiarlos uno por uno",
                  copy: "Pegás la URL y usamos lo que ya tenés publicado para armar una base útil.",
                },
                {
                  icon: Globe,
                  title: "Pasá de lista de links a perfil con contexto",
                  copy: "Sumás identidad, proyectos, señal y una URL más tuya para compartir.",
                },
                {
                  icon: BarChart3,
                  title: "Dejá espacio para crecer",
                  copy: "Después podés sumar GitHub, sub-sites, métricas y todo lo que Linktree no cuenta de vos.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="linktree-cta-point">
                    <div className="linktree-cta-point-icon">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="linktree-cta-point-title">{item.title}</div>
                      <p className="linktree-cta-point-copy">{item.copy}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="linktree-cta-actions">
              <Link
                href={linktreeMigrationHref}
                className="btn btn-accent !px-8 !py-4 text-base"
                onClick={() => trackLandingEvent("landing_linktree_cta_click", {
                  variant: heroVariant,
                  href: linktreeMigrationHref,
                  loggedIn: Boolean(user),
                })}
              >
                {user ? "Traer mi Linktree al dashboard" : "Traer mi Linktree a huevsite"}
              </Link>
              <span className="linktree-cta-footnote">Importás en minutos y después afinás el perfil a tu manera.</span>
            </div>
          </div>

          <div className="linktree-cta-card">
            <div className="linktree-cta-card-top">
              <div>
                <div className="linktree-cta-card-label">Antes</div>
                <div className="linktree-cta-card-title">Linktree</div>
              </div>
              <div className="linktree-cta-card-arrow">
                <ArrowRight size={18} />
              </div>
              <div>
                <div className="linktree-cta-card-label">Después</div>
                <div className="linktree-cta-card-title accent">huevsite</div>
              </div>
            </div>

            <div className="linktree-cta-compare">
              <div className="linktree-cta-compare-col">
                <div className="linktree-cta-compare-chip">links sueltos</div>
                <div className="linktree-cta-compare-chip">misma estructura que todos</div>
                <div className="linktree-cta-compare-chip">poco contexto</div>
              </div>
              <div className="linktree-cta-compare-col accent">
                <div className="linktree-cta-compare-chip">perfil con identidad</div>
                <div className="linktree-cta-compare-chip">proyectos y señal real</div>
                <div className="linktree-cta-compare-chip">más razones para quedarse</div>
              </div>
            </div>

            <div className="linktree-cta-card-note">
              Importamos lo visible para darte un punto de partida sólido. El resto lo terminás de hacer tuyo dentro de huevsite.
            </div>
          </div>
        </div>
      </section>

      {/* DESIGN TOKENS SECTION */}
      <section className="tokens-section">
        <div className="section-label">// sistema de diseño</div>
        <h2 className="section-title">Tokens de diseño</h2>
        <p className="section-sub">Una identidad visual moderna y directa, para destacar tu trabajo.</p>

        <div className="tokens-grid">
          <div className="token-card">
            <h3>Paleta de colores</h3>
            <div className="color-swatches">
              {[
                { n: "Acid Green — Accent", v: "#C8FF00", c: "#C8FF00" },
                { n: "Void — Background", v: "#080808", c: "#080808" },
                { n: "Surface", v: "#111111", c: "#111111" },
                { n: "Electric Blue", v: "#4D9FFF", c: "#4D9FFF" },
                { n: "Crypto Purple", v: "#A855F7", c: "#A855F7" },
                { n: "Productividad Orange", v: "#FF7A00", c: "#FF7A00" }
              ].map((s, i) => (
                <div key={i} className="swatch">
                  <div className="swatch-color" style={{ background: s.c, border: s.c === '#C8FF00' ? '1px solid #555' : 'none' }}></div>
                  <div className="swatch-info">
                    <div className="swatch-name">{s.n}</div>
                    <div className="swatch-val">{s.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="token-card">
            <h3>Tipografía</h3>
            <div className="type-sample">
              <div className="ts-item">
                <div className="ts-label">Display — Bricolage Grotesque</div>
                <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>Crear, luego existir.</div>
              </div>
              <div className="ts-item">
                <div className="ts-label">Body — Bricolage Grotesque 400</div>
                <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-dim)' }}>Una identidad visual pensada para la comunidad de LATAM.</div>
              </div>
              <div className="ts-item">
                <div className="ts-label">Mono — JetBrains Mono</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)' }}>// huevsite.io/tunombre</div>
              </div>
            </div>
          </div>

          <div className="token-card">
            <h3>Radios & Espaciado</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {[
                { r: '8px', n: 'sm', d: 'pills, inputs, stacks' },
                { r: '14px', n: 'md', d: 'bloques, cards' },
                { r: '28px', n: 'xl', d: 'containers, modales' }
              ].map((rad, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: rad.r, flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{rad.n} — {rad.r}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{rad.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grid — 8pt base</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[2, 4, 6, 8, 10].map((v, i) => (
                <div key={i} style={{ height: '4px', background: 'var(--accent)', borderRadius: '2px', flex: i + 1, opacity: (i + 1) * 0.2 }}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MICROCOPY SECTION */}
      <section className="microcopy-section">
        <div className="microcopy-inner">
          <div className="section-label">// microcopy</div>
          <h2 className="section-title">Tono de voz</h2>
          <p className="section-sub">Español de LATAM. Claro, directo y cercano.</p>

          <div className="microcopy-grid">
            {[
              { c: "Empty state — Proyectos", t: "Aún no hay proyectos cargados.", s: "Agregá tu primer proyecto para empezar a mostrar tu trabajo.", a: "+ Agregar proyecto" },
              { c: "Empty state — GitHub", t: "¿Qué estás construyendo?", s: "Conectá tu GitHub para mostrar tus repositorios más recientes.", a: "Conectar →" },
              { c: "Onboarding — Step 2", t: "¿Cuál es tu stack?", s: "Elegí las tecnologías que mejor manejás para destacarlas en tu perfil." },
              { c: "Onboarding — Bienvenida", t: "Hola. Vamos a armar tu perfil ideal.", s: "En pocos pasos vas a tener listo tu espacio para mostrar tus creaciones." },
              { c: "CTA — Perfil público", t: "Mostrá de qué sos capaz.", s: "Tu experiencia y tus proyectos, todo en un solo lugar fácil de compartir." },
              { c: "Error — GitHub desconectado", t: "No pudimos conectar con GitHub.", s: "Revisá permisos o agregá manualmente tus repositorios.", a: "Reintentar" }
            ].map((m, i) => (
              <div key={i} className="mc-card">
                <div className="mc-context">{m.c}</div>
                <div className="mc-text">{m.t}</div>
                <div className="mc-sub">
                  {m.s} {m.a && <span className="mc-accent">{m.a}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRO FEATURES PROMO */}
      <section className="pro-promo-section" style={{ padding: '100px 40px', background: 'linear-gradient(180deg, transparent 0%, rgba(200,255,0,0.03) 100%)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label" style={{ color: 'var(--accent)' }}>// huevsite pro</div>
          <h2 className="section-title">Llevá tu marca al <span style={{ color: 'var(--accent)' }}>próximo nivel.</span></h2>
          <p className="section-sub" style={{ marginBottom: '60px' }}>Features avanzadas para builders que quieren destacar y ser descubiertos.</p>

          <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', display: 'grid', gap: '24px' }}>
            {[
              { icon: '🌐', title: 'Tu propio dominio', desc: 'Conectá dominio.com en segundos. Dale a tu portfolio la autoridad que merece con una URL 100% tuya.' },
              { icon: '🔭', title: 'Insights de Builder', desc: 'No vueles a ciegas. Mirá quién te visita, de dónde vienen y qué es lo que más les gusta de tu trabajo.' },
              { icon: '⚡', title: 'Explosión de Visibilidad', desc: 'Sumá puntos extra a tu Builder Score automáticamente. Tracción real para aparecer antes que nadie en el feed.' },
              { icon: '🍱', title: 'Sub-sitios ilimitados', desc: '¿Tenés un SaaS? ¿Un newsletter? ¿Un curso? Creá landing pages específicas para cada proyecto bajo un mismo techo.' },
              { icon: '🏗️', title: 'Grid Expandido', desc: 'Hasta 32 bloques para que no falte nada. El doble de espacio para tus proyectos, links y obsesiones.' },
              { icon: '👑', title: 'Estatus de Elite', desc: 'El badge de Verificado no es solo estética: es confianza inmediata para recruiters y clientes.' }
            ].map((f, i) => (
              <div key={i} style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', transition: 'all 0.3s' }} className="group hover:border-[var(--accent)]/30">
                <div style={{ fontSize: '32px', marginBottom: '20px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
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
      <section style={{ textAlign: 'center', padding: '100px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(200,255,0,0.06), transparent 60%)', pointerEvents: 'none' }}></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>// para builders de verdad</div>
        <h2 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, letterSpacing: '-3px', lineHeight: 0.95, marginBottom: '20px' }}>
          Tu obra.<br /><span style={{ color: 'var(--accent)' }}>Tu URL.</span>
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto 36px', lineHeight: 1.6 }}>
          Gratis para empezar. Pasate a PRO cuando necesites romper los límites.
        </p>
        <Link href={user ? "/dashboard" : "/login"} className="btn btn-accent" style={{ fontSize: '17px', padding: '16px 36px', display: 'inline-block' }}>
          {user ? (
            <>
              <Layout size={18} className="mr-2 inline" />
              <span>Mi huevsite</span>
            </>
          ) : (
            <span>Crear mi huevsite →</span>
          )}
        </Link>
        <div style={{ marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
          Hecho por y para builders.
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="logo">huev<span style={{ color: 'var(--accent)' }}>site</span>.io</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mostrá lo que buildeás.</div>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/blog" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>Blog</Link>
          <Link href="https://x.com/i/communities/2026312282527932637" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>X Community</Link>
          <Link href="https://discord.gg/qE4CWG6D" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>Discord Community</Link>
          <Link href="https://github.com/tomasdeluca1" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
