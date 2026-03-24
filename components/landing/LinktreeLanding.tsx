"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  Check,
  Globe,
  BarChart3,
  Users,
  ChevronDown,
  ExternalLink,
  Link2,
  Zap,
  Star,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Link2,
    title: "Importación instantánea",
    desc: "Pegás tu URL de Linktree y traemos bio, avatar y todos tus links automáticamente. Sin copiar uno por uno.",
  },
  {
    icon: BarChart3,
    title: "Más contexto, más identidad",
    desc: "Proyectos, GitHub, stack tecnológico, métricas. No solo botones sueltos — un perfil que dice quién sos de verdad.",
  },
  {
    icon: Users,
    title: "Una comunidad de builders",
    desc: "Score público, feed de lanzamientos, visibilidad real. Entrás a una red donde se valora lo que hacés, no solo lo que tenés.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Pegás tu URL",
    desc: "Cualquier link de Linktree o Bio.site. Lo procesamos en segundos.",
  },
  {
    n: "02",
    title: "Importamos todo",
    desc: "Bio, avatar y links ya en tu perfil. Partís con una base sólida, no de cero.",
  },
  {
    n: "03",
    title: "Publicás tu huevsite",
    desc: "Afinás lo que querés y en 3 minutos tenés tu URL lista para compartir.",
  },
];

const FAQS = [
  {
    q: "¿Tengo que rehacer todo desde cero?",
    a: "Para nada. Importamos lo que ya tenés en Linktree y partís de ahí. Es una base, no un lienzo en blanco.",
  },
  {
    q: "¿Se pierde mi Linktree?",
    a: "No. Tu Linktree sigue existiendo. Podés tener los dos hasta que te convenzas de quedarte solo con huevsite.",
  },
  {
    q: "¿Es gratis?",
    a: "Sí. Gratis para empezar con hasta 5 bloques. Pasate a PRO cuando necesites más espacio o tu propio dominio.",
  },
  {
    q: "¿Qué diferencia hay con una lista de links?",
    a: "Mucha. Un perfil de huevsite tiene proyectos, GitHub stats, stack, métricas y un score en la comunidad. Es un portfolio, no un hub.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lt-faq-item" onClick={() => setOpen(!open)}>
      <div className="lt-faq-q">
        <span>{q}</span>
        <ChevronDown
          size={16}
          className="lt-faq-chevron"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </div>
      {open && <div className="lt-faq-a">{a}</div>}
    </div>
  );
}

