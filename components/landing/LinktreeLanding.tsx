"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import LocaleToggle from "@/components/LocaleToggle";
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
  const t = useTranslations("linktree");
  const [user, setUser] = useState<User | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const BENEFITS = [
    {
      icon: Link2,
      title: t("benefit1Title"),
      desc: t("benefit1Desc"),
    },
    {
      icon: BarChart3,
      title: t("benefit2Title"),
      desc: t("benefit2Desc"),
    },
    {
      icon: Users,
      title: t("benefit3Title"),
      desc: t("benefit3Desc"),
    },
  ];

  const STEPS = [
    {
      n: "01",
      title: t("step1Title"),
      desc: t("step1Desc"),
    },
    {
      n: "02",
      title: t("step2Title"),
      desc: t("step2Desc"),
    },
    {
      n: "03",
      title: t("step3Title"),
      desc: t("step3Desc"),
    },
  ];

  const FAQS = [
    {
      q: t("faq1Q"),
      a: t("faq1A"),
    },
    {
      q: t("faq2Q"),
      a: t("faq2A"),
    },
    {
      q: t("faq3Q"),
      a: t("faq3A"),
    },
    {
      q: t("faq4Q"),
      a: t("faq4A"),
    },
  ];

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
      setUrlError(t("urlError"));
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
          <LocaleToggle />
          <Link href="/explore" className="btn btn-ghost !py-2 !px-4 hidden sm:flex">
            {t("navExamples")}
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="btn btn-accent !py-2 !px-5"
          >
            {user ? t("navMyHuevsite") : t("navLogin")}
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
            {t("heroBadge")}
          </div>

          <h1 className="lt-hero-title">
            {t("heroTitleLine1")}<br />
            <span style={{ color: "var(--accent)" }}>{t("heroTitleLine2")}</span>
          </h1>

          <p className="lt-hero-sub">
            {t("heroSubtitle")}
          </p>

          {/* Input de importación */}
          <div className="lt-import-box">
            <div className="lt-import-prefix">linktr.ee/</div>
            <input
              className="lt-import-input"
              placeholder={t("importPlaceholder")}
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
              {t("importButton")}
              <ArrowRight size={16} />
            </button>
          </div>

          {urlError && <p className="lt-import-error">{urlError}</p>}

          <p className="lt-import-hint">
            {t("importHintPrefix")} <code>https://linktr.ee/tuusuario</code>
          </p>

          {/* Social proof */}
          <div className="lt-social-proof">
            <div className="lt-avatars">
              {["M", "S", "L", "P", "A"].map((l, i) => (
                <div key={i} className={`lt-avatar lt-avatar--${i + 1}`}>{l}</div>
              ))}
            </div>
            <span className="lt-social-proof-text">
              {t("socialProof")}
            </span>
          </div>
        </motion.div>
      </section>

      {/* ── BEFORE / AFTER ────────────────────────────── */}
      <section className="lt-compare-section">
        <div className="lt-compare-inner">
          <p className="lt-compare-label">{t("compareLabel")}</p>
          <h2 className="lt-compare-title">
            {t("compareTitleLine1")}<br />
            {t("compareTitleLine2Prefix")} <span style={{ color: "var(--accent)" }}>{t("compareTitleLine2Highlight")}</span>
          </h2>

          <div className="lt-compare-cards">
            {/* BEFORE — Linktree */}
            <div className="lt-compare-card lt-compare-card--before">
              <div className="lt-compare-card-header">
                <span className="lt-compare-pill lt-compare-pill--muted">Linktree</span>
                <span className="lt-compare-pill-sub">{t("compareBeforePill")}</span>
              </div>
              <div className="lt-linktree-mock">
                <div className="lt-linktree-avatar">T</div>
                <div className="lt-linktree-name">@tuusuario</div>
                <div className="lt-linktree-bio">Designer · dev · builder</div>
                {["Portfolio", "GitHub", "Twitter / X", "Newsletter", t("compareLinkContact")].map((l) => (
                  <div key={l} className="lt-linktree-link">
                    <ExternalLink size={13} className="opacity-40" />
                    {l}
                  </div>
                ))}
              </div>
              <p className="lt-compare-caption">{t("compareBeforeCaption")}</p>
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
                <span className="lt-compare-pill-sub">{t("compareAfterPill")}</span>
              </div>
              <div className="lt-bento-mock">
                {/* Hero block */}
                <div className="lt-bento-block lt-bento-block--hero">
                  <div className="lt-bento-avatar">T</div>
                  <div>
                    <div className="lt-bento-name">{t("compareBentoName")}</div>
                    <div className="lt-bento-role">Developer · Indie Hacker</div>
                    <div className="lt-bento-score">Score 847</div>
                  </div>
                </div>
                {/* Building block */}
                <div className="lt-bento-block lt-bento-block--building">
                  <div className="lt-bento-block-label">Building now</div>
                  <div className="lt-bento-block-title">{t("compareBentoBuildingTitle")}</div>
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
                {t("compareAfterCaption")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────── */}
      <section className="lt-benefits-section">
        <div className="lt-section-inner">
          <p className="section-label">{t("benefitsLabel")}</p>
          <h2 className="section-title">
            {t("benefitsTitleLine1")}<br />{t("benefitsTitleLine2")}
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
          <p className="section-label">{t("stepsLabel")}</p>
          <h2 className="section-title">
            {t("stepsTitleLine1")}<br />
            <span style={{ color: "var(--accent)" }}>{t("stepsTitleLine2")}</span>
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
          <p className="section-label">{t("faqLabel")}</p>
          <h2 className="section-title">{t("faqTitle")}</h2>
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
            {t("ctaTitleLine1")}<br />
            <span style={{ color: "var(--accent)" }}>{t("ctaTitleLine2")}</span>
          </h2>
          <p className="lt-cta-sub">
            {t("ctaSubtitle")}
          </p>
          <div className="lt-cta-import-box">
            <div className="lt-import-prefix">linktr.ee/</div>
            <input
              className="lt-import-input"
              placeholder={t("importPlaceholder")}
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
              {t("ctaImportButton")}
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="lt-cta-trust">
            {[t("ctaTrust1"), t("ctaTrust2"), t("ctaTrust3")].map((label, i) => (
              <span key={i} className="lt-cta-trust-item">
                <Check size={12} />
                {label}
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
          <Link href="/explore">{t("footerExplore")}</Link>
          <Link href="/blog">{t("footerBlog")}</Link>
          <Link href="/login">{t("footerLogin")}</Link>
        </div>
      </footer>
    </div>
  );
}
