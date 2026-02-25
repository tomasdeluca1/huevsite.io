"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [heatmap, setHeatmap] = useState<string[]>([]);

  useEffect(() => {
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
  }, []);

  return (
    <div className="landing">
      {/* NAV */}
      <nav>
        <div className="logo">huev<span>site</span>.io</div>
        <div className="nav-right">
          <Link href="/explore" className="btn btn-ghost">
            <span className="hidden sm:inline">Ver ejemplos</span>
            <span className="sm:hidden">Explorar</span>
          </Link>
          <Link href="/login" className="btn btn-accent">
            <span className="hidden sm:inline">Crear mi huevsite →</span>
            <span className="sm:hidden">Empezar</span>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="badge">
          <span className="dot"></span>
          Para builders de Argentina y LATAM
        </div>

        <h1>
          El <span className="accent">portfolio</span><br />
          que no da<br />
          <span className="strike">vergüenza</span> ajena.
        </h1>

        <p>Mostrá quién sos y qué buildás. Sin diseñar desde cero, sin LinkedIn genérico. Con personalidad propia.</p>

        <div className="hero-ctas">
          <Link href="/login" className="btn btn-accent">Empezar gratis</Link>
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
          <span className="social-proof-text"><strong>+2.400 builders</strong> ya armaron su huevsite</span>
        </div>
      </section>

      {/* DEMO SECTION */}
      <section className="demo-section">
        <p className="demo-label">// perfil de ejemplo</p>
        <div className="demo-browser">
          <div className="browser-bar">
            <div className="browser-dots">
              <span className="bd1"></span>
              <span className="bd2"></span>
              <span className="bd3"></span>
            </div>
            <div className="browser-url">huevsite.io/<span>gonza</span></div>
          </div>

          <div className="profile-page">
            <div className="bento-grid">
              
              {/* HERO BLOCK */}
              <div className="bento-block block-hero">
                <div>
                  <div className="hero-avatar">
                    G
                    <div className="hero-status"></div>
                  </div>
                  <div className="hero-name">Gonzalo Ferrer</div>
                  <div className="hero-role">// Full-stack Dev & Indie Hacker</div>
                </div>
                <div>
                  <p className="hero-tagline">Buildeo productos desde BA. Ex-MercadoLibre, hoy freelance & founder. Si tiene usuario activos, me interesa.</p>
                  <div className="hero-tags">
                    <span className="tag accent">disponible para proyectos</span>
                    <span className="tag">Buenos Aires 🇦🇷</span>
                    <span className="tag">web3</span>
                  </div>
                </div>
              </div>

              {/* CURRENTLY BUILDING */}
              <div className="bento-block block-building col-2">
                <div className="block-label">
                  <span className="blinker"></span>
                  Currently building
                </div>
                <div className="building-name">FlowKit</div>
                <div className="building-desc">SDK de componentes para onboarding en apps SaaS. El tipo de lib que yo necesitaba y no existía.</div>
                <div className="building-stack">
                  <span className="stack-pill">React</span>
                  <span className="stack-pill">TypeScript</span>
                  <span className="stack-pill">Tailwind</span>
                  <span className="stack-pill">Storybook</span>
                </div>
              </div>

              {/* METRIC 1 */}
              <div className="bento-block block-metric">
                <div className="block-label">GitHub Stars</div>
                <div className="metric-num" style={{ color: 'var(--accent)' }}>3.2k</div>
                <div className="metric-lbl">⭐ repositorios</div>
                <div className="metric-trend">↑ +180 este mes</div>
              </div>

              {/* METRIC 2 */}
              <div className="bento-block block-metric">
                <div className="block-label">Usuarios activos</div>
                <div className="metric-num" style={{ color: 'var(--blue)' }}>847</div>
                <div className="metric-lbl">🔵 FlowKit</div>
                <div className="metric-trend" style={{ color: 'var(--blue)' }}>↑ +12% weekly</div>
              </div>

              {/* METRIC 3 */}
              <div className="bento-block block-metric">
                <div className="block-label">MRR</div>
                <div className="metric-num" style={{ color: 'var(--purple)' }}>$1.4k</div>
                <div className="metric-lbl">💜 USD / mes</div>
                <div className="metric-trend" style={{ color: 'var(--purple)' }}>↑ +$200 vs mes pasado</div>
              </div>

              {/* PROJECT SHOWCASE */}
              <div className="bento-block block-project col-2">
                <div className="project-preview">
                  <div className="project-preview-code">
                    <div><span className="kw">import</span> {'{ FlowKit }'} <span className="kw">from</span> <span className="str">&apos;flowkit-react&apos;</span></div>
                    <div>&nbsp;</div>
                    <div><span className="kw">const</span> <span className="fn">App</span> = () <span className="kw">=️&gt;</span> (</div>
                    <div>&nbsp; &lt;<span className="fn">FlowKit</span> <span className="kw">steps</span>={'{steps}'} /&gt;</div>
                    <div>)</div>
                  </div>
                </div>
                <div className="project-info">
                  <div className="project-name">FlowKit — onboarding SDK</div>
                  <div className="project-desc">Componentes listos para onboarding en SaaS. Tours guiados, tooltips, progress bars. Drop-in, zero-config.</div>
                  <div className="project-footer">
                    <div className="project-metrics">
                      <span className="pm">⭐ 3.2k</span>
                      <span className="pm">🍴 248</span>
                      <span className="pm">🟢 v2.4.0</span>
                    </div>
                    <Link className="link-btn" href="#">ver demo →</Link>
                  </div>
                </div>
              </div>

              {/* GITHUB ACTIVITY */}
              <div className="bento-block block-github col-2">
                <div className="block-label">GitHub activity</div>
                <div className="github-stats">
                  <div className="gh-stat">
                    <span className="num">342</span>
                    <span className="lbl">commits / año</span>
                  </div>
                  <div className="gh-stat">
                    <span className="num" style={{ color: 'var(--accent)' }}>28</span>
                    <span className="lbl">repos públicos</span>
                  </div>
                  <div className="gh-stat">
                    <span className="num" style={{ color: 'var(--blue)' }}>14</span>
                    <span className="lbl">PRs merged</span>
                  </div>
                </div>
                <div className="heatmap">
                  {heatmap.map((cls, i) => <div key={i} className={cls}></div>)}
                </div>
              </div>

              {/* TECH STACK */}
              <div className="bento-block block-stack">
                <div className="block-label">Stack</div>
                <div className="stack-icons">
                  <div className="stack-icon" title="TypeScript">TS</div>
                  <div className="stack-icon" title="React">⚛</div>
                  <div className="stack-icon" title="Node.js">⬡</div>
                  <div className="stack-icon" title="PostgreSQL">🐘</div>
                  <div className="stack-icon" title="Docker">🐳</div>
                  <div className="stack-icon" title="Solidity">◆</div>
                </div>
              </div>

              {/* SOCIAL */}
              <div className="bento-block block-social">
                <div className="block-label">Links</div>
                <div className="social-links">
                  <Link className="social-link" href="#">
                    <span className="icon">𝕏</span>
                    <span className="handle">@gonzaferrer</span>
                  </Link>
                  <Link className="social-link" href="#">
                    <span className="icon">⬡</span>
                    <span className="handle">Farcaster</span>
                  </Link>
                  <Link className="social-link" href="#">
                    <span className="icon">💬</span>
                    <span className="handle">Discord</span>
                  </Link>
                </div>
              </div>

              {/* COMMUNITIES */}
              <div className="bento-block block-community col-2">
                <div className="block-label">Comunidades</div>
                <div className="community-badges">
                  <span className="comm-badge cb-eth">⟠ Ethereum Argentina</span>
                  <span className="comm-badge cb-ba">BA Palermo Valley</span>
                  <span className="comm-badge cb-hk">Indie Hackers LATAM</span>
                  <span className="comm-badge cb-dc">Devconnect BA 2025</span>
                  <span className="comm-badge cb-ph">Product Hunt AR</span>
                </div>
              </div>

              {/* WRITING */}
              <div className="bento-block block-writing col-2">
                <div className="block-label">Writing</div>
                <div className="writing-posts">
                  <div className="writing-post">
                    <div className="wp-title">Cómo moneticé una lib de código en 4 meses</div>
                    <div className="wp-meta">dev.to · 8 min · 2.1k lecturas</div>
                  </div>
                  <div className="writing-post">
                    <div className="wp-title">Por qué Solidity me abrió la cabeza como developer</div>
                    <div className="wp-meta">Mirror.xyz · 6 min · 890 lecturas</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

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
            <div className="ou-q">¿Qué sos, básicamente?</div>
            <div className="ou-sub">Podés elegir más de uno, che.</div>
            <div className="ou-options">
              <div className="ou-option selected" onClick={(e) => e.currentTarget.classList.toggle('selected')}>
                <div className="em" style={{ fontSize: '28px', marginBottom: '6px' }}>⌨️</div>
                <div className="nm">Developer</div>
                <div className="dc">Código, repos, commits</div>
              </div>
              <div className="ou-option" onClick={(e) => e.currentTarget.classList.toggle('selected')}>
                <div className="em" style={{ fontSize: '28px', marginBottom: '6px' }}>🎨</div>
                <div className="nm">Designer</div>
                <div className="dc">Figma, UI, sistemas</div>
              </div>
              <div className="ou-option selected" onClick={(e) => e.currentTarget.classList.toggle('selected')}>
                <div className="em" style={{ fontSize: '28px', marginBottom: '6px' }}>🚀</div>
                <div className="nm">Founder</div>
                <div className="dc">Startups, MRR, tracción</div>
              </div>
              <div className="ou-option" onClick={(e) => e.currentTarget.classList.toggle('selected')}>
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
        <p className="section-sub">Una identidad que no pide disculpas por existir.</p>

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
                <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>Buildeo, luego existo.</div>
              </div>
              <div className="ts-item">
                <div className="ts-label">Body — Bricolage Grotesque 400</div>
                <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-dim)' }}>Una identidad visual sin vergüenza, con personalidad argentina.</div>
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
          <p className="section-sub">Español rioplatense. Sin vueltas. Con humor inteligente.</p>

          <div className="microcopy-grid">
            {[
              { c: "Empty state — Proyectos", t: "Este bloque está más vacío que el INDEC.", s: "Agregá tu primer proyecto y dejá de scrollear Twitter.", a: "+ Agregar proyecto" },
              { c: "Empty state — GitHub", t: "¿Estás buildando o pensando en buildear?", s: "Conectá tu GitHub y mostrá que el code es real.", a: "Conectar →" },
              { c: "Onboarding — Step 2", t: "¿Qué onda tu stack?", s: "Elegís tu stack tecnológico. Te lo ordenamos bien, no en un párrafo de LinkedIn." },
              { c: "Onboarding — Bienvenida", t: "Buenas. Armémonos el perfil que merecés.", s: "Tres minutos, sin dolor. Prometemos que no te pedimos tu \"summary profesional\"." },
              { c: "CTA — Perfil público", t: "Mostrá lo que buildás.", s: "Tu obra. Tu URL. Sin necesidad de un diseñador caro ni un CV de Word de 2017." },
              { c: "Error — GitHub desconectado", t: "El GitHub no conectó. Nos pasa a todos.", s: "Revisá que hayas dado acceso a repos públicos. O cargá tus proyectos manualmente.", a: "Reintentar" }
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
        <Link href="/login" className="btn btn-accent" style={{ fontSize: '17px', padding: '16px 36px', display: 'inline-block' }}>
          Crear mi huevsite →
        </Link>
        <div style={{ marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
          Bento.me cerró. Nosotros no.
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="logo">huev<span style={{ color: 'var(--accent)' }}>site</span>.io</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mostrá lo que buildás.</div>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="#" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>Twitter/X</Link>
          <Link href="#" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>Discord</Link>
          <Link href="#" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}>GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
