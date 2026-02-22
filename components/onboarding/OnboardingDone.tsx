"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { type OnboardingState } from "@/lib/onboarding-types";
import Link from "next/link";
import { Share2, Twitter, LineChart } from "lucide-react";

interface OnboardingDoneProps {
  state: OnboardingState;
}

export function OnboardingDone({ state }: OnboardingDoneProps) {
  const [copied, setCopied] = useState(false);
  const accent = state.accentColor;

  const copyLink = () => {
    navigator.clipboard.writeText(`huevsite.io/${state.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="landing min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 relative overflow-hidden font-display">
      {/* Background Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${accent}0d 0%, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="onboard-ui !max-w-md !p-12 !text-center !items-center flex flex-col"
      >
        {/* Animated Avatar */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-black font-black text-4xl mb-8 shadow-2xl"
          style={{ background: accent, boxShadow: `0 0 50px ${accent}30` }}
        >
          {state.githubData?.name?.[0] ?? "✓"}
        </motion.div>

        <div className="mb-10">
          <div className="section-label mb-2" style={{ color: accent }}>// publicado ✓</div>
          <h1 className="ou-q !text-4xl tracking-tight">
            ¡Salió andando, <span style={{ color: accent }}>{state.githubData?.name?.split(" ")[0] ?? "chabón"}</span>!
          </h1>
          <p className="ou-sub !text-base mt-2">
            Tu bento ya está live en la internet. Compartí tu laburo, que se note el esfuerzo.
          </p>
        </div>

        {/* URL Card */}
        <div 
          className="w-full bg-black/40 border rounded-2xl p-5 mb-10 group cursor-pointer transition-all hover:bg-black/60"
          style={{ borderColor: `${accent}30` }}
          onClick={copyLink}
        >
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2 flex justify-between">
            <span>tu url pública</span>
            {copied && <span style={{ color: accent }}>¡copiado!</span>}
          </div>
          <div className="text-xl font-mono tracking-tight">
            <span className="text-[var(--text-dim)]">huevsite.io/</span>
            <span style={{ color: accent }} className="font-bold">{state.username}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4">
          <Link
            href={`/${state.username}`}
            className="ou-next !py-5 !text-lg !text-black !flex !items-center !justify-center gap-2"
            style={{ background: accent, boxShadow: `0 0 40px ${accent}20` }}
          >
            Ver mi perfil <LineChart size={20} />
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--border-bright)] text-sm font-bold hover:bg-[var(--surface)] transition-all">
              <Twitter size={18} /> Twitear
            </button>
            <button 
              onClick={copyLink}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--border-bright)] text-sm font-bold hover:bg-[var(--surface)] transition-all"
            >
              <Share2 size={18} /> Compartir
            </button>
          </div>
        </div>

        <div className="mt-12 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-40">
          bento.me cerró • nosotros no
        </div>
      </motion.div>
    </div>
  );
}
