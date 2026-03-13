"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Settings, ArrowLeft, Copy, Check, Globe, Activity, 
  Compass, Save, LogOut, MessageSquare, Layout as LayoutIcon, 
  Sparkles, ArrowUpRight, Lock, ChevronRight, User, PlusCircle
} from "lucide-react";
import Link from "next/link";
import { ProfileData, BlockType } from "@/lib/profile-types";
import { ColorPicker } from "./ColorPicker";
import { BlockSelector } from "./BlockSelector";

interface SidebarProps {
  profile: ProfileData;
  selectedSubSiteId: string | null;
  setSelectedSubSiteId: (id: string | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSaving: boolean;
  copied: boolean;
  handleCopyUrl: () => void;
  handleLogout: () => void;
  setIsProfileModalOpen: (open: boolean) => void;
  setIsScoreInfoOpen: (open: boolean) => void;
  setIsProSettingsOpen: (open: boolean) => void;
  setIsUpgradeModalOpen: (open: boolean) => void;
  setIsFeedbackOpen: (open: boolean) => void;
  setTempProfileData: (data: any) => void;
  addBlock: (type: BlockType) => void;
  handleColorChange: (color: string, confirmed: boolean) => void;
  toggleAutoSave: () => void;
  autoSaveEnabled: boolean;
  onShareUnlocked: () => void;
}

export function DashboardSidebar({
  profile,
  selectedSubSiteId,
  setSelectedSubSiteId,
  isSidebarOpen,
  setIsSidebarOpen,
  isSaving,
  copied,
  handleCopyUrl,
  handleLogout,
  setIsProfileModalOpen,
  setIsScoreInfoOpen,
  setIsProSettingsOpen,
  setIsUpgradeModalOpen,
  setIsFeedbackOpen,
  setTempProfileData,
  addBlock,
  handleColorChange,
  toggleAutoSave,
  autoSaveEnabled,
  onShareUnlocked
}: SidebarProps) {
  
  const currentSubSite = profile.subSites.find(s => s.id === selectedSubSiteId);

  const openModal = (modalFn: (open: boolean) => void) => {
    setIsSidebarOpen(false);
    modalFn(true);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[105] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 w-[300px] shrink-0 border-r border-white/5 bg-[#09090b]/80 
        backdrop-blur-xl z-[110] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:sticky md:top-0 md:h-full md:translate-x-0 flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)]
        scrollbar-none
      `}>
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[var(--accent)]/5 to-transparent pointer-events-none" />
        
        {/* Header Section */}
        <div className="p-6 pb-2 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="group flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform shadow-[0_0_15px_var(--accent)]/40">
                <Sparkles size={18} className="text-black" />
              </div>
              <span className="text-xl font-[900] tracking-tighter text-white">huev<span className="text-[var(--accent)]">site</span></span>
            </Link>
          </div>

          {/* Site Identity Card */}
          <div className="relative group/identity mb-6">
            <motion.div 
              layout
              className="p-4 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:border-[var(--accent)]/20 transition-all hover:bg-white/[0.05] relative overflow-hidden"
              onClick={() => {
                if (!selectedSubSiteId) {
                  setTempProfileData({
                    username: profile.username,
                    display_name: profile.displayName,
                    tagline: profile.tagline || '',
                    avatarUrl: profile.avatarUrl || '',
                    githubHandle: profile.githubHandle || ''
                  });
                  openModal(setIsProfileModalOpen);
                }
              }}
            >
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative shrink-0">
                  {selectedSubSiteId && currentSubSite?.avatarUrl ? (
                    <img src={currentSubSite.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/10" />
                  ) : profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center font-bold text-[var(--accent)] ring-2 ring-white/10">
                      {(selectedSubSiteId ? currentSubSite?.title : profile.displayName)?.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center text-[8px] text-black font-black border-2 border-[#09090b]">
                    {selectedSubSiteId ? "S" : "P"}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate flex items-center gap-1">
                    {selectedSubSiteId ? currentSubSite?.title : (profile.displayName || profile.username)}
                    {!selectedSubSiteId && <ChevronRight size={12} className="opacity-40 group-hover/identity:translate-x-0.5 transition-transform" />}
                  </h3>
                  <div className="flex items-center gap-1 opacity-50 font-mono text-[10px] tracking-tight truncate">
                    <span>huev.io/</span>
                    <span className="text-[var(--accent)] font-bold">
                      {selectedSubSiteId ? `${profile.username}/${currentSubSite?.slug}` : profile.username}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyUrl();
                  }}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-[var(--accent)] transition-all"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              {/* Subsite Action Hint */}
              {selectedSubSiteId && (
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-2">
                  <button 
                    onClick={() => openModal(setIsProSettingsOpen)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-all"
                  >
                    Ajustes
                  </button>
                  <button 
                    onClick={() => setSelectedSubSiteId(null)}
                    className="flex-1 py-1.5 rounded-lg bg-black/40 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/40"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-8 custom-scrollbar">
          
          {/* Main Actions Section */}
          <div className="space-y-3">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pl-1 mb-2">Editor</div>
            
            <ColorPicker
              value={profile.accentColor}
              onChange={handleColorChange}
              subscriptionTier={profile.subscriptionTier}
            />

            <BlockSelector
              onAdd={addBlock}
              accentColor={profile.accentColor}
              currentBlockCount={profile.blocks.length}
              subscriptionTier={profile.subscriptionTier}
              username={profile.username}
              twitterShareUnlocked={profile.twitterShareUnlocked}
              extraBlocksFromShare={profile.extraBlocksFromShare}
              onShareUnlocked={onShareUnlocked}
            />
          </div>

          {/* Dynamic Builder Score Card */}
          <motion.div
            initial={false}
            onClick={() => openModal(setIsScoreInfoOpen)}
            className="group/score p-5 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] hover:border-[var(--accent)]/30 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/10 blur-[30px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Impacto Builder</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-[950] text-white tracking-tighter">{profile.builderScore || 0}</span>
                  <span className="text-xs font-bold text-[var(--accent)]">pts</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover/score:scale-110 transition-transform shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]">
                <Trophy size={18} />
              </div>
            </div>

            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((profile.builderScore || 0) / 1000) * 100, 100)}%` }}
                className="h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"
              />
            </div>

            <p className="text-[10px] text-white/40 leading-relaxed italic line-clamp-2">
              {(profile.builderScore || 0) < 100 ? "Validá tu perfil para aparecer en el ranking." : "¡Vas por buen camino! Agregá más proyectos."}
            </p>
          </motion.div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pl-1 mb-3">Comunidad</div>
            <SidebarLink href="/feed" icon={<Activity size={18} />} label="Feed Global" />
            <SidebarLink href="/explore" icon={<Compass size={18} />} label="Explorar Builders" />
            <SidebarLink href="/showcase" icon={<Sparkles size={18} />} label="Showcase" />
          </div>

          {/* Settings & Tools */}
          <div className="space-y-1 pb-4">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pl-1 mb-3">Plataforma</div>
            
            <button 
              onClick={() => profile.subscriptionTier === 'pro' ? openModal(setIsProSettingsOpen) : openModal(setIsUpgradeModalOpen)}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${profile.subscriptionTier === 'pro' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-white/5 text-white/40'}`}>
                  <Globe size={18} />
                </div>
                <span className={`text-sm font-bold ${profile.subscriptionTier === 'pro' ? 'text-white' : 'text-white/40'}`}>Dominio & Pro</span>
              </div>
              {profile.subscriptionTier !== 'pro' && <Lock size={12} className="text-white/20" />}
            </button>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${autoSaveEnabled ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                  <Save size={18} />
                </div>
                <span className="text-sm font-bold text-white/70">Auto-Guardado</span>
              </div>
              <button 
                onClick={toggleAutoSave}
                className={`w-10 h-5 rounded-full relative transition-all duration-300 ${autoSaveEnabled ? 'bg-[var(--accent)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${autoSaveEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            
            <button 
              onClick={() => openModal(setIsFeedbackOpen)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all text-white/40 hover:text-white"
            >
              <div className="p-2 rounded-lg bg-white/5">
                <MessageSquare size={18} />
              </div>
              <span className="text-sm font-bold">Feedback</span>
            </button>
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-6 mt-auto border-t border-white/[0.03] bg-black/20">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-all text-xs font-black uppercase tracking-widest border border-red-500/10"
          >
            <LogOut size={16} />
            Salir de la cuenta
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group"
    >
      <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/5 transition-all">
        {icon}
      </div>
      <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">{label}</span>
      <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-20 transition-all -translate-x-2 group-hover:translate-x-0" />
    </Link>
  );
}
