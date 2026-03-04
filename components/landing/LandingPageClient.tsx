"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { WinnerSection } from "@/components/landing/WinnerSection";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Activity, Compass, Users, PlusCircle, Layout } from "lucide-react";

interface LandingPageClientProps {
  showcaseData: any;
}

export default function LandingPageClient({ showcaseData }: LandingPageClientProps) {
  const [heatmap, setHeatmap] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Developer', 'Founder']);
  const [user, setUser] = useState<User | null>(null);
  const [showMobileNav, setShowMobileNav] = useState(true);

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

    // Scroll stop detection
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      setShowMobileNav(false);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setShowMobileNav(true);
      }, 500); // 500ms stop detection
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div className="landing">
      {/* NAV */}
      <nav>
        <Link href="/" className="logo">huev<span>site</span>.io</Link>
        <div className="nav-right hidden md:flex">
          <Link href="/feed" className="btn btn-ghost">
            <span>Lanzamientos</span>
          </Link>
          <Link href="/explore" className="btn btn-ghost">
            <span>Explorar</span>
          </Link>
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-accent !px-6">
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
        <div className="badge">
          <span className="dot"></span>
          Para builders de Argentina y LATAM
        </div>

        <h1 className="text-center leading-[1.05]">
          El <span className="accent">portfolio</span> <br className="hidden md:block" />
          que no da <br className="hidden md:block" />
          <span className="strike">vergüenza</span> ajena.
        </h1>

        <p className="text-center mx-auto">Mostrá quién sos y qué buildeás. Sin diseñar desde cero y con personalidad propia.</p>

        <div className="hero-ctas flex justify-center">
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-accent !px-8 !py-4 text-base">
            {user ? "Mi huevsite" : "Empezar gratis"}
          </Link>
          <span className="hero-username-preview">huevsite.io/<strong style={{ color: 'var(--accent)' }}>tuusuario</strong></span>
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
                  <div className="step-title">Conectás GitHub (opcional)</div>
                  <div className="step-desc">Importamos tus proyectos, lenguajes y actividad automáticamente. Cero copia-pega.</div>
                </div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div className="step-content">
                  <div className="step-title">Elegís tu layout</div>
                  <div className="step-desc">Te sugerimos un huevsite armado según tu perfil. Drag & drop para reordenar.</div>
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
              { icon: '💎', title: 'Diseño Disruptivo', desc: 'Acceso a layouts exclusivos y personalización avanzada para builders que no se conforman.' },
              { icon: '📈', title: 'Builder Score Elite', desc: 'Ranking dinámico basado en tu actividad real, dándote visibilidad ante la comunidad.' },
              { icon: '📝', title: 'Blog Integrado', desc: 'Gestioná tus propios artículos y pensamientos directamente en tu huevsite con lectura in-situ.' },
              { icon: '🚀', title: 'Soporte Prioritario', desc: 'Ayuda directa para optimizar tu huevsite y destacar tus proyectos al máximo.' }
            ].map((f, i) => (
              <div key={i} style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', transition: 'all 0.3s' }} className="group hover:border-[var(--accent)]/30">
                <div style={{ fontSize: '32px', marginBottom: '20px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
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
          Gratis. Sin tarjeta de crédito. Sin &quot;upgrade to Pro&quot; a los 10 segundos.
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
          <Link href="https://x.com/i/communities/2026312282527932637" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>X Community</Link>
          <Link href="https://discord.gg/qE4CWG6D" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>Discord Community</Link>
          <Link href="https://github.com/tomasdeluca1" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
