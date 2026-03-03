"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { ProfileGrid } from "@/components/profile/ProfileGrid";

interface ShowcaseData {
  week: string;
  winners: any[];
  finalists: any[];
  randoms?: any[];
}

interface WinnerSectionProps {
  initialData?: ShowcaseData | null;
}

export function WinnerSection({ initialData }: WinnerSectionProps) {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(!initialData);

  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const d = new Date();
      d.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      d.setHours(0, 0, 0, 0);
      const diff = d.getTime() - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const transformUser = (rawUser: any) => {
    if (!rawUser) return null;
    const transformedBlocks = (rawUser.blocks || []).map((block: any) => {
      const { id, type, order, col_span, row_span, visible, ...cleanData } = block.data || {};
      return {
        id: block.id,
        type: block.type,
        order: block.order,
        col_span: block.col_span || col_span || 1,
        row_span: block.row_span || row_span || 1,
        visible: block.visible,
        ...cleanData
      };
    });
    return {
      ...rawUser,
      blocks: transformedBlocks
    };
  };

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    fetch("/api/social/showcase")
      .then(r => r.json())
      .then(res => {
        setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initialData]);

  const [currentRandomIndex, setCurrentRandomIndex] = useState(0);

  useEffect(() => {
    if (data && (!data.winners || data.winners.length === 0) && data.randoms && data.randoms.length > 0) {
      const interval = setInterval(() => {
        setCurrentRandomIndex((prev) => (prev + 1) % data.randoms!.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [data]);

  if (loading || !data) return null;

  // Determine what profiles to show
  let profilesToShow: any[] = [];
  let titleText = "builder de la semana";
  let descText = "";
  let isSliding = false;

  if (data.winners && data.winners.length > 0) {
    profilesToShow = data.winners.map(w => transformUser(w.user));
    if (profilesToShow.length === 1) {
      descText = `Conocé a ${profilesToShow[0].name ?? profilesToShow[0].username}, el builder más nominado de la semana pasada (${data.week}).`;
    } else {
      titleText = "builders de la semana";
      descText = `Conocé a los builders en empate más nominados de la semana pasada (${data.week}).`;
    }
  } else if (data.randoms && data.randoms.length > 0) {
    isSliding = true;
    profilesToShow = [transformUser(data.randoms[currentRandomIndex])];
    titleText = "descubrí la comunidad";
    descText = "Conocé a los creadores de todo LATAM que están buildeando cosas increíbles hoy mismo.";
  }

  if (profilesToShow.length === 0 || !profilesToShow[0]) return null;

  return (
    <section className="demo-section !mt-20">
      <div className="flex flex-col items-center mb-12 text-center px-6">

        <p className="demo-label">// {titleText}</p>
        <p className="text-[var(--text-dim)] max-w-lg mx-auto leading-relaxed">
          {descText}
        </p>
      </div>
      {isSliding ? (
        <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-1 justify-center overflow-hidden h-[60vh] min-h-[450px] md:h-[70vh] md:min-h-[600px] max-h-[800px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={profilesToShow[0].id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full h-full md:col-span-2 max-w-5xl mx-auto flex"
            >
              <div className="demo-browser flex flex-col w-full h-[60vh] min-h-[450px] md:h-[70vh] md:min-h-[600px] max-h-[800px]">
                <div className="browser-bar">
                  <div className="browser-dots">
                    <span className="bd1"></span>
                    <span className="bd2"></span>
                    <span className="bd3"></span>
                  </div>
                  <Link
                    href={`/${profilesToShow[0].username}`}
                    target="_blank"
                    className="browser-url group flex items-center justify-center gap-1 hover:text-white transition-colors"
                  >
                    huevsite.io/<span>{profilesToShow[0].username}</span>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                  </Link>
                </div>

                <div className="profile-page !bg-transparent !p-4 md:!p-8 scrollbar-hide h-full overflow-y-auto">
                  <div className="relative z-10 w-full max-w-4xl mx-auto">
                    <ProfileGrid
                      blocks={profilesToShow[0].blocks}
                      accentColor={profilesToShow[0].accent_color}
                      displayName={profilesToShow[0].name || profilesToShow[0].username}
                      tagline={profilesToShow[0].tagline || undefined}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
          {profilesToShow.map((profile, idx) => (
            <motion.div
              key={profile.id || idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.2 }}
              className={`w-full ${profilesToShow.length === 1 ? 'md:col-span-2 max-w-5xl mx-auto' : ''}`}
            >
              <div className="demo-browser flex flex-col h-full w-full">
                <div className="browser-bar">
                  <div className="browser-dots">
                    <span className="bd1"></span>
                    <span className="bd2"></span>
                    <span className="bd3"></span>
                  </div>
                  <Link
                    href={`/${profile.username}`}
                    target="_blank"
                    className="browser-url group flex items-center justify-center gap-1 hover:text-white transition-colors"
                  >
                    huevsite.io/<span>{profile.username}</span>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                  </Link>
                </div>

                <div className="profile-page !bg-transparent !p-4 md:!p-8 scrollbar-hide h-full overflow-y-auto">
                  <div className="relative z-10 w-full max-w-4xl mx-auto">
                    <ProfileGrid
                      blocks={profile.blocks}
                      accentColor={profile.accent_color}
                      displayName={profile.name || profile.username}
                      tagline={profile.tagline || undefined}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {mounted && (
        <div className="mt-16 mx-4 md:mx-auto max-w-[1400px] bg-white/[0.02] border border-[var(--border-bright)] rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-dim)] to-transparent opacity-20 pointer-events-none"></div>

          <div className="relative z-10 text-center lg:text-left flex-1 max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight flex items-center justify-center lg:justify-start gap-3">
              <Trophy size={28} className="text-[var(--accent)]" />
              Vos podés ser el próximo.
            </h3>
            <p className="text-[var(--text-dim)] text-[15px] md:text-base leading-relaxed">
              Armá tu perfil, mostrá lo que sabés hacer y pedile a tus contactos que te nominen. Cada domingo a la medianoche los builders más nominados por la comunidad pasan a la portada toda la semana.
            </p>
          </div>

          <div className="relative z-10 flex flex-col w-full lg:w-auto items-center lg:items-end shrink-0 bg-black/40 p-6 rounded-xl border border-white/5">
            <div className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
              Cierre de esta edición
            </div>

            <div className="flex gap-4 sm:gap-6 font-mono text-3xl sm:text-4xl font-bold mb-6">
              <div className="flex flex-col items-center">
                <span>{timeLeft.d.toString().padStart(2, '0')}</span>
                <span className="text-[10px] !font-sans text-[var(--text-muted)] font-normal uppercase tracking-wider mt-2">Días</span>
              </div>
              <span className="text-[var(--border-bright)] -mt-1">:</span>
              <div className="flex flex-col items-center">
                <span>{timeLeft.h.toString().padStart(2, '0')}</span>
                <span className="text-[10px] !font-sans text-[var(--text-muted)] font-normal uppercase tracking-wider mt-2">Hrs</span>
              </div>
              <span className="text-[var(--border-bright)] -mt-1">:</span>
              <div className="flex flex-col items-center">
                <span>{timeLeft.m.toString().padStart(2, '0')}</span>
                <span className="text-[10px] !font-sans text-[var(--text-muted)] font-normal uppercase tracking-wider mt-2">Min</span>
              </div>
              <span className="text-[var(--border-bright)] -mt-1">:</span>
              <div className="flex flex-col items-center text-[var(--text-dim)]">
                <span>{timeLeft.s.toString().padStart(2, '0')}</span>
                <span className="text-[10px] !font-sans text-[var(--border-bright)] font-normal uppercase tracking-wider mt-2">Seg</span>
              </div>
            </div>

            <Link href="/login" className="w-full px-6 py-3 bg-[var(--surface2)] hover:bg-[var(--border-bright)] border border-[var(--border-bright)] rounded-lg text-[14px] font-bold transition-all text-white text-center whitespace-nowrap hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(200,255,0,0.1)]">
              Subir mi perfil ahora →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