export default function LinktreeLanding() {
  const [user, setUser] = useState<User | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const normalizeLinktreeUrl = (input: string): string => {
    const trimmed = input.trim();
    // accept handle like "johndoe" or full URLs
    if (!trimmed) return "";
    if (trimmed.startsWith("http")) return trimmed;
    if (trimmed.includes(".")) return `https://${trimmed}`;
    return `https://linktr.ee/${trimmed}`;
  };

  const handleImport = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setUrlError("Ingresá tu URL de Linktree o tu username.");
      return;
    }
    const normalized = normalizeLinktreeUrl(trimmed);
    window.localStorage.setItem("huevsite_pending_linktree_url", normalized);
    if (user) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = `/login?next=${encodeURIComponent("/onboarding")}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleImport();
  };

  return (
    <div className="lt-landing">
      {/* ── NAV ───────────────────────────────────────── */}
      <nav className="lt-nav">
        <Link href="/" className="logo">
          huev<span style={{ color: "var(--accent)" }}>site</span>.io
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/explore" className="btn btn-ghost !py-2 !px-4 hidden sm:flex">
            Ver ejemplos
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="btn btn-accent !py-2 !px-5"
          >
            {user ? "Mi huevsite" : "Entrar →"}
          </Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="lt-hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lt-hero-inner"
        >
          <div className="lt-hero-badge">
            <span className="lt-hero-badge-dot" />
            Para usuarios de Linktree
          </div>

          <h1 className="lt-hero-title">
            Tu Linktree<br />
            <span style={{ color: "var(--accent)" }}>se quedó chico.</span>
          </h1>

          <p className="lt-hero-sub">
            Pegás tu URL, importamos bio, avatar y links automáticamente.
            En 3 minutos tenés un perfil que muestra quién sos de verdad.
          </p>

          {/* Input de importación */}
          <div className="lt-import-box">
            <div className="lt-import-prefix">linktr.ee/</div>
            <input
              className="lt-import-input"
              placeholder="tuusuario"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError("");
              }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="lt-import-btn" onClick={handleImport}>
              Importar
              <ArrowRight size={16} />
            </button>
          </div>

          {urlError && <p className="lt-import-error">{urlError}</p>}

          <p className="lt-import-hint">
            También podés pegar la URL completa: <code>https://linktr.ee/tuusuario</code>
          </p>

          {/* Social proof */}
          <div className="lt-social-proof">
            <div className="lt-avatars">
              {["M", "S", "L", "P", "A"].map((l, i) => (
                <div key={i} className={`lt-avatar lt-avatar--${i + 1}`}>{l}</div>
              ))}
            </div>
            <span className="lt-social-proof-text">
              Cientos de builders ya migraron desde Linktree
            </span>
          </div>
        </motion.div>
      </section>

      {/* ── BEFORE / AFTER ────────────────────────────── */}
      <section className="lt-compare-section">
        <div className="lt-compare-inner">
          <p className="lt-compare-label">// la diferencia</p>
          <h2 className="lt-compare-title">
            De una lista de links<br />
            a un <span style={{ color: "var(--accent)" }}>perfil de builder.</span>
          </h2>

          <div className="lt-compare-cards">
            {/* BEFORE — Linktree */}
            <div className="lt-compare-card lt-compare-card--before">
              <div className="lt-compare-card-header">
                <span className="lt-compare-pill lt-compare-pill--muted">Linktree</span>
                <span className="lt-compare-pill-sub">hub estático</span>
              </div>
              <div className="lt-linktree-mock">
                <div className="lt-linktree-avatar">T</div>
                <div className="lt-linktree-name">@tuusuario</div>
                <div className="lt-linktree-bio">Designer · dev · builder</div>
                {["Portfolio", "GitHub", "Twitter / X", "Newsletter", "Contacto"].map((l) => (
                  <div key={l} className="lt-linktree-link">
                    <ExternalLink size={13} className="opacity-40" />
                    {l}
                  </div>
                ))}
              </div>
              <p className="lt-compare-caption">Links sueltos. Sin contexto. Sin comunidad.</p>
            </div>

            {/* ARROW */}
            <div className="lt-compare-arrow">
              <div className="lt-compare-arrow-circle">
                <ArrowRight size={20} />
              </div>
              <span className="lt-compare-arrow-label">3 min</span>
            </div>

            {/* AFTER — huevsite */}
            <div className="lt-compare-card lt-compare-card--after">
              <div className="lt-compare-card-header">
                <span className="lt-compare-pill lt-compare-pill--accent">huevsite</span>
                <span className="lt-compare-pill-sub">perfil vivo</span>
              </div>
              <div className="lt-bento-mock">
                {/* Hero block */}
                <div className="lt-bento-block lt-bento-block--hero">
                  <div className="lt-bento-avatar">T</div>
                  <div>
                    <div className="lt-bento-name">Tu Nombre</div>
                    <div className="lt-bento-role">Developer · Indie Hacker</div>
                    <div className="lt-bento-score">Score 847</div>
                  </div>
                </div>
                {/* Building block */}
                <div className="lt-bento-block lt-bento-block--building">
                  <div className="lt-bento-block-label">Building now</div>
                  <div className="lt-bento-block-title">SaaS en progreso</div>
                  <div className="lt-bento-block-tech">Next.js · Supabase</div>
                </div>
                {/* GitHub */}
                <div className="lt-bento-block lt-bento-block--github">
                  <div className="lt-bento-block-label">GitHub</div>
                  <div className="lt-bento-heatmap">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="lt-bento-cell"
                        style={{ opacity: [0.15, 0.4, 0.7, 1][i % 4] }}
                      />
                    ))}
                  </div>
                </div>
                {/* Stack */}
                <div className="lt-bento-block lt-bento-block--stack">
                  <div className="lt-bento-block-label">Stack</div>
                  <div className="lt-bento-tags">
                    <span>React</span><span>Node</span><span>Figma</span>
                  </div>
                </div>
              </div>
              <p className="lt-compare-caption" style={{ color: "#efffc4" }}>
                Proyectos, código, identidad y comunidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────── */}
      <section className="lt-benefits-section">
        <div className="lt-section-inner">
          <p className="section-label">// por qué cambiarse</p>
          <h2 className="section-title">
            Lo que Linktree<br />no puede darte.
          </h2>
          <div className="lt-benefits-grid">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="lt-benefit-card">
                <div className="lt-benefit-icon">
                  <Icon size={20} />
                </div>
                <h3 className="lt-benefit-title">{title}</h3>
                <p className="lt-benefit-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ─────────────────────────────────────── */}
      <section className="lt-steps-section">
        <div className="lt-section-inner">
          <p className="section-label">// cómo funciona</p>
          <h2 className="section-title">
            Tres pasos.<br />
            <span style={{ color: "var(--accent)" }}>En serio.</span>
          </h2>
          <div className="lt-steps-grid">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="lt-step-card">
                <div className="lt-step-num">{n}</div>
                <h3 className="lt-step-title">{title}</h3>
                <p className="lt-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="lt-faq-section">
        <div className="lt-section-inner lt-section-inner--narrow">
          <p className="section-label">// preguntas frecuentes</p>
          <h2 className="section-title">Sin vueltas.</h2>
          <div className="lt-faq-list">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────── */}
      <section className="lt-cta-section">
        <div className="lt-cta-glow" />
        <div className="lt-cta-inner">
          <div className="lt-cta-icon">
            <Zap size={28} />
          </div>
          <h2 className="lt-cta-title">
            Traé tu Linktree.<br />
            <span style={{ color: "var(--accent)" }}>Quedáte por el perfil.</span>
          </h2>
          <p className="lt-cta-sub">
            Gratis para empezar. Sin tarjeta de crédito. Listo en 3 minutos.
          </p>
          <div className="lt-cta-import-box">
            <div className="lt-import-prefix">linktr.ee/</div>
            <input
              className="lt-import-input"
              placeholder="tuusuario"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError("");
              }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="lt-import-btn" onClick={handleImport}>
              Empezar gratis
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="lt-cta-trust">
            {["Importación automática", "Gratis para siempre", "Sin tarjeta"].map((t, i) => (
              <span key={i} className="lt-cta-trust-item">
                <Check size={12} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="lt-footer">
        <Link href="/" className="logo">
          huev<span style={{ color: "var(--accent)" }}>site</span>.io
        </Link>
        <div className="lt-footer-links">
          <Link href="/explore">Explorar builders</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/login">Entrar</Link>
        </div>
      </footer>
    </div>
  );
}
