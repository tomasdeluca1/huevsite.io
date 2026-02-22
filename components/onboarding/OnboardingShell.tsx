"use client";

import { motion, AnimatePresence } from "framer-motion";
import { STEPS, type StepId } from "@/lib/onboarding-types";
import Link from "next/link";

interface OnboardingShellProps {
  currentStep: number;
  children: React.ReactNode;
  stepKey: StepId;
}

export function OnboardingShell({
  currentStep,
  children,
  stepKey,
}: OnboardingShellProps) {
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="landing min-h-screen bg-[var(--bg)] flex flex-col font-display">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Progress bar */}
        <div className="h-[2px] bg-[var(--surface2)] w-full">
          <motion.div
            className="h-full bg-[var(--accent)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              boxShadow: "0 0 12px var(--accent-mid)",
            }}
          />
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between px-8 py-4 bg-[rgba(8,8,8,0.7)] backdrop-blur-xl border-b border-[var(--border)]">
          <Link href="/" className="logo scale-90 origin-left">
            huev<span>site</span>.io
          </Link>

          {/* Step indicators */}
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((step, i) => {
              const state =
                i < currentStep
                  ? "done"
                  : i === currentStep
                  ? "active"
                  : "upcoming";
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={`
                      flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider
                      transition-all duration-300
                      ${
                        state === "done"
                          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                          : state === "active"
                          ? "bg-[var(--accent-mid)] text-[var(--accent)] border border-[var(--accent-mid)]"
                          : "text-[var(--text-muted)] bg-transparent"
                      }
                    `}
                  >
                    {state === "done" ? "✓" : i + 1}
                    <span className="hidden md:inline">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-4 h-[1px] bg-[var(--border)]" />
                  )}
                </div>
              );
            })}
          </div>

          <Link href="/dashboard" className="text-[var(--text-dim)] hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
            saltar todo →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center pt-32 pb-12 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(200,255,0,0.06)_0%,transparent_70%)] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={stepKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl relative z-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="text-center py-6 text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-[0.2em] relative z-10">
        paso {currentStep + 1} de {STEPS.length} • builder logic
      </footer>
    </div>
  );
}
