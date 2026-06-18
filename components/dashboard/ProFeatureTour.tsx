"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, ArrowRight, BarChart3, LayoutGrid, Globe, Layers, Sparkles } from "lucide-react";

interface ProFeatureTourProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  onFinish: () => void;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export function ProFeatureTour({ isOpen, onClose, accentColor, onFinish }: ProFeatureTourProps) {
  const t = useTranslations("dashboard");
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const STEPS = [
    {
      icon: BarChart3,
      eyebrow: t("proTour.step1.eyebrow"),
      title: t("proTour.step1.title"),
      hook: t("proTour.step1.hook"),
      bullets: [
        t("proTour.step1.bullet1"),
        t("proTour.step1.bullet2"),
        t("proTour.step1.bullet3"),
      ],
      cta: null,
      accentOpacity: "15",
    },
    {
      icon: LayoutGrid,
      eyebrow: t("proTour.step2.eyebrow"),
      title: t("proTour.step2.title"),
      hook: t("proTour.step2.hook"),
      bullets: [
        t("proTour.step2.bullet1"),
        t("proTour.step2.bullet2"),
        t("proTour.step2.bullet3"),
      ],
      cta: null,
      accentOpacity: "15",
    },
    {
      icon: Layers,
      eyebrow: t("proTour.step3.eyebrow"),
      title: t("proTour.step3.title"),
      hook: t("proTour.step3.hook"),
      bullets: [
        t("proTour.step3.bullet1"),
        t("proTour.step3.bullet2"),
        t("proTour.step3.bullet3"),
      ],
      cta: null,
      accentOpacity: "15",
    },
    {
      icon: Globe,
      eyebrow: t("proTour.step4.eyebrow"),
      title: t("proTour.step4.title"),
      hook: t("proTour.step4.hook"),
      bullets: [
        t("proTour.step4.bullet1"),
        t("proTour.step4.bullet2"),
        t("proTour.step4.bullet3"),
      ],
      cta: null,
      accentOpacity: "15",
    },
    {
      icon: Sparkles,
      eyebrow: t("proTour.step5.eyebrow"),
      title: t("proTour.step5.title"),
      hook: t("proTour.step5.hook"),
      bullets: [
        t("proTour.step5.bullet1"),
        t("proTour.step5.bullet2"),
        t("proTour.step5.bullet3"),
      ],
      cta: t("proTour.step5.cta"),
      accentOpacity: "15",
    },
  ];

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  function goTo(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function handleNext() {
    if (isLast) {
      onFinish();
    } else {
      goTo(step + 1);
    }
  }

  return createPortal(
    <div className="portal-root fixed inset-0 z-[400] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        className="relative w-full max-w-md z-10 overflow-hidden"
        style={{
          background: "rgba(10,10,12,0.98)",
          border: `1px solid rgba(255,255,255,0.08)`,
          borderRadius: "2rem",
        }}
      >
        {/* Accent glow top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-0">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
            {current.eyebrow}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Animated content */}
        <div className="relative overflow-hidden" style={{ minHeight: 320 }}>
          <AnimatePresence custom={dir} mode="popLayout">
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              className="px-7 pt-7 pb-2"
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border"
                style={{
                  background: `${accentColor}14`,
                  borderColor: `${accentColor}30`,
                  color: accentColor,
                }}
              >
                <Icon size={26} strokeWidth={1.8} />
              </div>

              {/* Title + hook */}
              <h2 className="text-2xl font-black tracking-tight text-white mb-2 leading-tight">
                {current.title}
              </h2>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                {current.hook}
              </p>

              {/* Bullets */}
              <ul className="space-y-3">
                {current.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px] font-black"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      ✓
                    </span>
                    <span className="text-sm text-white/70 leading-snug">{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 pt-4">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? accentColor : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => goTo(step - 1)}
                className="flex-none px-5 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-bold text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
              >
                {t("proTour.back")}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all shadow-lg"
              style={{
                background: accentColor,
                color: accentColor === "#C8FF00" || accentColor === "#FFD600" ? "#000" : "#000",
              }}
            >
              {isLast ? (
                <>
                  {current.cta}
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  {t("proTour.next")}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
