"use client";

import { X, TrendingUp, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";

interface PriceBannerProps {
  className?: string;
}

export function PriceBanner({ className }: PriceBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={clsx(
      "sticky top-0 z-[1200] transition-all duration-300",
      className,
      isScrolled ? "mt-0" : "mt-0 sm:mt-4"
    )}>
      <div className={clsx(
        "max-w-7xl mx-auto bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-y sm:border border-[#C8FF00]/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden relative isolate",
        isScrolled ? "rounded-none" : "sm:rounded-2xl"
      )}>
        {/* Animated background stripes */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[length:40px_40px] bg-[linear-gradient(45deg,white_25%,transparent_25%,transparent_50%,white_50%,white_75%,transparent_75%,transparent)] animate-[move-bg_2s_linear_infinite]" />
        
        <div className="relative z-10 px-4 py-3 sm:px-5 sm:py-4 lg:px-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 text-left">
            <div className="hidden lg:flex w-10 h-10 rounded-full bg-[#C8FF00]/10 items-center justify-center shrink-0 border border-[#C8FF00]/20">
              <TrendingUp className="w-5 h-5 text-[#C8FF00]" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm sm:text-base font-bold flex flex-wrap items-center gap-2">
                <span>¡Aprovechá la oferta de lanzamiento!</span>
                <span className="bg-[#C8FF00] text-black text-[10px] px-1.5 py-0.5 rounded-md font-black uppercase whitespace-nowrap">Próximamente $9</span>
              </p>
              <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                Hoy sale <span className="text-white font-bold">$5</span> por mes, pero muy pronto el precio <span className="text-white font-medium underline decoration-[#C8FF00]">aumentará a $9</span>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full xl:w-auto">
            <Link 
              href="/dashboard?pro=true" 
              className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-[#C8FF00] hover:bg-[#d4ff33] text-black font-black text-sm px-5 sm:px-6 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#C8FF00]/10 whitespace-nowrap"
            >
              ASEGURÁ TU PRECIO
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => setIsVisible(false)}
              className="shrink-0 p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes move-bg {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>
    </div>
  );
}
