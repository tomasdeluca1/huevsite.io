"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Check, Globe,
  Save, LogOut, MessageSquare,
  Sparkles, Lock, ChevronRight, User, PlusCircle, Trash2, Link2, Mail, Share2
} from "lucide-react";
import Link from "next/link";
import { ProfileData, BlockType, PRESET_BORDER_RADIUS } from "@/lib/profile-types";
import { ColorPicker } from "./ColorPicker";
import { BlockSelector } from "./BlockSelector";
import { QuestPanel } from "./QuestPanel";
import LocaleToggle from "@/components/LocaleToggle";

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
  setIsLinktreeRefactorOpen: (open: boolean) => void;
  setTempProfileData: (data: any) => void;
  addBlock: (type: BlockType) => void;
  handleColorChange: (color: string, confirmed: boolean) => void;
  handleBorderRadiusChange: (value: string) => void;
  toggleAutoSave: () => void;
  autoSaveEnabled: boolean;
  toggleNewsletter: () => void;
  newsletterSubscribed: boolean;
  activeTab: 'board' | 'projects' | 'insights' | 'subsites' | 'domain' | 'transfer';
  setActiveTab: (tab: 'board' | 'projects' | 'insights' | 'subsites' | 'domain' | 'transfer') => void;
  onShareUnlocked: (extraBlocks: number) => void;
  onShareProfile: () => void;
  visibleBlockCount?: number;
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
  setIsLinktreeRefactorOpen,
  setTempProfileData,
  addBlock,
  handleColorChange,
  handleBorderRadiusChange,
  toggleAutoSave,
  autoSaveEnabled,
  toggleNewsletter,
  newsletterSubscribed,
  activeTab,
  setActiveTab,
  onShareUnlocked,
  onShareProfile,
  visibleBlockCount
}: SidebarProps) {
  const t = useTranslations("dashboard");

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const currentSubSite = profile.subSites.find(s => s.id === selectedSubSiteId);

  const openModal = (modalFn: (open: boolean) => void) => {
    setIsSidebarOpen(false);
    modalFn(true);
  };

  const currentBoardTitle = selectedSubSiteId ? currentSubSite?.title : t("sidebar.mainProfile");
  const currentBoardSlug = selectedSubSiteId ? `/${profile.username}/${currentSubSite?.slug}` : `/${profile.username}`;
  const currentBoardAvatar = selectedSubSiteId ? currentSubSite?.avatarUrl : profile.avatarUrl;
  const isPro = profile.hasProAccess === true;

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

        {/* Header: identity (logo + board switcher) */}
        <div className="px-6 pt-5 pb-2 relative z-30">
          <div className="flex items-center justify-between mb-5">
            <Link href="/" className="group flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform shadow-[0_0_15px_var(--accent)]/40">
                <Sparkles size={18} className="text-black" />
              </div>
              <span className="text-xl font-[900] tracking-tighter text-white">huev<span className="text-[var(--accent)]">site</span></span>
            </Link>
          </div>

          {/* Board Switcher Popover */}
          <div className="relative mb-1">
             <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2 mb-1.5 block">
               {isPro ? t("sidebar.activeBoard") : t("sidebar.yourProfile")}
             </span>
             <div
               className={`w-full group p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 transition-all flex items-center gap-3 text-left relative ${isPro ? "hover:border-white/20 hover:bg-white/[0.05]" : ""}`}
               onClick={isPro ? () => setIsSwitcherOpen(!isSwitcherOpen) : undefined}
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
                {isPro && (
                  <div className={`transition-transform duration-300 ${isSwitcherOpen ? 'rotate-180' : ''}`}>
                    <ChevronRight size={14} className="text-white/20 group-hover:text-white/40" />
                  </div>
                )}
             </div>

             <AnimatePresence>
               {isPro && isSwitcherOpen && (
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
                             <p className="text-[11px] font-black">{profile.displayName || t("sidebar.mainProfile")}</p>
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

                        {isPro && (
                          <button
                            onClick={() => { openModal(setIsCreateSubSiteOpen); setIsSwitcherOpen(false); }}
                            className="w-full mt-2 p-3 rounded-xl border border-dashed border-white/10 hover:border-[var(--accent)]/30 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--accent)]"
                          >
                            <PlusCircle size={14} /> {t("sidebar.createNewSubsite")}
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
        <div className="relative z-0 flex-1 overflow-y-auto px-6 space-y-5 pb-6 custom-scrollbar">

          {/* Primary action: share your profile */}
          <button
            onClick={() => { setIsSidebarOpen(false); onShareProfile(); }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/40 transition-all group text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-black shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_15px_var(--accent)]/40">
              <Share2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-white">{t("sidebar.shareCtaTitle")}</div>
              <div className="text-[10px] font-mono text-white/40 truncate">{t("sidebar.shareCtaSubtitle")}</div>
            </div>
            <ChevronRight size={14} className="text-white/30 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* === DESIGN: everything that edits the site === */}
          <div className="space-y-2.5">
            <SectionLabel>{t("sidebar.editorSectionLabel")}</SectionLabel>

            <ColorPicker
              value={profile.accentColor}
              onChange={handleColorChange}
              subscriptionTier={isPro ? "pro" : profile.subscriptionTier}
            />

            {/* Border Radius Selector — Pro only */}
            <div className={`p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] relative ${!isPro ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{t("sidebar.borderRadiusLabel")}</div>
                {!isPro && (
                  <button
                    onClick={() => openModal(setIsUpgradeModalOpen)}
                    className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30"
                  >
                    <Lock size={10} className="text-amber-500" />
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Pro</span>
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                {PRESET_BORDER_RADIUS.map(({ label, value }) => {
                  const isActive = (profile.borderRadius || '1.5rem') === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleBorderRadiusChange(value)}
                      title={label}
                      className={`flex-1 h-8 border transition-all ${
                        isActive
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      }`}
                      style={{ borderRadius: value }}
                    />
                  );
                })}
              </div>
            </div>

            <BlockSelector
              onAdd={addBlock}
              accentColor={profile.accentColor}
              currentBlockCount={visibleBlockCount ?? profile.blocks.length}
              subscriptionTier={isPro ? "pro" : profile.subscriptionTier}
              username={profile.username}
              twitterShareUnlocked={profile.twitterShareUnlocked}
              extraBlocksFromShare={profile.extraBlocksFromShare}
              onShareUnlocked={onShareUnlocked}
            />

            {/* Edit profile/sub-site — an editing action, grouped with the design tools */}
            <button
              onClick={() => openModal(setIsProfileModalOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-white/5 text-white/40 group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/5 transition-all">
                <User size={18} />
              </div>
              <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">{selectedSubSiteId ? t("sidebar.editSubsite") : t("sidebar.editProfile")}</span>
              <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-20 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
          </div>

          {/* === PROGRESS: score + quests + AI credits, clustered === */}
          <div className="space-y-2.5">
            {/* Builder Score Card */}
            <motion.div
              initial={false}
              onClick={() => openModal(setIsScoreInfoOpen)}
              className="group/score z-0 p-4 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] hover:border-[var(--accent)]/30 transition-all cursor-pointer relative overflow-hidden"
              style={{ borderRadius: `calc(${profile.borderRadius || '1.5rem'} + 0.5rem)` }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/10 blur-[30px] -translate-y-1/2 translate-x-1/2" />

              <div className="flex justify-between items-center mb-2.5 relative z-10">
                <div>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block mb-0.5">{t("sidebar.builderImpact")}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-[950] text-white tracking-tighter">{profile.builderScore || 0}</span>
                    <span className="text-xs font-bold text-[var(--accent)]">pts</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover/score:scale-110 transition-transform shadow-[0_0_15px_rgba(200,255,0,0.15)]">
                  <Trophy size={16} />
                </div>
              </div>

              <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((profile.builderScore || 0) / 1000) * 100, 100)}%` }}
                  className="h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"
                />
              </div>

              <p className="text-[10px] text-white/40 leading-relaxed italic line-clamp-1">
                {(profile.builderScore || 0) < 100 ? t("sidebar.scoreHintLow") : t("sidebar.scoreHintHigh")}
              </p>
            </motion.div>

            {/* Quests / Badge progress */}
            <QuestPanel
              profile={profile}
              visibleBlockCount={visibleBlockCount ?? profile.blocks.length}
              accentColor={profile.accentColor}
              borderRadius={profile.borderRadius}
              onAddBlock={addBlock}
              onEditProfile={() => openModal(setIsProfileModalOpen)}
              onShare={() => { setIsSidebarOpen(false); onShareProfile(); }}
              onUpgrade={() => openModal(setIsUpgradeModalOpen)}
            />

            {/* AI Credits — slim row */}
            <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between group">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 group-hover:bg-purple-500/20 transition-all">
                  <Sparkles size={13} />
                </div>
                <span className="text-xs font-bold text-white/60 truncate">{t("sidebar.aiCreditsAvailable", { n: profile.aiCredits ?? 0 })}</span>
              </div>
              {!isPro && (
                <button
                  onClick={() => openModal(setIsUpgradeModalOpen)}
                  className="shrink-0 text-[8px] font-black text-purple-400 uppercase tracking-widest bg-purple-400/10 px-2 py-1 rounded-md hover:bg-purple-400/20 transition-all border border-purple-400/20"
                >
                  + PRO
                </button>
              )}
            </div>
          </div>

          {/* === ACCOUNT / SETTINGS === */}
          <div className="space-y-1 pb-2">
            <SectionLabel className="mb-2">{t("sidebar.platformSection")}</SectionLabel>

            <SidebarLink href="/testimonio" icon={<MessageSquare size={18} />} label={t("sidebar.navTestimonial")} />

            <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${autoSaveEnabled ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                  <Save size={18} />
                </div>
                <span className="text-sm font-bold text-white/70">{t("sidebar.autoSave")}</span>
              </div>
              <button
                onClick={toggleAutoSave}
                className={`w-10 h-5 rounded-full relative transition-all duration-300 ${autoSaveEnabled ? 'bg-[var(--accent)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${autoSaveEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${newsletterSubscribed ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-white/5 text-white/40'}`}>
                  <Mail size={18} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-white/70">{t("sidebar.newsletterTitle")}</div>
                  <div className="text-[10px] font-mono text-white/25">
                    {newsletterSubscribed ? t("sidebar.newsletterSubscribed") : t("sidebar.newsletterPitch")}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleNewsletter}
                className={`w-10 h-5 rounded-full relative transition-all duration-300 shrink-0 ${newsletterSubscribed ? 'bg-[var(--accent)]' : 'bg-white/10'}`}
                aria-label={newsletterSubscribed ? t("sidebar.newsletterUnsubscribeAria") : t("sidebar.newsletterSubscribeAria")}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${newsletterSubscribed ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <button
              onClick={() => openModal(setIsFeedbackOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition-all text-white/40 hover:text-white"
            >
              <div className="p-1.5 rounded-lg bg-white/5">
                <MessageSquare size={18} />
              </div>
              <span className="text-sm font-bold">{t("sidebar.feedback")}</span>
            </button>

            <button
              onClick={() => openModal(setIsLinktreeRefactorOpen)}
              className="w-full flex items-center gap-3 rounded-2xl p-2.5 text-white/40 transition-all hover:bg-white/5 hover:text-white"
            >
              <div className="rounded-lg bg-white/5 p-1.5">
                <Link2 size={18} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-bold">{t("sidebar.linktreeRefactorTitle")}</div>
                <div className="text-[10px] font-mono text-white/25">
                  {t("sidebar.linktreeRefactorSubtitle")}
                </div>
              </div>
            </button>

            <button
              onClick={() => openModal(setIsDeleteAccountOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-red-300/75 transition-all hover:bg-red-500/8 hover:text-red-200"
            >
              <div className="rounded-lg bg-red-500/10 p-1.5 text-red-400">
                <Trash2 size={18} />
              </div>
              <span className="text-sm font-bold">{t("sidebar.deleteAccount")}</span>
            </button>
          </div>
        </div>

        {/* Footer: language preference + logout */}
        <div className="p-5 pt-3 mt-auto border-t border-white/[0.03] bg-black/20 flex items-center gap-2">
          <LocaleToggle />
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-all text-xs font-black uppercase tracking-widest border border-red-500/10"
          >
            <LogOut size={16} />
            {t("sidebar.logout")}
          </button>
        </div>
      </aside>
    </>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pl-1 ${className}`}>
      {children}
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition-all group"
    >
      <div className="p-1.5 rounded-lg bg-white/5 text-white/40 group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/5 transition-all">
        {icon}
      </div>
      <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">{label}</span>
      <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-20 transition-all -translate-x-2 group-hover:translate-x-0" />
    </Link>
  );
}
