"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProfileGrid } from "@/components/profile/ProfileGrid";

interface ShowcaseData {
  week: string;
  winners: any[];
  finalists: any[];
}

interface WinnerSectionProps {
  initialData?: ShowcaseData | null;
}

export function WinnerSection({ initialData }: WinnerSectionProps) {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(!initialData);

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

  if (loading || !data) return null;

  // Determine what profiles to show
  let profilesToShow: any[] = [];
  let titleText = "builder de la semana";
  let descText = "";

  if (data.winners && data.winners.length > 0) {
    profilesToShow = data.winners.map(w => transformUser(w.user));
    if (profilesToShow.length === 1) {
      descText = `Conocé a ${profilesToShow[0].name ?? profilesToShow[0].username}, el builder más nominado de la semana pasada (${data.week}).`;
    } else {
      titleText = "builders de la semana";
      descText = `Conocé a los builders en empate más nominados de la semana pasada (${data.week}).`;
    }
  } else if (data.finalists && data.finalists.length > 0) {
    profilesToShow = data.finalists.slice(0, 2).map((f: any) => transformUser(f.user));
    titleText = "top nominados de la semana";
    descText = `Conocé a los builders que lideran las nominaciones para la semana (${data.week}).`;
  }

  if (profilesToShow.length === 0) return null;

  return (
    <section className="demo-section !mt-20">
      <div className="flex flex-col items-center mb-12 text-center px-6">
      
        <p className="demo-label">// {titleText}</p>
        <p className="text-[var(--text-dim)] max-w-lg mx-auto leading-relaxed">
          {descText}
        </p>
      </div>
      
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
            <div className="demo-browser" style={{ height: '100%', minHeight: '600px' }}>
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

              <div className="profile-page !p-4 md:!p-8 scrollbar-hide bg-black/20 h-full overflow-y-auto">
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
    </section>
  );
}
