"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Settings, ArrowLeft, Copy, Check, Globe, Activity, 
  Compass, Save, LogOut, MessageSquare, Layout as LayoutIcon, 
  Sparkles, ArrowUpRight, Lock, ChevronRight, User, PlusCircle, Trash2
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
  setIsCreateSubSiteOpen: (open: boolean) => void;
  setIsUpgradeModalOpen: (open: boolean) => void;
  setIsFeedbackOpen: (open: boolean) => void;
  setIsDeleteAccountOpen: (open: boolean) => void;
  setTempProfileData: (data: any) => void;
  addBlock: (type: BlockType) => void;
  handleColorChange: (color: string, confirmed: boolean) => void;
  toggleAutoSave: () => void;
  autoSaveEnabled: boolean;
  activeTab: 'board' | 'insights' | 'subsites' | 'domain' | 'transfer';
  setActiveTab: (tab: 'board' | 'insights' | 'subsites' | 'domain' | 'transfer') => void;
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
  setIsCreateSubSiteOpen,
  setIsUpgradeModalOpen,
  setIsFeedbackOpen,
  setIsDeleteAccountOpen,
  setTempProfileData,
  addBlock,
  handleColorChange,
  toggleAutoSave,
  autoSaveEnabled,
  activeTab,
  setActiveTab,
  onShareUnlocked
}: SidebarProps) {
  
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const currentSubSite = profile.subSites.find(s => s.id === selectedSubSiteId);

  const openModal = (modalFn: (open: boolean) => void) => {
    setIsSidebarOpen(false);
    modalFn(true);
  };

  const tabs = [
    { id: 'board', label: 'Editor', icon: LayoutIcon },
    { id: 'insights', label: 'Estadísticas', icon: Activity },
    { id: 'subsites', label: 'Sub-sites', icon: Compass },
    { id: 'domain', label: 'Dominio', icon: Globe },
    { id: 'transfer', label: 'Transferir', icon: ArrowUpRight },
  ];

  const currentBoardTitle = selectedSubSiteId ? currentSubSite?.title : "Perfil Principal";
  const currentBoardSlug = selectedSubSiteId ? `/${profile.username}/${currentSubSite?.slug}` : `/${profile.username}`;
  const currentBoardAvatar = selectedSubSiteId ? currentSubSite?.avatarUrl : profile.avatarUrl;

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 w-[300px] shrink-0 border-r border-white/5 bg-[#09090b]/95
        backdrop-blur-xl z-[210] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:sticky md:top-0 md:h-full md:translate-x-0 flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-visible
        scrollbar-none
      `}>
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[var(--accent)]/5 to-transparent pointer-events-none" />
        
        <div className="p-6 pb-2 relative z-30">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="group flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform shadow-[0_0_15px_var(--accent)]/40">
                <Sparkles size={18} className="text-black" />
              </div>
              <span className="text-xl font-[900] tracking-tighter text-white">huev<span className="text-[var(--accent)]">site</span></span>
            </Link>
          </div>

          {/* Board Switcher Popover */}
          <div className="relative mb-6">
             <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2 mb-2 block">Board Activo</span>
             <button
               onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
               className="w-full group p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all flex items-center gap-3 text-left relative"
             >
                <div className="shrink-0 relative">
                   {currentBoardAvatar ? (
                     <img src={currentBoardAvatar} alt="" className="w-9 h-9 rounded-xl object-cover shadow-lg" />
                   ) : (
                     <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-[var(--accent)]">
                       {currentBoardTitle?.charAt(0)}
                     </div>
                   )}
                   <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-[#09090b] flex items-center justify-center shadow-lg">
                     {selectedSubSiteId ? <Globe size={8} className="text-white" /> : <User size={8} className="text-white" />}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-white truncate">{currentBoardTitle}</h4>
                  <p className="text-[10px] font-mono opacity-30 truncate">{currentBoardSlug}</p>
                </div>
                <div className={`transition-transform duration-300 ${isSwitcherOpen ? 'rotate-180' : ''}`}>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white/40" />
                </div>
             </button>

             <AnimatePresence>
               {isSwitcherOpen && (
                 <>
                   <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSwitcherOpen(false)} />
                   <motion.div
                     initial={{ opacity: 0, scale: 0.95, y: -10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: -10 }}
                     className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#121214] border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[260] overflow-hidden backdrop-blur-xl"
                   >
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        <button 
                          onClick={() => { setSelectedSubSiteId(null); setIsSwitcherOpen(false); }}
                          className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all ${!selectedSubSiteId ? 'bg-[var(--accent)]/10 text-white' : 'hover:bg-white/5 text-white/40'}`}
                        >
                           <div className="shrink-0">
                             {profile.avatarUrl ? (
                               <img src={profile.avatarUrl} alt={profile.displayName} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                             ) : (
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${!selectedSubSiteId ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-white/5 text-white/40'}`}>
                                 {profile.displayName?.charAt(0).toUpperCase() || '?'}
                               </div>
                             )}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[11px] font-black">{profile.displayName || 'Perfil Principal'}</p>
                             <p className="text-[9px] font-mono opacity-40">/{profile.username}</p>
                           </div>
                           {!selectedSubSiteId && <Check size={12} className="text-[var(--accent)]" />}
                        </button>

                        {profile.subSites.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/5">
                             {profile.subSites.map(site => (
                               <button
                                 key={site.id}
                                 onClick={() => { setSelectedSubSiteId(site.id); setIsSwitcherOpen(false); }}
                                 className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all ${selectedSubSiteId === site.id ? 'bg-[var(--accent)]/10 text-white' : 'hover:bg-white/5 text-white/40'}`}
                               >
                                  <div className="shrink-0">
                                     {site.avatarUrl ? <img src={site.avatarUrl} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Globe size={14} /></div>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <p className="text-[11px] font-black">{site.title}</p>
                                     <p className="text-[9px] font-mono opacity-40">/{site.slug}</p>
                                  </div>
                                  {selectedSubSiteId === site.id && <Check size={12} className="text-[var(--accent)]" />}
                               </button>
                             ))}
                          </div>
                        )}

                        {profile.subscriptionTier === 'pro' && (
                          <button 
                            onClick={() => { openModal(setIsCreateSubSiteOpen); setIsSwitcherOpen(false); }}
                            className="w-full mt-2 p-3 rounded-xl border border-dashed border-white/10 hover:border-[var(--accent)]/30 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--accent)]"
                          >
                            <PlusCircle size={14} /> Crear Nuevo Sub-site
                          </button>
                        )}
                      </div>
                   </motion.div>
                 </>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="relative z-0 flex-1 overflow-y-auto px-6 space-y-8 pb-8 custom-scrollbar">
          
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
            className="group/score z-0 p-5 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] hover:border-[var(--accent)]/30 transition-all cursor-pointer relative overflow-hidden"
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
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover/score:scale-110 transition-transform shadow-[0_0_15px_rgba(200,255,0,0.15)]">
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
          
          {/* AI Credits Card */}
          <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all">
                <Sparkles size={14} />
              </div>
              <div>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block">Créditos IA</span>
                <span className="text-xs font-bold text-white/60">{profile.aiCredits ?? 0} disponibles</span>
              </div>
            </div>
            {profile.subscriptionTier !== 'pro' && (
               <button 
                  onClick={() => openModal(setIsUpgradeModalOpen)}
                  className="text-[8px] font-black text-purple-400 uppercase tracking-widest bg-purple-400/10 px-2 py-1 rounded-md hover:bg-purple-400/20 transition-all border border-purple-400/20"
               >
                 + PRO
               </button>
            )}
          </div>

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
              onClick={() => openModal(setIsProfileModalOpen)}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 text-white/40">
                  <User size={18} />
                </div>
                <span className="text-sm font-bold text-white/70">Editar {selectedSubSiteId ? 'Sub-site' : 'Perfil'}</span>
              </div>
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

            <button
              onClick={() => openModal(setIsDeleteAccountOpen)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-red-300/75 transition-all hover:bg-red-500/8 hover:text-red-200"
            >
              <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
                <Trash2 size={18} />
              </div>
              <span className="text-sm font-bold">Eliminar cuenta</span>
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
