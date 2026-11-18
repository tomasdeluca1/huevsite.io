"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { BarChart3, Globe, Layout, LayoutGrid, Rocket, Zap } from "lucide-react";

const card = "rounded-[1.6rem] border border-white/8 bg-white/[0.025]";

// El ranking del tile principal: al entrar en pantalla, "@vos" sube del #3 al #1.
function RankClimb() {
  const t = useTranslations("landing");
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [climbed, setClimbed] = useState(false);
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setClimbed(true); return; }
    const id = window.setTimeout(() => setClimbed(true), 450);
    return () => window.clearTimeout(id);
  }, [inView]);

  const rows = [
    { id: "a", w: "76%" },
    { id: "b", w: "58%" },
    { id: "you", w: "100%" },
  ];
  const ordered = climbed ? [rows[2], rows[0], rows[1]] : rows;

  return (
    <div ref={ref} className="flex flex-col gap-2 rounded-2xl bg-black/30 p-3" aria-hidden>
      {ordered.map((r, i) => {
        const you = r.id === "you";
        return (
          <motion.div
            key={r.id}
            layout
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${you ? "bg-[rgba(200,255,0,0.1)] ring-1 ring-[rgba(200,255,0,0.45)]" : ""}`}
          >
            <span className={`w-6 font-mono text-[11px] font-bold ${you && climbed ? "text-[var(--accent)]" : "text-white/30"}`}>#{i + 1}</span>
            {you ? (
              <span className="flex-1 font-mono text-[13px] font-bold text-[var(--accent)]">@{t("proBentoYou")}</span>
            ) : (
              <span className="h-1.5 flex-1 rounded-full bg-white/[0.07]" style={{ maxWidth: r.w }} />
            )}
            {you && (
              <motion.span
                initial={false}
                animate={{ opacity: climbed ? 1 : 0, y: climbed ? 0 : 4 }}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]"
              >
                {t("proRankUp")}
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

interface Props {
  /** Los precios (PricingTiers), debajo de lo que suma Pro. */
  pricing: ReactNode;
}

// huevsite pro: qué suma (con el antes y después de cada cosa) y los planes.
export function ProShowcase({ pricing }: Props) {
  const t = useTranslations("landing");
  const tiles = [
    { icon: Globe, title: t("proFeatureDomainTitle"), desc: t("proFeatureDomainDesc"), chip: t("proChipDomain") },
    { icon: BarChart3, title: t("proFeatureInsightsTitle"), desc: t("proFeatureInsightsDesc"), chip: t("proChipInsights") },
    { icon: LayoutGrid, title: t("proFeatureSubsitesTitle"), desc: t("proFeatureSubsitesDesc"), chip: t("proChipSubsites") },
    { icon: Layout, title: t("proFeatureGridTitle"), desc: t("proFeatureGridDesc"), chip: t("proChipGrid") },
    { icon: Rocket, title: t("proFeatureLaunchTitle"), desc: t("proFeatureLaunchDesc"), chip: t("proChipLaunch") },
  ];

  return (
    <section
      id="precios"
      style={{ padding: "var(--section-y) var(--section-x)", background: "linear-gradient(180deg, transparent 0%, rgba(200,255,0,0.03) 100%)", scrollMarginTop: "80px" }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }} className="flex flex-col gap-10">
        <div className="mx-auto max-w-[720px] text-center">
          <div className="section-label" style={{ justifyContent: "center" }}>{t("proLabelClean")}</div>
          <h2 className="section-title">{t("proTitlePrefix")} <span className="accent">{t("proTitleAccent")}</span></h2>
          <p className="section-sub mx-auto max-w-[540px]">{t("proSub")}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* Lo principal: aparecés primero */}
          <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-[1.6rem] border border-[rgba(200,255,0,0.3)] bg-[rgba(200,255,0,0.035)] p-6 md:col-span-2 md:p-8 lg:row-span-2">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[rgba(200,255,0,0.12)] blur-[90px]" />
            <div className="relative">
              <span className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-[#050505]"><Zap size={18} strokeWidth={2.4} /></span>
              <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl">{t("proFeatureVisibilityTitle")}</h3>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">{t("proFeatureVisibilityDesc")}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {t("proBentoHeroSurfaces").split("·").map((s) => (
                  <span key={s} className="rounded-full border border-[rgba(200,255,0,0.3)] px-2.5 py-1 font-mono text-[10.5px] text-[var(--accent)]">{s.trim()}</span>
                ))}
              </div>
            </div>
            <div className="relative"><RankClimb /></div>
          </div>

          {tiles.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`${card} group flex flex-col gap-3 p-6 transition-colors hover:border-[rgba(200,255,0,0.3)] ${i === tiles.length - 1 ? "md:col-span-2 lg:col-span-1" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[rgba(200,255,0,0.1)] text-[var(--accent)]"><Icon size={16} /></span>
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-1 font-mono text-[10.5px] text-white/60 transition-colors group-hover:text-[var(--accent)]">{f.chip}</span>
                </div>
                <h3 className="text-[17px] font-black tracking-tight text-white">{f.title}</h3>
                <p className="text-sm leading-6 text-[var(--text-muted)]">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-8">
          <div className="mx-auto max-w-[640px] text-center">
            <div className="section-label" style={{ justifyContent: "center" }}>{t("proPricingLabelClean")}</div>
            <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl">{t("proPricingLead")}</h3>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid items-stretch gap-4 md:grid-cols-3"
          >
            {pricing}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
