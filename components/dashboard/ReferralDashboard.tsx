"use client";

import { useState } from "react";
import { Share2, Copy, Check, Users, Gift, ArrowRight } from "lucide-react";
import { ProfileData } from "@/lib/profile-types";
import { clsx } from "clsx";

interface ReferralDashboardProps {
  profile: ProfileData;
}

export function ReferralDashboard({ profile }: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://huevsite.io/login?ref=${profile.referralCode}`;
  const referralCount = profile.proReferralsCount || 0;
  const target = 3;
  const progress = Math.min((referralCount / target) * 100, 100);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-8 overflow-hidden relative group">
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#C8FF00]/5 rounded-full blur-[80px] group-hover:bg-[#C8FF00]/10 transition-colors duration-700" />
      
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Gift className="w-6 h-6 text-[#C8FF00]" />
              Programa de Referidos
            </h2>
            <p className="text-zinc-400 text-sm">
              Traé 3 usuarios PRO y llevate <span className="text-[#C8FF00] font-medium">3 meses de PRO gratis</span>.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-white">{referralCount} / {target}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-zinc-500">
            <span>Progreso</span>
            <span>{referralCount} de {target} referidos PRO</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/30">
            <div 
              className="h-full bg-[#C8FF00] transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(200,255,0,0.3)]"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          {referralCount >= target && (
             <div className="flex items-center gap-2 text-[#C8FF00] text-sm font-medium animate-bounce mt-2">
                <Check className="w-4 h-4" />
                ¡Meta alcanzada! Disfrutá de tus 3 meses de PRO.
             </div>
          )}
        </div>

        {/* Referral Link Section */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
            Tu link mágico de referido
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-black/40 border border-zinc-800 rounded-2xl px-4 py-3 text-zinc-300 font-mono text-sm truncate relative group/link">
              {referralLink}
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
            </div>
            <button
              onClick={copyToClipboard}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-200 active:scale-95 whitespace-nowrap",
                copied 
                  ? "bg-emerald-500 text-white" 
                  : "bg-white text-black hover:bg-[#C8FF00] hover:shadow-[0_0_20px_rgba(200,255,0,0.4)]"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-[#C8FF00]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Compartí</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Mandale el link a tus amigos builders.
              </p>
            </div>
          </div>
          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 text-[#C8FF00]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Ganás</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Cuando 3 se hagan PRO, desbloqueás tu recompensa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
