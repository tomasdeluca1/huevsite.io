"use client";

import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import {
  Save, Eye, EyeOff, Layout as LayoutIcon, Settings, LogOut, Plus, Sparkles, MessageSquare,
  Activity, Compass, Trash2, Copy, Check, Trophy, ArrowUpRight, BadgeCheck, ArrowLeft, Lock, Globe, ChevronRight,
  Globe2, AlertCircle, SendHorizontal, ChevronDown, X, Rocket
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import { MOCK_PROFILE } from "@/lib/mock-profile";
import { BlockData, BlockType, ProfileData, PRESET_COLORS, getContrastColor, isDarkColor, MAX_FREE_BLOCKS } from "@/lib/profile-types";
import CountrySelect from "@/components/CountrySelect";
import { HeroBlock } from "@/components/blocks/HeroBlock";
import { BuildingBlock } from "@/components/blocks/BuildingBlock";
import { GitHubBlock } from "@/components/blocks/GitHubBlock";
import { ProjectBlock } from "@/components/blocks/ProjectBlock";
import { MetricBlock, SocialBlock, CVBlock } from "@/components/blocks/Widgets";
import { StackBlock, CommunityBlock, WritingBlock } from "@/components/blocks/ExtraBlocks";
import { MediaBlock, CertificationBlock, AchievementBlock, CustomBlock, CollabBlock, EcosystemBlock } from "@/components/blocks/NewBlocks";
import { SortableBlock } from "@/components/dashboard/SortableBlock";
import { BlockSelector } from "@/components/dashboard/BlockSelector";
import { BlockEditorModal } from "@/components/dashboard/BlockEditorModal";
import { ProjectTracker } from "@/components/dashboard/ProjectTracker";
import { ColorPicker } from "@/components/dashboard/ColorPicker";
import { FeedbackModal } from "@/components/dashboard/FeedbackModal";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ScoreInfoModal } from "@/components/social/ScoreInfoModal";
import { BadgeSnippetCard } from "@/components/dashboard/BadgeSnippetCard";
import { TestimonialNudgeToast } from "@/components/dashboard/TestimonialNudgeToast";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { ShareProfileModal } from "@/components/share/ShareProfileModal";
import { JingleVoteModal } from "@/components/jingle/JingleVoteModal";
import type { JingleChoice } from "@/lib/jingles";
import { InsightsTab } from "@/components/dashboard/InsightsTab";
import { CreateSubSiteModal } from "@/components/dashboard/CreateSubSiteModal";
import { ProfileEditModal } from "@/components/dashboard/ProfileEditModal";
import { DomainConnectionCard } from "@/components/dashboard/DomainConnectionCard";
import { TwitterWarning } from "@/components/dashboard/TwitterWarning";
import { ReferralDashboard } from "@/components/dashboard/ReferralDashboard";
import { GitHubData, OnboardingCompletionData, Role, LayoutOption } from "@/lib/onboarding-types";
import { DeleteAccountModal } from "@/components/dashboard/DeleteAccountModal";
import { LinktreeRefactorModal } from "@/components/dashboard/LinktreeRefactorModal";
import { getFreeTrialState, hasProAccess } from "@/lib/pro-access";
import { getProfileBadges, ALL_BADGE_KEYS, BADGE_CATALOG } from "@/lib/profile-badges";
import { BadgeItem } from "@/components/profile/BadgeItem";
import { ProFeatureTour } from "@/components/dashboard/ProFeatureTour";
import { TrialExpiredBlockChooser } from "@/components/dashboard/TrialExpiredBlockChooser";

const DASHBOARD_TABS = ["board", "projects", "insights", "subsites", "domain", "transfer"] as const;
const PRO_ONLY_TABS = ["insights", "subsites", "domain", "transfer"] as const;

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingBlock, setEditingBlock] = useState<BlockData | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isScoreInfoOpen, setIsScoreInfoOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCreateSubSiteOpen, setIsCreateSubSiteOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isLinktreeRefactorOpen, setIsLinktreeRefactorOpen] = useState(false);
  const [isShareProfileOpen, setIsShareProfileOpen] = useState(false);
  const [shareCelebrate, setShareCelebrate] = useState(false);
  const [showJingle, setShowJingle] = useState(false);
  const [jingleVote, setJingleVote] = useState<JingleChoice | null>(null);
  const [isClaimingTrial, setIsClaimingTrial] = useState(false);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  const [blockChooserResolved, setBlockChooserResolved] = useState(false);
  const [isProTourOpen, setIsProTourOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isRefactoringFromLinktree, setIsRefactoringFromLinktree] = useState(false);
  const [tempProfileData, setTempProfileData] = useState({
    username: '',
    display_name: '',
    email: '',
    tagline: '',
    avatarUrl: '',
    githubHandle: '',
    country: ''
  });
  const [copied, setCopied] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [selectedSubSiteId, setSelectedSubSiteId] = useState<string | null>(null);
  // Board preset que se está editando en el dashboard (0-2). Arranca en el publicado.
  const [selectedBoardIndex, setSelectedBoardIndex] = useState<number>(0);
  const [isPublishingBoard, setIsPublishingBoard] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("huevsite_autosave") === "true" : false));
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedVersionRef = useRef<string>("");
  // Solo en la primera carga alineamos el board editado con el publicado; en
  // refetches posteriores respetamos el board que el usuario está editando.
  const boardInitRef = useRef(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [badgesCollapsed, setBadgesCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<'board' | 'projects' | 'insights' | 'subsites' | 'domain' | 'transfer'>('board');
  const [domain, setDomain] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; message: string; needsTxtVerification?: boolean; txtRecord?: { host: string; value: string } } | null>(null);
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const supabase = createClient();
  const referralsSectionRef = useRef<HTMLDivElement | null>(null);
  const isPro = profile?.hasProAccess === true;
  const availableTabs = isPro
    ? DASHBOARD_TABS
    : profile?.freeTrial?.canUseLastInsightsView
      ? (["board", "insights"] as const)
      : (["board"] as const);

  const normalizeDomainInput = (value: string) =>
    value.trim().replace(/^(?:https?:\/\/)?/i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();

  const getDomainGuide = (value: string) => {
    const normalized = normalizeDomainInput(value);
    const labels = normalized.split(".").filter(Boolean);

    if (!normalized || labels.length < 2) {
      return {
        normalized,
        isSubdomain: false,
        host: "@",
        targetType: "A Record",
        targetValue: "216.150.1.1",
        recommendation: t("page.domainGuideEmptyRecommendation"),
        steps: [
          t("page.domainGuideEmptyStep1"),
          t("page.domainGuideEmptyStep2"),
          t("page.domainGuideEmptyStep3"),
        ],
      };
    }

    const isSubdomain = labels.length > 2;
    const host = isSubdomain ? labels.slice(0, -2).join(".") : "@";

    return {
      normalized,
      isSubdomain,
      host,
      targetType: isSubdomain ? "CNAME" : "A Record",
      targetValue: isSubdomain ? "cname.vercel-dns.com" : "216.150.1.1",
      recommendation: isSubdomain
        ? t("page.domainGuideSubdomainRecommendation")
        : t("page.domainGuideRootRecommendation"),
      steps: isSubdomain
        ? [
            t("page.domainGuideSaveDomain"),
            t("page.domainGuideCreateCname", { host }),
            t("page.domainGuideRunCheck"),
          ]
        : [
            t("page.domainGuideSaveDomain"),
            t("page.domainGuideCreateARecord"),
            t("page.domainGuideRunCheck"),
          ],
    };
  };

  const domainGuide = getDomainGuide(domain);

  const normalizeSubSites = (subSites: any[] = []) =>
    subSites.map((site: any) => ({
      ...site,
      avatarUrl: site.avatarUrl || site.avatar_url || "",
      sourceUrl: site.sourceUrl || site.source_url || "",
    }));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleCopyUrl = async () => {
    if (!profile) return;
    const url = `${window.location.origin}/${profile.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleDeleteAccount = async (confirmation: string) => {
    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || t("page.errorDeleteAccount"));
      }

      localStorage.removeItem("huevsite_autosave");
      localStorage.removeItem("huevsite_onboarding_seen");
      localStorage.removeItem("huevsite_explore_last_activity");
      localStorage.removeItem("huevsite_explore_sort");
      localStorage.removeItem("huevsite_explore_category");
      localStorage.removeItem("huevsite_explore_search");
      sessionStorage.removeItem("huevsite_explore_list");
      sessionStorage.removeItem("huevsite_from_explore");

      await supabase.auth.signOut();
      window.location.href = "/?accountDeleted=1";
    } catch (error: any) {
      console.error("Error deleting account:", error);
      alert(error.message || t("page.errorDeleteAccount"));
      setIsDeletingAccount(false);
    }
  };

  const handleLinktreeRefactor = async (url: string) => {
    setIsRefactoringFromLinktree(true);

    try {
      const response = await fetch("/api/profile/refactor-linktree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || t("page.errorRefactorBoard"));
      }

      await fetchProfile();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              aiCredits: data.aiCredits ?? prev.aiCredits,
              builderScore: data.builderScore ?? prev.builderScore,
            }
          : prev
      );
      setIsLinktreeRefactorOpen(false);
    } catch (error: any) {
      alert(error.message || t("page.errorRefactorBoard"));
    } finally {
      setIsRefactoringFromLinktree(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');

      if (!response.ok) {
        if (response.status === 404) {
          window.location.href = '/onboarding';
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();

      const transformedProfile: ProfileData = {
        id: data.profile.id,
        username: data.profile.username,
        displayName: data.profile.name || data.profile.username,
        email: data.profile.email || "",
        accentColor: data.profile.accent_color,
        borderRadius: data.profile.border_radius || "1.5rem",
        roles: data.profile.roles || [],
        layout: data.profile.layout || null,
        subscriptionTier: (data.profile.subscription_tier === 'pro' || !!data.profile.pro_since) ? 'pro' : 'free',
        hasProAccess: hasProAccess(data.profile),
        extraBlocksFromShare: data.profile.extra_blocks_from_share || 0,
        twitterShareUnlocked: data.profile.twitter_share_unlocked || false,
        hasSeenUpdateFeb25: data.profile.has_seen_update_feb25 || false,
        tagline: data.profile.tagline || "",
        avatarUrl: data.profile.image || "",
        githubHandle: data.profile.github_handle || "",
        country: data.profile.country || "",
        builderScore: data.profile.builder_score || 0,
        aiCredits: data.profile.ai_credits || 0,
        isOnboardingTestUser: data.profile.is_onboarding_test_user || false,
        newsletterSubscribed: data.profile.newsletter_subscribed === true,
        customDomain: data.profile.custom_domain || "",
        referralCode: data.profile.referral_code || "",
        referredBy: data.profile.referred_by || "",
        proReferralsCount: data.profile.pro_referrals_count || 0,
        referralRewardExpiresAt: data.profile.referral_reward_expires_at || null,
        isProfileVerified: data.profile.is_profile_verified || false,
        hasGoodReputation: data.profile.has_good_reputation || false,
        isTopMatchmaker: data.profile.is_top_matchmaker || false,
        freeTrialClaimedAt: data.profile.free_trial_claimed_at || null,
        freeTrialStartedAt: data.profile.free_trial_started_at || null,
        freeTrialEndsAt: data.profile.free_trial_ends_at || null,
        freeTrialLastInsightsViewedAt: data.profile.free_trial_last_insights_viewed_at || null,
        freeTrial: getFreeTrialState(data.profile),
        subSites: normalizeSubSites(data.subSites || []),
        publishedBoard: data.profile.published_board ?? 0,
        boardNames: data.profile.board_names ?? {},
        blocks: data.blocks.map((block: any) => {
          const { id: _, type: __, order: ___, col_span: ____, row_span: _____, visible: ______, ...cleanData } = block.data || {};
          return {
            id: block.id,
            type: block.type as BlockType,
            order: block.order,
            col_span: block.col_span,
            row_span: block.row_span,
            visible: block.visible,
            board_index: block.board_index ?? 0,
            ...cleanData
          };
        }),
        badges: getProfileBadges(data.profile, {
          blockCount: (data.blocks || []).length,
          hasWonBuilderOfTheWeek: !!data.hasWonBuilderOfTheWeek,
          blocks: (data.blocks || []).map((b: any) => ({ type: b.type, data: b.data, links: b.data?.links })),
        }),
      };

      setProfile(transformedProfile);
      if (!boardInitRef.current) {
        boardInitRef.current = true;
        setSelectedBoardIndex(transformedProfile.publishedBoard ?? 0);
      }
      setTempProfileData({
        username: transformedProfile.username,
        display_name: transformedProfile.displayName,
        email: transformedProfile.email || '',
        tagline: transformedProfile.tagline || '',
        avatarUrl: transformedProfile.avatarUrl || '',
        githubHandle: transformedProfile.githubHandle || '',
        country: transformedProfile.country || ''
      });
      setDomain(transformedProfile.customDomain || "");

      const { builderScore, ...content } = transformedProfile;
      lastSavedVersionRef.current = JSON.stringify(content);
      if (transformedProfile.blocks.length === 0 || transformedProfile.isOnboardingTestUser) {
        const hasSeen = localStorage.getItem("huevsite_onboarding_seen");
        if (!hasSeen || transformedProfile.isOnboardingTestUser) {
          setIsOnboardingOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleClaimFreeTrial = async () => {
    setIsClaimingTrial(true);
    try {
      const response = await fetch("/api/trial/claim", { method: "POST" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || t("page.errorActivateTrial"));
      }

      await fetchProfile();
      setIsUpgradeModalOpen(false);
      setIsProTourOpen(true);
    } catch (error: any) {
      alert(error.message || t("page.errorActivateTrial"));
    } finally {
      setIsClaimingTrial(false);
    }
  };

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "board") {
      setActiveTab("board");
      return;
    }

    if (tab === "insights" && (isPro || profile?.freeTrial?.canUseLastInsightsView)) {
      setActiveTab("insights");
      return;
    }

    if (tab && PRO_ONLY_TABS.includes(tab as typeof PRO_ONLY_TABS[number]) && isPro) {
      setActiveTab(tab as typeof PRO_ONLY_TABS[number]);
    }
  }, [isPro, profile?.freeTrial?.canUseLastInsightsView]);

  useEffect(() => {
    if (!isPro && !profile?.freeTrial?.canUseLastInsightsView && activeTab !== "board") {
      setActiveTab("board");
    }
    if (!isPro && profile?.freeTrial?.canUseLastInsightsView && !["board", "insights"].includes(activeTab)) {
      setActiveTab("board");
    }
  }, [activeTab, isPro, profile?.freeTrial?.canUseLastInsightsView]);

  useEffect(() => {
    if (!profile) return;
    if (activeTab !== "board") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("scrollTo") !== "referrals") return;

    const timer = window.setTimeout(() => {
      referralsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [profile, activeTab]);

  // Fetch blocks when switching sub-sites
  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true);
      try {
        const url = selectedSubSiteId
          ? `/api/sub-sites/${selectedSubSiteId}/blocks`
          : '/api/profile';

        const response = await fetch(url);
        const data = await response.json();

        const blocks = (data.blocks || []).map((block: any) => {
          const { id, type, order, col_span, row_span, visible, ...cleanData } = block.data || {};
          return {
            id: block.id,
            type: block.type as BlockType,
            order: block.order,
            col_span: block.col_span,
            row_span: block.row_span,
            visible: block.visible,
            ...cleanData
          };
        });

        setProfile(prev => prev ? { ...prev, blocks } : null);

        // Refresh GitHub block stats in the background (skips if fresh < 12h).
        // Keeps real stars/repos/followers/heatmap/commits up to date without
        // blocking the editor or the public profile pages.
        if (blocks.some((b: any) => b.type === 'github')) {
          fetch('/api/github/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
            .then(r => (r.ok ? r.json() : null))
            .then(res => {
              if (!res?.updated?.length) return;
              setProfile(prev => prev ? {
                ...prev,
                blocks: prev.blocks.map(b => {
                  const u = res.updated.find((x: any) => x.id === b.id);
                  return u ? { ...b, stats: u.stats } : b;
                }),
              } : prev);
            })
            .catch(() => { /* non-blocking: keep existing stats on failure */ });
        }
      } catch (e) {
        console.error('Error fetching site blocks:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, [selectedSubSiteId]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProfile((prev) => {
        if (!prev) return prev;
        const oldIndex = prev.blocks.findIndex((b) => b.id === active.id);
        const newIndex = prev.blocks.findIndex((b) => b.id === over.id);
        return {
          ...prev,
          blocks: arrayMove(prev.blocks, oldIndex, newIndex),
        };
      });
    }
  };

  // Publica un board (lo hace el público). Pro-only en el server.
  const publishBoard = async (index: number) => {
    if (!profile || index === (profile.publishedBoard ?? 0)) return;
    const prevPublished = profile.publishedBoard ?? 0;
    setIsPublishingBoard(true);
    setProfile((p) => p ? { ...p, publishedBoard: index } : p);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published_board: index }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setProfile((p) => p ? { ...p, publishedBoard: prevPublished } : p);
        alert(d.error || t("page.errorPublishBoard"));
      }
    } catch {
      setProfile((p) => p ? { ...p, publishedBoard: prevPublished } : p);
    } finally {
      setIsPublishingBoard(false);
    }
  };

  const removeBlock = async (id: string) => {
    if (!id.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/blocks/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          alert(t("page.errorDeleteBlock", { error: errorData.error || t("page.errorUnknown") }));
          return;
        }
      } catch (error) {
        console.error('Error deleting block:', error);
        alert(t("page.errorNetworkDeleteBlock"));
        return;
      }
    }

    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.filter(b => b.id !== id)
      };
    });
  };

  const BLOCK_TYPE_LABELS: Record<string, string> = {
    hero: t("page.blockTypeHero"), building: t("page.blockTypeBuilding"), github: t("page.blockTypeGithub"), project: t("page.blockTypeProject"),
    stack: t("page.blockTypeStack"), metric: t("page.blockTypeMetric"), social: t("page.blockTypeSocial"), community: t("page.blockTypeCommunity"),
    writing: t("page.blockTypeWriting"), cv: t("page.blockTypeCv"), media: t("page.blockTypeMedia"), certification: t("page.blockTypeCertification"),
    achievement: t("page.blockTypeAchievement"), custom: t("page.blockTypeCustom"), collab: t("page.blockTypeCollab"), ecosystem: t("page.blockTypeEcosystem"),
  };

  const hideBlock = async (id: string) => {
    setProfile(prev => {
      if (!prev) return prev;
      return { ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, visible: false } : b) };
    });
    if (!id.startsWith("temp-")) {
      try {
        await fetch(`/api/blocks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visible: false }),
        });
      } catch (e) { console.error("Error hiding block:", e); }
    }
  };

  const restoreBlock = async (id: string) => {
    setProfile(prev => {
      if (!prev) return prev;
      return { ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, visible: true } : b) };
    });
    if (!id.startsWith("temp-")) {
      try {
        await fetch(`/api/blocks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visible: true }),
        });
      } catch (e) { console.error("Error restoring block:", e); }
    }
  };

  // Solo los bloques del board que se está editando (perfil principal).
  const boardBlocks = (profile?.blocks || []).filter(b => (b.board_index ?? 0) === selectedBoardIndex);
  const visibleBlocks = boardBlocks.filter(b => b.visible !== false);
  const hiddenBlocks = boardBlocks.filter(b => b.visible === false);

  // One-time celebration: when a brand-new profile becomes "shareable" (complete
  // enough), open the share modal with confetti exactly once. Persisted in
  // localStorage so it never nags again. No DB writes involved.
  useEffect(() => {
    if (loading || !profile?.username) return;
    if (typeof window === "undefined") return;
    const isShareable = Boolean(
      profile.displayName && profile.avatarUrl && profile.tagline && visibleBlocks.length >= 3
    );
    if (!isShareable) return;
    const key = `huevsite_share_celebrated_${profile.username}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShareCelebrate(true);
    setIsShareProfileOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile?.username, profile?.displayName, profile?.avatarUrl, profile?.tagline, visibleBlocks.length]);

  // Jingle vote: once the user is loaded, fetch their vote. Show the modal once
  // if they haven't voted and haven't snoozed it this session.
  useEffect(() => {
    if (loading || !profile?.username) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/jingle-vote");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const vote = (data?.myVote ?? null) as JingleChoice | null;
        setJingleVote(vote);
        const snoozed = typeof window !== "undefined" && sessionStorage.getItem("huevsite_jingle_snoozed");
        if (!vote && !snoozed) setShowJingle(true);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile?.username]);

  const handleBlockChooserConfirm = async (keepBlockIds: string[]) => {
    if (!profile) return;
    const hideIds = profile.blocks.filter(b => !keepBlockIds.includes(b.id)).map(b => b.id);
    try {
      await Promise.all(
        hideIds.map(id =>
          fetch(`/api/blocks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visible: false }),
          })
        )
      );
      setProfile(prev => prev ? {
        ...prev,
        blocks: prev.blocks.map(b => hideIds.includes(b.id) ? { ...b, visible: false } : b),
      } : prev);
    } catch (err) {
      console.error("Error hiding blocks:", err);
    }
    setBlockChooserResolved(true);
  };

  const addBlock = async (type: BlockType, prefill?: Record<string, any>) => {
    const newId = `temp-${type}-${Date.now()}`;
    const colSpan = type === "hero" || type === "ecosystem" ? 2 : (type === "github" || type === "project" ? 1 : 1);
    const rowSpan = type === "hero" || type === "ecosystem" ? 2 : (type === "github" || type === "project" ? 2 : 1);

    let initialData: any = {
      id: newId,
      type: type,
      order: profile?.blocks.length || 0,
      col_span: colSpan,
      row_span: rowSpan,
      visible: true,
      board_index: selectedBoardIndex,
    };

    switch (type) {
      case "hero":
        initialData = {
          ...initialData,
          name: profile?.displayName || "Tu nombre",
          avatarUrl: "",
          tagline: profile?.tagline || "builder",
          description: "Contanos qué estás haciendo...",
          status: "disponible para proyectos",
          location: "Buenos Aires 🇦🇷",
        };
        break;
      case "building":
        initialData = {
          ...initialData,
          project: "Mi proyecto nuevo",
          description: "Descripción del proyecto",
          stack: ["React", "TypeScript", "Tailwind"],
          link: "",
        };
        break;
      case "github":
        initialData = {
          ...initialData,
          username: profile?.githubHandle || "usuario",
          stats: { stars: 0, repos: 0, followers: 0 },
        };
        break;
      case "project":
        initialData = {
          ...initialData,
          title: "Nombre del proyecto",
          description: "Descripción breve",
          imageUrl: "",
          link: "",
          metrics: "",
          stack: [],
          status: "idea",
          launchDate: "",
          archived: false,
        };
        break;
      case "stack":
        initialData = {
          ...initialData,
          items: ["TypeScript", "React", "Node.js", "PostgreSQL"],
        };
        break;
      case "metric":
        initialData = {
          ...initialData,
          label: "MÉTRICA",
          value: "1.2k",
        };
        break;
      case "social":
        initialData = {
          ...initialData,
          links: [
            { platform: "twitter", handle: "", url: "", label: "" },
            { platform: "github", handle: "", url: "", label: "" }
          ]
        };
        break;
      case "community":
        initialData = {
          ...initialData,
          communities: [
            { name: "Ethereum Argentina", color: profile?.accentColor || "#5b6df7" }
          ],
        };
        break;
      case "writing":
        initialData = {
          ...initialData,
          posts: [
            { title: "Mi primer post", link: "", date: "2026-01-01" },
          ],
        };
        break;
      case "cv":
        initialData = {
          ...initialData,
          title: "Descargar CV",
          description: "Mi resumé actualizado",
          fileUrl: "",
        };
        break;
      case "media":
        initialData = {
          ...initialData,
          url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
          title: "Mi diseño / video",
          description: "Un vistazo a mi trabajo más reciente.",
          link: "",
        };
        break;
      case "certification":
        initialData = {
          ...initialData,
          name: "AWS Certified Solutions Architect",
          issuer: "Amazon Web Services",
          date: "2026",
          link: "",
          icon: "",
        };
        break;
      case "achievement":
        initialData = {
          ...initialData,
          title: "1k Followers en X",
          description: "Llegué a un milestone importante para mi proyecto.",
          date: "Octubre 2026",
        };
        break;
      case "custom":
        initialData = {
          ...initialData,
          label: "MI EXPERIENCIA",
          title: "Trabajos Anteriores",
          description: "No solo buildeo, también estuve en empresas piolas.",
          link: "",
        };
        break;
      case "collab":
        initialData = {
          ...initialData,
          users: [{ username: "ejemplo", role: "Co-founder" }]
        };
        break;
      case "ecosystem":
        initialData = {
          ...initialData,
          title: "Mis productos :)",
          hideHeaderEcosystem: true,
        };
        break;
    }

    // Optional prefill (e.g. "add project from URL") — only non-empty values
    // override the defaults so a missing OG field keeps its placeholder.
    if (prefill) {
      const clean = Object.fromEntries(
        Object.entries(prefill).filter(([, v]) => v !== "" && v != null)
      );
      initialData = { ...initialData, ...clean };
    }

    setProfile((prev) => prev ? { ...prev, blocks: [...prev.blocks, initialData as BlockData] } : prev);

    try {
      const { id, type: blockType, order, col_span, row_span, visible, board_index, ...blockSpecificData } = initialData;
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          colSpan,
          rowSpan,
          data: blockSpecificData,
          visible: true,
          sub_site_id: selectedSubSiteId,
          board_index: selectedBoardIndex,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setProfile((prev) => prev ? { ...prev, blocks: prev.blocks.filter(b => b.id !== newId) } : prev);
        alert(errorData.error || t("page.errorCreateBlock"));
        return;
      }

      const { block } = await response.json();
      setProfile((prev) => prev ? {
        ...prev,
        blocks: prev.blocks.map(b => b.id === newId ? { ...b, id: block.id } : b)
      } : prev);
      setEditingBlock({ ...initialData, id: block.id } as BlockData);
    } catch (error) {
      console.error('Error creating block:', error);
      setProfile((prev) => prev ? { ...prev, blocks: prev.blocks.filter(b => b.id !== newId) } : prev);
    }
  };

  const updateBlock = async (updatedBlock: BlockData) => {
    setProfile((prev) => {
      if (!prev) return prev;

      const nextProfile = {
        ...prev,
        blocks: prev.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b)
      };

      if (updatedBlock.type === 'hero') {
        if (selectedSubSiteId) {
          nextProfile.subSites = prev.subSites.map(site =>
            site.id === selectedSubSiteId
              ? { ...site, avatarUrl: updatedBlock.avatarUrl || "" }
              : site
          );
        } else {
          nextProfile.avatarUrl = updatedBlock.avatarUrl || "";
        }
      }

      return nextProfile;
    });

    if (!updatedBlock.id.startsWith('temp-')) {
      try {
        const { id, ...updatePayload } = updatedBlock;
        await fetch(`/api/blocks/${updatedBlock.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
      } catch (error) {
        console.error('Error updating block:', error);
      }
    }
  };

  const renderBlockContent = (block: BlockData) => {
    const props = {
      data: block as any,
      accentColor: profile?.accentColor || '#C8FF00'
    };

    switch (block.type) {
      case "hero": return <HeroBlock {...props} />;
      case "building": return <BuildingBlock {...props} />;
      case "github": return <GitHubBlock {...props} />;
      case "project": return <ProjectBlock {...props} />;
      case "metric": return <MetricBlock {...props} />;
      case "social": return <SocialBlock {...props} />;
      case "stack": return <StackBlock {...props} />;
      case "community": return <CommunityBlock {...props} />;
      case "writing": return <WritingBlock {...props} />;
      case "cv": return <CVBlock {...props} />;
      case "media": return <MediaBlock {...props} />;
      case "certification": return <CertificationBlock {...props} />;
      case "achievement": return <AchievementBlock {...props} />;
      case "custom": return <CustomBlock {...props} />;
      case "collab": return <CollabBlock {...props} />;
      case "ecosystem": return <EcosystemBlock {...props} subSites={profile?.subSites || []} username={profile?.username} />;
      default: return (
        <div className="huevsite-block h-full flex items-center justify-center p-8 border-dashed border-[var(--border-bright)] text-white/20">
          {t("page.ghostBlock")}
        </div>
      );
    }
  };

  const handleColorChange = async (color: string, confirmed: boolean) => {
    const previousColor = profile?.accentColor;
    setProfile(prev => prev ? { ...prev, accentColor: color } : null);
    if (confirmed) {
      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accent_color: color }),
        });
        if (!res.ok) throw new Error(`save failed (${res.status})`);
      } catch (e) {
        console.error('Error saving color:', e);
        setProfile(prev => prev && previousColor ? { ...prev, accentColor: previousColor } : prev);
        alert(t("page.errorSaveColor"));
      }
    }
  };

  const handleBorderRadiusChange = async (value: string) => {
    const previousRadius = profile?.borderRadius;
    setProfile(prev => prev ? { ...prev, borderRadius: value } : null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ border_radius: value }),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
    } catch (e) {
      console.error('Error saving border radius:', e);
      setProfile(prev => prev ? { ...prev, borderRadius: previousRadius } : prev);
      alert(t("page.errorSaveBorderRadius"));
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accent_color: profile.accentColor,
          username: profile.username,
          name: profile.displayName,
          tagline: profile.tagline,
          custom_domain: profile.customDomain,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile?.builder_score !== undefined) {
          setProfile(prev => prev ? { ...prev, builderScore: data.profile.builder_score } : prev);
        }
      }

      const blockOrders = profile.blocks
        .map((block, index) => ({ id: block.id, order: index }))
        .filter(b => !b.id.startsWith('temp-'));

      if (blockOrders.length > 0) {
        await fetch('/api/blocks/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blockOrders),
        });
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (profile?.customDomain) {
      setDomain(profile.customDomain);
    }
  }, [profile?.customDomain]);

  const handleVerify = async () => {
    if (!domain) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/profile/verify-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: normalizeDomainInput(domain) })
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (error) {
      setVerificationResult({ isValid: false, message: t("page.errorVerifyDomain") });
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateDomain = async (domain: string) => {
    try {
      const resp = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_domain: normalizeDomainInput(domain) }),
      });
      if (!resp.ok) throw new Error('Error domain update');
      const normalizedDomain = normalizeDomainInput(domain);
      setProfile(prev => prev ? { ...prev, customDomain: normalizedDomain } : null);
      setDomain(normalizedDomain);
      setVerificationResult(null);
    } catch (e: any) {
      alert(t("page.errorSaveDomain"));
    }
  };

  const handleAddSubSite = async (title: string, slug: string, description?: string, avatarUrl?: string) => {
    // If description or avatarUrl are passed, the sub-site was already created by the AI API.
    // We just push it into local state. Otherwise, POST to the API to create it.
    if (description !== undefined || avatarUrl !== undefined) {
      // Magic flow: API already created the row, just refresh the list from the API
      try {
        const resp = await fetch('/api/profile');
        const data = await resp.json();
        const freshSubSites = normalizeSubSites(data.subSites || []);
        setProfile(prev => prev ? { ...prev, subSites: freshSubSites } : null);
      } catch (e) { console.error(e); }
      return;
    }
    // Manual flow: create sub-site via API
    try {
      const resp = await fetch('/api/sub-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const newSite = normalizeSubSites([data.subSite])[0];
        setProfile(prev => prev ? { ...prev, subSites: [newSite, ...(prev.subSites || [])] } : null);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateSubSite = async (id: string, updates: { title?: string, slug?: string, description?: string, avatarUrl?: string }) => {
    try {
      const resp = await fetch(`/api/sub-sites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updates.title,
          slug: updates.slug,
          description: updates.description,
          avatar_url: updates.avatarUrl
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const updatedSite = data.subSite;
        setProfile(prev => prev ? {
          ...prev,
          subSites: prev.subSites.map(s => s.id === id ? { 
            ...s, 
            ...updatedSite,
            avatarUrl: updatedSite.avatar_url // Map snake_case to camelCase
          } : s)
        } : null);
      }
    } catch (e) { console.error(e); }
  };
  const handleDeleteSubSite = async (id: string) => {
    if (!confirm(t("page.confirmDeleteBoard"))) return;
    try {
      const resp = await fetch(`/api/sub-sites/${id}`, { method: 'DELETE' });
      if (resp.ok) setProfile(prev => prev ? { ...prev, subSites: prev.subSites.filter(s => s.id !== id) } : null);
    } catch (e) { console.error(e); }
  };

  const handleOnboardingComplete = async (data: OnboardingCompletionData & { blocks: BlockData[] }) => {
    const managedBlockTypes = new Set(["hero", "github", "social", "metric", "stack"]);
    const nextDisplayName =
      data.linktreeData?.displayName || data.githubData?.name || profile?.displayName || data.username;
    const nextTagline =
      data.linktreeData?.bio || data.githubData?.bio || profile?.tagline || "";
    const nextAvatar =
      data.linktreeData?.avatarUrl || data.githubData?.avatarUrl || profile?.avatarUrl || "";

    // Optimistic update
    setProfile(prev => prev ? {
      ...prev,
      username: data.username,
      displayName: nextDisplayName,
      tagline: nextTagline,
      avatarUrl: nextAvatar,
      accentColor: data.accentColor,
      roles: data.roles,
      layout: data.layout,
      githubHandle: data.githubHandle || prev.githubHandle,
      isOnboardingTestUser: false,
      blocks: data.blocks && data.blocks.length > 0 
        ? data.blocks.map(b => ({ ...b, id: Math.random().toString() }))
        : prev.blocks
    } : null);

    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          name: nextDisplayName,
          tagline: nextTagline,
          image: nextAvatar,
          accent_color: data.accentColor,
          roles: data.roles,
          layout: data.layout,
          github_handle: data.githubHandle || null,
          is_onboarding_test_user: false
        }),
      });

      if (data.blocks && data.blocks.length > 0) {
        const existingManagedBlocks = (profile?.blocks || []).filter(block => managedBlockTypes.has(block.type));

        for (const existingBlock of existingManagedBlocks) {
          if (!data.blocks.some(block => block.type === existingBlock.type)) {
            await fetch(`/api/blocks/${existingBlock.id}`, { method: 'DELETE' });
          }
        }

        for (const block of data.blocks) {
          const existingBlock = existingManagedBlocks.find(candidate => candidate.type === block.type);
          const payload = {
            type: block.type,
            order: block.order,
            colSpan: block.col_span,
            rowSpan: block.row_span,
            visible: block.visible,
            data: block.type === 'hero'
              ? {
                  name: block.name,
                  tagline: block.tagline,
                  avatarUrl: block.avatarUrl,
                  status: block.status,
                  location: block.location,
                  description: block.description,
                  roles: block.roles
                }
              : block.type === 'github'
                ? { username: block.username, stats: block.stats, showAdvanced: block.showAdvanced }
                : block.type === 'social'
                  ? { links: block.links }
                  : block.type === 'metric'
                    ? { label: block.label, value: block.value, icon: block.icon }
                    : block.type === 'stack'
                      ? { items: block.items }
                      : block
          };

          await fetch(existingBlock ? `/api/blocks/${existingBlock.id}` : '/api/blocks', {
            method: existingBlock ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }

        // Refresh profile after creating blocks to get real IDs
        await fetchProfile();
      }

      localStorage.setItem("huevsite_onboarding_seen", "true");
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };


  const handleTransferProject = async (email: string) => {
    alert(t("page.transferDisabled"));
    return;
    /*
    if (!profile) return;
    try {
      const resp = await fetch('/api/profile/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!resp.ok) throw new Error('Error transferring');
      alert('Transferido!');
      window.location.reload();
    } catch (e: any) { alert(e.message); }
    */
  };

  // Sync temp profile data when opening modal
  useEffect(() => {
    if (isProfileModalOpen && profile) {
      if (selectedSubSiteId) {
        const site = profile.subSites.find(s => s.id === selectedSubSiteId);
        if (site) {
          setTempProfileData({
            username: site.slug || '',
            display_name: site.title || '',
            email: profile.email || '',
            tagline: site.description || '',
            avatarUrl: site.avatarUrl || '',
            githubHandle: '',
            country: ''
          });
          return;
        }
      }
      
      setTempProfileData({
        username: profile.username || '',
        display_name: profile.displayName || '',
        email: profile.email || '',
        tagline: profile.tagline || '',
        avatarUrl: profile.avatarUrl || '',
        githubHandle: profile.githubHandle || '',
        country: profile.country || ''
      });
    }
  }, [isProfileModalOpen, profile, selectedSubSiteId]);

  // Persist the "Editar Perfil" modal. Returns true on success (modal closes),
  // false on error (modal stays open so the user can retry).
  const handleSaveProfile = async (): Promise<boolean> => {
    if (selectedSubSiteId) {
      setProfile(prev => prev ? {
        ...prev,
        subSites: prev.subSites.map(site =>
          site.id === selectedSubSiteId
            ? { ...site, title: tempProfileData.display_name, slug: tempProfileData.username, description: tempProfileData.tagline, avatarUrl: tempProfileData.avatarUrl }
            : site
        ),
        blocks: prev.blocks.map(block =>
          block.type === 'hero'
            ? { ...block, avatarUrl: tempProfileData.avatarUrl || "" }
            : block
        )
      } : null);
      await handleUpdateSubSite(selectedSubSiteId, {
        title: tempProfileData.display_name,
        slug: tempProfileData.username,
        description: tempProfileData.tagline,
        avatarUrl: tempProfileData.avatarUrl
      });
      return true;
    }

    setProfile(prev => prev ? {
      ...prev,
      username: tempProfileData.username,
      displayName: tempProfileData.display_name,
      email: tempProfileData.email,
      tagline: tempProfileData.tagline,
      avatarUrl: tempProfileData.avatarUrl,
      blocks: prev.blocks.map(block =>
        block.type === 'hero'
          ? { ...block, avatarUrl: tempProfileData.avatarUrl || "" }
          : block
      )
    } : null);
    try {
      // email: "" fails z.string().email() and would reject the WHOLE patch —
      // only send it when the user actually typed one.
      const resp = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: tempProfileData.username, name: tempProfileData.display_name, tagline: tempProfileData.tagline, image: tempProfileData.avatarUrl, country: tempProfileData.country, ...(tempProfileData.email ? { email: tempProfileData.email } : {}) }) });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        alert(data.error || t("page.errorSaveProfile"));
        await fetchProfile();
        return false;
      }
    } catch {
      alert(t("page.errorNetworkSaveProfile"));
      await fetchProfile();
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!profile || loading || !autoSaveEnabled) return;
    const { builderScore, ...content } = profile;
    const currentVersion = JSON.stringify(content);
    if (currentVersion === lastSavedVersionRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      lastSavedVersionRef.current = currentVersion;
      handleSave();
    }, 2000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [profile, autoSaveEnabled, loading]);

  const toggleAutoSave = () => {
    const newVal = !autoSaveEnabled;
    setAutoSaveEnabled(newVal);
    localStorage.setItem("huevsite_autosave", String(newVal));
  };

  const toggleNewsletter = async () => {
    if (!profile) return;
    const newVal = !profile.newsletterSubscribed;
    setProfile({ ...profile, newsletterSubscribed: newVal });
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletter_subscribed: newVal }),
      });
      if (!res.ok) throw new Error("patch failed");
    } catch (err) {
      console.error("toggleNewsletter failed:", err);
      setProfile({ ...profile, newsletterSubscribed: !newVal });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] font-display">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-6 border border-[var(--border-bright)] animate-pulse mx-auto">
            <Sparkles size={32} className="text-[var(--accent)] animate-spin" />
          </div>
          <p className="text-[var(--text-dim)] font-mono text-sm">{t("page.loading")}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[var(--bg)] font-display overflow-hidden">
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-[200] backdrop-blur-md">
        <Link href="/" className="logo block text-lg font-extrabold tracking-tight">huev<span>site</span>.io</Link>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--accent)]"><Settings size={20} /></button>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
      </AnimatePresence>

        <DashboardSidebar
          profile={profile}
          selectedSubSiteId={selectedSubSiteId}
          setSelectedSubSiteId={setSelectedSubSiteId}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isSaving={isSaving}
        copied={copied}
        handleCopyUrl={handleCopyUrl}
        handleLogout={handleLogout}
        setIsProfileModalOpen={setIsProfileModalOpen}
        setIsScoreInfoOpen={setIsScoreInfoOpen}
        setIsCreateSubSiteOpen={setIsCreateSubSiteOpen}
          setIsUpgradeModalOpen={setIsUpgradeModalOpen}
          setIsFeedbackOpen={setIsFeedbackOpen}
          setIsDeleteAccountOpen={setIsDeleteAccountOpen}
          setIsLinktreeRefactorOpen={setIsLinktreeRefactorOpen}
          setTempProfileData={setTempProfileData}
          addBlock={addBlock}
        handleColorChange={handleColorChange}
        handleBorderRadiusChange={handleBorderRadiusChange}
        toggleAutoSave={toggleAutoSave}
        autoSaveEnabled={autoSaveEnabled}
        toggleNewsletter={toggleNewsletter}
        newsletterSubscribed={profile.newsletterSubscribed === true}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onShareUnlocked={(extraBlocks) => {
          setProfile(prev => prev ? { ...prev, twitterShareUnlocked: true, extraBlocksFromShare: extraBlocks } : null);
        }}
        onShareProfile={() => { setShareCelebrate(false); setIsShareProfileOpen(true); }}
        visibleBlockCount={visibleBlocks.length}
      />

      <main className={`flex-1 min-w-0 h-full overflow-y-auto p-4 md:px-8 lg:px-10 relative z-0 custom-scrollbar ${
        isPro
          ? 'pt-6 md:pb-8 md:pt-6 lg:pb-10 lg:pt-8'
          : 'md:pb-8 md:pt-0 lg:pb-10'
      }`}>
        <style dangerouslySetInnerHTML={{
          __html: `:root { --accent: ${profile.accentColor}; --accent-dim: ${profile.accentColor}1f; --btn-border: ${isDarkColor(profile.accentColor) ? 'rgba(255,255,255,0.15)' : 'transparent'}; --dashboard-radius: ${profile.borderRadius || '1.5rem'}; --radius-xl: ${profile.borderRadius || '1.5rem'}; }`
        }} />
        <div className="absolute top-0 right-0 w-full lg:w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.03)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-[1600px] mx-auto relative">
          <div className="absolute inset-x-6 top-0 h-24 md:h-32 bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.12)_0%,transparent_72%)] blur-3xl pointer-events-none opacity-70" />
          {!isPro && profile.freeTrial?.eligible && (
            <div className="relative z-20 mt-6 md:mt-8 mb-6 border border-[var(--accent)]/20 bg-[linear-gradient(135deg,rgba(200,255,0,0.12),rgba(255,255,255,0.02))] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)]" style={{ borderRadius: "var(--dashboard-radius)" }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">{t("page.trialEligibleBadge")}</div>
                  <h3 className="mt-2 text-xl font-black text-white">{t("page.trialEligibleTitle")}</h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/65">
                    {t("page.trialEligibleDescription")}
                  </p>
                </div>
                <button
                  onClick={handleClaimFreeTrial}
                  disabled={isClaimingTrial}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-black transition-all disabled:opacity-60"
                  style={{ backgroundColor: profile.accentColor, color: getContrastColor(profile.accentColor) }}
                >
                  {isClaimingTrial ? <Sparkles size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                  {t("page.claimFreeTrial")}
                </button>
              </div>
            </div>
          )}

          {profile.freeTrial?.active && profile.subscriptionTier !== 'pro' && !trialBannerDismissed && (
            <div className="relative z-20 mb-6 border border-white/10 bg-white/[0.03] p-5 md:p-6" style={{ borderRadius: "var(--dashboard-radius)" }}>
              <button
                onClick={() => setTrialBannerDismissed(true)}
                className="absolute top-3 right-3 w-7 h-7 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/30 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={14} />
              </button>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">{t("page.trialActiveBadge")}</div>
                  <h3 className="mt-2 text-lg font-black text-white">{t("page.trialActiveTitle")}</h3>
                  <p className="mt-1 text-sm text-white/60">
                    {t("page.trialActiveDescription", { days: profile.freeTrial.daysRemaining })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("insights")}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/80 transition-all hover:bg-white/10"
                  >
                    {t("page.viewInsights")}
                  </button>
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black"
                    style={{ backgroundColor: profile.accentColor, color: getContrastColor(profile.accentColor) }}
                  >
                    {t("page.continueInPro")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isPro && profile.freeTrial?.canUseLastInsightsView && !profile.freeTrial?.active && (
            <div className="relative z-20 mb-6 border border-white/10 bg-white/[0.03] p-5 md:p-6" style={{ borderRadius: "var(--dashboard-radius)" }}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">{t("page.lastViewBadge")}</div>
                  <h3 className="mt-2 text-lg font-black text-white">{t("page.lastViewTitle")}</h3>
                  <p className="mt-1 text-sm text-white/60">
                    {t("page.lastViewDescription")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("insights")}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/80 transition-all hover:bg-white/10"
                  >
                    {t("page.viewLastTime")}
                  </button>
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black"
                    style={{ backgroundColor: profile.accentColor, color: getContrastColor(profile.accentColor) }}
                  >
                    {t("page.continueWithPro")}
                  </button>
                </div>
              </div>
            </div>
          )}

          <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 lg:gap-8 mb-8 md:mb-12 items-center lg:text-left text-center px-2 md:px-0 relative z-[999]">
          <div className="w-full md:w-auto relative">
            <TwitterWarning blocks={profile.blocks} isSubSite={Boolean(selectedSubSiteId)} onAddTwitter={() => {
              const socialBlock = profile.blocks.find(b => b.type === 'social');
              if (socialBlock) {
                setEditingBlock(socialBlock);
              } else {
                addBlock('social');
              }
            }} />
            <div className="mb-3 hidden md:block"><div className="section-label">// dashboard / {activeTab}</div></div>
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-[950] tracking-tighter leading-[0.94] text-balance">
              {activeTab === 'board' ? <>{t("page.headingBoardPrefix")} <span style={{ color: profile.accentColor }}>{selectedSubSiteId ? (profile.subSites.find(s => s.id === selectedSubSiteId)?.title || t("page.boardFallback")) : "huevsite"}</span>.</> :
               activeTab === 'insights' ? <>{t("page.headingInsightsPrefix")} <span style={{ color: profile.accentColor }}>{t("page.headingInsightsWord")}</span>.</> :
               activeTab === 'domain' ? <>{t("page.headingDomainPrefix")} <span style={{ color: profile.accentColor }}>{t("page.headingDomainWord")}</span>.</> :
               activeTab === 'subsites' ? <>{t("page.headingSubsitesPrefix")} <span style={{ color: profile.accentColor }}>{t("page.headingSubsitesWord")}</span>.</> :
               <>{t("page.headingTransferPrefix")} <span style={{ color: profile.accentColor }}>{t("page.headingTransferWord")}</span>.</>}
            </h2>
          </div>
          {activeTab === 'board' && (
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:flex lg:items-center">
              <Link href={selectedSubSiteId ? `/${profile.username}/${profile.subSites.find(s => s.id === selectedSubSiteId)?.slug}` : `/${profile.username}`} target="_blank" className="btn-premium flex items-center justify-center gap-2 py-3 px-5 lg:px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-bold text-sm transition-all hover:bg-white/5 hover:border-white/20 min-w-0"><Eye size={18} className="text-white/40 shrink-0" /><span>{t("page.view")}</span></Link>
              <button onClick={handleSave} disabled={isSaving} className="btn-premium flex items-center justify-center gap-2 py-3 px-6 lg:px-10 rounded-2xl text-black font-[900] text-sm transition-all shadow-xl min-w-0" style={{ backgroundColor: profile.accentColor, color: getContrastColor(profile.accentColor) }}>
                {isSaving ? <Sparkles size={18} className="animate-spin" /> : <Save size={18} />}<span>{isSaving ? t("page.saving") : t("page.save")}</span>
              </button>
            </div>
          )}
          </header>
        </div>

        <div className="max-w-[1600px] mx-auto pb-32">
          {/* Badges */}
          {(() => {
            const earnedBadges = (profile.badges || []);
            const earnedCount = earnedBadges.length;
            const totalCount = ALL_BADGE_KEYS.length;
            return (
              <div className="mb-8 px-2 md:px-0">
                <div
                  className="border border-white/[0.06] overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.015)", borderRadius: "var(--dashboard-radius)" }}
                >
                  {/* Toggle header */}
                  <button
                    onClick={() => setBadgesCollapsed(c => !c)}
                    className="w-full flex items-center gap-3 px-5 py-4 group hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Label + count */}
                    <span className="text-[10px] font-black text-white/25 uppercase tracking-[0.22em] shrink-0">{t("page.badges")}</span>
                    <span className="text-[9px] font-black text-white/15 font-mono shrink-0">{earnedCount}/{totalCount}</span>

                    {/* Mini badges — always visible, earned first */}
                    <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                      {ALL_BADGE_KEYS.map((key) => {
                        const earned = earnedBadges.some((b) => b.key === key);
                        const badge = { key, ...BADGE_CATALOG[key] };
                        return (
                          <motion.div
                            key={key}
                            animate={{ opacity: earned ? 1 : (badgesCollapsed ? 0.2 : 0), scale: earned ? 1 : (badgesCollapsed ? 0.8 : 0), width: badgesCollapsed ? "auto" : 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="shrink-0 overflow-hidden"
                            style={{ originX: 0 }}
                          >
                            <BadgeItem badge={badge} earned={earned} size="sm" />
                          </motion.div>
                        );
                      })}
                    </div>

                    <ChevronDown
                      size={14}
                      className={`shrink-0 text-white/20 group-hover:text-white/40 transition-transform duration-300 ${badgesCollapsed ? "" : "rotate-180"}`}
                    />
                  </button>

                  {/* Expandable content */}
                  <AnimatePresence initial={false}>
                    {!badgesCollapsed && (
                      <motion.div
                        key="badge-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-white/[0.04]">
                          <div className="flex flex-wrap gap-x-6 gap-y-5 pt-5">
                            {ALL_BADGE_KEYS.map((key) => {
                              const earned = earnedBadges.some((b) => b.key === key);
                              const badge = { key, ...BADGE_CATALOG[key] };
                              return <BadgeItem key={key} badge={badge} earned={earned} size="md" />;
                            })}
                          </div>

                          {/* Builder de la Semana embeddable badge (winners only; self-hides) */}
                          <div className="mt-5">
                            <BadgeSnippetCard username={profile.username} />
                          </div>

                          {/* Referral link */}
                          {profile.referralCode && (
                            <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-[9px] font-black text-white/25 uppercase tracking-[0.22em] mb-0.5">{t("page.yourReferralLink")}</div>
                                <div className="text-[11px] text-white/40 font-mono truncate">
                                  huevsite.io/login?ref=<span className="text-white/60">{profile.referralCode}</span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(`https://huevsite.io/login?ref=${profile.referralCode}`);
                                  setReferralCopied(true);
                                  setTimeout(() => setReferralCopied(false), 2000);
                                }}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition-all text-[10px] font-black uppercase tracking-[0.12em] text-white/50 hover:text-white/80"
                              >
                                {referralCopied ? <Check size={12} className="text-[var(--accent)]" /> : <Copy size={12} />}
                                {referralCopied ? t("page.copied") : t("page.copy")}
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })()}

          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="fixed bottom-5 right-5 z-[180] flex items-center gap-2 border border-white/10 bg-[#09090b]/90 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
            style={{ borderRadius: "calc(var(--dashboard-radius) + 0.5rem)" }}
          >
            <MessageSquare size={16} />
            {t("page.feedback")}
          </button>

          {/* DESKTOP TABS */}
          {isPro && (
          <div className="hidden md:flex relative mb-16 z-20 items-center justify-center">
            <div className="flex items-center gap-1 bg-white/[0.03] p-1.5 border border-white/5 backdrop-blur-md shadow-2xl overflow-x-auto scrollbar-none max-w-full w-fit" style={{ borderRadius: "calc(var(--dashboard-radius) + 0.75rem)" }}>
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 lg:px-8 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all relative shrink-0 ${activeTab === tab ? 'text-black' : 'text-white/20 hover:text-white/60 hover:bg-white/[0.03]'}`}
                  style={{ borderRadius: "calc(var(--dashboard-radius) + 0.25rem)" }}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTabSel"
                      className="absolute inset-0 bg-[var(--accent)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]"
                      style={{ borderRadius: "calc(var(--dashboard-radius) + 0.25rem)" }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{tab === 'board' ? t("page.tabEditor") : tab === 'projects' ? t("page.tabProjects") : tab === 'insights' ? t("page.tabInsights") : tab === 'subsites' ? t("page.tabSubsites") : tab === 'domain' ? t("page.tabDomain") : t("page.tabTransfer")}</span>
                </button>
              ))}
            </div>
          </div>
          )}

          {/* MOBILE DROPDOWN */}
          {isPro && (
          <div className="md:hidden relative mb-10 z-30 px-4">
             <button 
                onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
                className="w-full bg-white/[0.05] border border-white/10 p-5 flex items-center justify-between text-white group active:scale-95 transition-all"
                style={{ borderRadius: "var(--dashboard-radius)" }}
             >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]">
                      {activeTab === 'board' ? <LayoutIcon size={18} /> :
                       activeTab === 'projects' ? <Rocket size={18} /> :
                       activeTab === 'insights' ? <Activity size={18} /> :
                       activeTab === 'subsites' ? <Compass size={18} /> :
                       activeTab === 'domain' ? <Globe size={18} /> : <ArrowUpRight size={18} />}
                   </div>
                   <div className="text-left">
                      <span className="text-[10px] block font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">{t("page.activeView")}</span>
                      <span className="text-sm font-black uppercase tracking-widest">
                        {activeTab === 'board' ? t("page.tabEditor") : activeTab === 'projects' ? t("page.tabProjects") : activeTab === 'insights' ? t("page.tabInsights") : activeTab === 'subsites' ? t("page.tabSubsites") : activeTab === 'domain' ? t("page.tabDomain") : t("page.tabTransfer")}
                      </span>
                   </div>
                </div>
                <ChevronDown size={20} className={`text-white/20 transition-transform duration-300 ${isTabMenuOpen ? 'rotate-180' : ''}`} />
             </button>

             <AnimatePresence>
                {isTabMenuOpen && (
                   <div className="absolute top-full left-4 right-4 mt-2 z-50">
                      <motion.div 
                         initial={{ opacity: 0 }} 
                         animate={{ opacity: 1 }} 
                         exit={{ opacity: 0 }} 
                         className="fixed inset-0 bg-black/60 backdrop-blur-sm shadow-2xl" 
                         onClick={() => setIsTabMenuOpen(false)} 
                      />
                      <motion.div
                         initial={{ opacity: 0, scale: 0.95, y: -10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95, y: -10 }}
                         className="relative bg-[#121214] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl p-3"
                         style={{ borderRadius: "calc(var(--dashboard-radius) + 0.75rem)" }}
                      >
                         {availableTabs.map((tab) => (
                            <button
                               key={tab}
                               onClick={() => { setActiveTab(tab); setIsTabMenuOpen(false); }}
                               className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === tab ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                               <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeTab === tab ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-white/30'}`}>
                                  {tab === 'board' ? <LayoutIcon size={16} /> :
                                   tab === 'projects' ? <Rocket size={16} /> :
                                   tab === 'insights' ? <Activity size={16} /> :
                                   tab === 'subsites' ? <Compass size={16} /> :
                                   tab === 'domain' ? <Globe size={16} /> : <ArrowUpRight size={16} />}
                               </div>
                               <span className={`text-xs font-black uppercase tracking-[0.1em] ${activeTab === tab ? 'text-white' : 'text-white/40'}`}>
                                  {tab === 'board' ? t("page.tabEditor") : tab === 'projects' ? t("page.tabProjects") : tab === 'insights' ? t("page.tabInsights") : tab === 'subsites' ? t("page.tabSubsites") : tab === 'domain' ? t("page.tabDomain") : t("page.tabTransfer")}
                               </span>
                               {activeTab === tab && <Check size={14} className="ml-auto text-[var(--accent)]" />}
                            </button>
                         ))}
                      </motion.div>
                   </div>
                )}
             </AnimatePresence>
          </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'board' && (
              <motion.div key="board" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                {/* Board presets switcher (Pro): hasta 3 boards, uno publicado. */}
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30 mr-1">// {t("page.boards")}</span>
                  {[0, 1, 2].map((i) => {
                    const isSelected = selectedBoardIndex === i;
                    const isPublished = (profile.publishedBoard ?? 0) === i;
                    const locked = !isPro && i !== (profile.publishedBoard ?? 0);
                    const name = profile.boardNames?.[String(i)] || t("page.boardDefaultName", { n: i + 1 });
                    return (
                      <button
                        key={i}
                        onClick={() => locked ? setIsUpgradeModalOpen(true) : setSelectedBoardIndex(i)}
                        className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border"
                        style={{
                          backgroundColor: isSelected ? "var(--accent)" : "rgba(255,255,255,0.03)",
                          color: isSelected ? "#000" : (locked ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.7)"),
                          borderColor: isSelected ? "transparent" : "rgba(255,255,255,0.08)",
                        }}
                        title={locked ? t("page.multipleBoardsArePro") : name}
                      >
                        {locked && <Lock size={11} />}
                        <span>{name}</span>
                        {isPublished && (
                          <span
                            className="inline-flex h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: isSelected ? "#000" : profile.accentColor }}
                            title={t("page.published")}
                          />
                        )}
                      </button>
                    );
                  })}
                  {isPro && (profile.publishedBoard ?? 0) !== selectedBoardIndex && (
                    <button
                      onClick={() => publishBoard(selectedBoardIndex)}
                      disabled={isPublishingBoard}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all disabled:opacity-50"
                    >
                      {isPublishingBoard ? t("page.publishing") : t("page.publishThisBoard")}
                    </button>
                  )}
                  {isPro && (profile.publishedBoard ?? 0) === selectedBoardIndex && (
                    <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--accent)]/60">
                      ● {t("page.live")}
                    </span>
                  )}
                </div>
                <div className="mb-6 md:mb-8 flex items-center justify-between gap-4 px-1">
                  <p className="text-[11px] text-white/30 font-medium">
                    {t("page.boardHint")}
                  </p>
                  <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/25 shrink-0">
                    <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: profile.accentColor }} />
                    {t("page.blockCount", { count: visibleBlocks.length })}{hiddenBlocks.length > 0 && isPro ? ` · ${t("page.hiddenCount", { count: hiddenBlocks.length })}` : ""}
                  </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={visibleBlocks.map(b => b.id)} strategy={rectSortingStrategy}>
                    <div className="dashboard-board-grid huevsite-grid min-h-[560px] md:min-h-[620px] p-3 sm:p-6 lg:p-8 xl:p-10 border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" style={{ borderRadius: "calc(var(--dashboard-radius) + 0.5rem)" }}>
                      {visibleBlocks.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-40 text-center text-white/20 font-bold uppercase tracking-widest text-sm">
                          <Plus className="mb-4 opacity-30" size={40} />
                          {t("page.addFirstBlock")}
                        </div>
                      ) : (
                        visibleBlocks.map((block) => (
                          <SortableBlock
                            key={block.id}
                            id={block.id}
                            block={block}
                            onRemove={(id) => setIsDeletingId(id)}
                            onEdit={(b) => setEditingBlock(b)}
                            onResize={(id, colSpan, rowSpan) => updateBlock({ ...block, col_span: colSpan, row_span: rowSpan })}
                            onHide={isPro ? hideBlock : undefined}
                          >
                            {renderBlockContent(block)}
                          </SortableBlock>
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Hidden blocks panel — Pro only */}
                {isPro && hiddenBlocks.length > 0 && (
                  <div className="mt-8 p-5 md:p-6 border border-dashed border-white/10 bg-white/[0.015]" style={{ borderRadius: "calc(var(--dashboard-radius) + 0.5rem)" }}>
                    <div className="flex items-center gap-2.5 mb-4">
                      <EyeOff size={14} className="text-white/30" />
                      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white/30">
                        {t("page.hiddenBlocks")}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {hiddenBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[var(--accent)]/30 transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                              <EyeOff size={14} className="text-white/20" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white/60 truncate">{BLOCK_TYPE_LABELS[block.type] || block.type}</p>
                              <p className="text-[10px] text-white/25 font-mono uppercase">{block.type}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => restoreBlock(block.id)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] text-white/40 transition-all"
                          >
                            <Eye size={13} />
                            {t("page.show")}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visible también para Pros: /referrals manda acá con ?scrollTo=referrals
                    y el reward (referral_reward_expires_at) les extiende la cobertura igual. */}
                <div ref={referralsSectionRef} className="mt-12 max-w-[1200px] mx-auto scroll-mt-28">
                   <ReferralDashboard profile={profile} />
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div key="projects" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-3xl mx-auto px-2">
                <ProjectTracker
                  blocks={boardBlocks}
                  onUpdateBlock={updateBlock}
                  onEdit={(b) => setEditingBlock(b)}
                  onAddProject={(prefill) => addBlock("project", prefill)}
                  accentColor={profile.accentColor}
                  subscriptionTier={profile.subscriptionTier}
                />
              </motion.div>
            )}

            {activeTab === 'insights' && (
              <motion.div key="insights" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} className="max-w-5xl mx-auto px-2">
                <InsightsTab
                  accentColor={profile.accentColor}
                  blocks={profile.blocks}
                  subscriptionTier={profile.subscriptionTier}
                  onOptimizeBoard={() => setActiveTab('board')}
                  onLastTrialViewConsumed={() => {
                    setProfile((prev) => prev ? {
                      ...prev,
                      freeTrial: prev.freeTrial ? { ...prev.freeTrial, canUseLastInsightsView: false } : prev.freeTrial,
                      freeTrialLastInsightsViewedAt: new Date().toISOString(),
                      hasProAccess: false,
                    } : prev);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'domain' && (
              <motion.div key="domain" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto space-y-8 md:space-y-12 px-4">
                <DomainConnectionCard
                  domain={domain}
                  currentDomain={profile.customDomain}
                  domainGuide={domainGuide}
                  verifying={verifying}
                  verificationResult={verificationResult}
                  onDomainChange={(value) => {
                    setDomain(value);
                    setVerificationResult(null);
                  }}
                  onSave={() => handleUpdateDomain(domain)}
                  onVerify={handleVerify}
                />
              </motion.div>
            )}

            {activeTab === 'subsites' && (
              <motion.div key="subsites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8 md:space-y-12 px-4">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <h3 className="text-2xl font-black text-white text-center sm:text-left">{t("page.yourProjects")}</h3>
                   <button onClick={() => setIsCreateSubSiteOpen(true)} className="flex items-center justify-center gap-2 bg-[var(--accent)]/10 text-[var(--accent)] px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-all">
                     <Plus size={16} /> {t("page.createSubSite")}
                   </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.subSites.length === 0 ? (
                      <div className="col-span-full py-20 text-center bg-white/[0.01] border border-dashed border-white/5" style={{ borderRadius: "calc(var(--dashboard-radius) + 0.75rem)" }}>
                        <p className="text-white/20 font-black uppercase text-[10px] tracking-[0.2em]">{t("page.noSubSites")}</p>
                      </div>
                    ) : (
                      profile.subSites.map(site => (
                        <div key={site.id} className="p-5 md:p-6 bg-white/[0.02] border border-white/5 flex items-center justify-between group" style={{ borderRadius: "calc(var(--dashboard-radius) + 0.5rem)" }}>
                          <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {site.avatarUrl ? <img src={site.avatarUrl} className="w-full h-full object-cover" /> : <Globe2 size={24} className="text-white/20" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-white truncate">{site.title}</h4>
                              <p className="text-[10px] font-mono text-white/30 truncate">/{site.slug}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                             <button onClick={() => { setSelectedSubSiteId(site.id); setActiveTab('board'); }} className="p-2.5 md:p-3 rounded-xl bg-white/5 hover:bg-[var(--accent)] hover:text-black transition-all">
                               <LayoutIcon size={16} />
                             </button>
                             <button onClick={() => handleDeleteSubSite(site.id)} className="p-2.5 md:p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>
                      ))
                    )}
                 </div>
              </motion.div>
            )}

            {activeTab === 'transfer' && (
              <motion.div key="transfer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl mx-auto space-y-12 text-center relative px-4 py-10">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] z-10 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center border border-white/10">
                   <div className="bg-[#09090b] p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl scale-100 md:scale-110">
                      <Lock size={40} className="mx-auto mb-6 text-[var(--accent)] opacity-40" />
                      <h4 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tighter">{t("page.featureDisabled")}</h4>
                      <p className="text-white/40 text-[10px] font-bold font-mono uppercase tracking-widest">{t("page.comingSoonForPro")}</p>
                   </div>
                </div>
                <div className="space-y-4 filter blur-md pointer-events-none">
                  <h3 className="text-3xl font-[950] tracking-tighter text-white">{t("page.transferProjectTitle")}</h3>
                  <p className="text-white/40 text-sm">{t("page.transferProjectDescription")}</p>
                </div>
                <div className="space-y-6 filter blur-md pointer-events-none">
                  <div className="relative">
                    <SendHorizontal className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                    <input disabled value={transferEmail} placeholder={t("page.transferEmailPlaceholder")} className="w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] pl-16 pr-8 py-6 text-xl font-bold" />
                  </div>
                  <button disabled className="w-full py-6 rounded-[2rem] bg-white/10 text-white/20 font-black uppercase tracking-widest">{t("page.confirmTransfer")}</button>
                </div>
                <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 text-amber-500/60 text-[10px] font-bold italic flex items-center gap-3 filter blur-md pointer-events-none">
                  <AlertCircle size={16} /> {t("page.transferIrreversible")}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {editingBlock && (
        <BlockEditorModal 
          block={editingBlock} 
          isOpen={!!editingBlock} 
          onClose={() => setEditingBlock(null)} 
          onSave={updateBlock} 
          accentColor={profile?.accentColor || "#C8FF00"} 
        />
      )}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={() => { 
          localStorage.setItem("huevsite_onboarding_seen", "true"); 
          setIsOnboardingOpen(false); 
        }} 
        username={profile.username}
        displayName={profile.displayName}
        tagline={profile.tagline}
        avatarUrl={profile.avatarUrl}
        githubData={profile.githubHandle ? {
          username: profile.githubHandle,
          avatarUrl: profile.avatarUrl || "",
          name: profile.displayName,
          bio: profile.tagline || "",
          publicRepos: 0,
          followers: 0,
          topLanguages: [],
          topRepos: [],
        } as GitHubData : null}
        initialColor={profile.accentColor}
        initialLayout={(profile.layout as LayoutOption | null) || null}
        initialRoles={(profile.roles as Role[] | null) || []}
        onComplete={handleOnboardingComplete}
      />
      <AnimatePresence>{isDeletingId && <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsDeletingId(null)} /><motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-sm bg-[var(--surface)] border border-red-500/30 rounded-[2rem] shadow-2xl p-8 z-[510] text-center"><div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 text-red-500"><Trash2 size={32} /></div><h3 className="text-2xl font-black mb-3 text-white">{t("page.deleteBlockConfirmTitle")}</h3><p className="text-[var(--text-dim)] mb-8 text-sm leading-relaxed">{t("page.actionCannotBeUndone")}</p><div className="flex gap-3"><button onClick={() => setIsDeletingId(null)} className="flex-1 py-3.5 rounded-2xl bg-[var(--surface2)] font-bold text-sm text-white">{t("page.cancel")}</button><button onClick={() => { removeBlock(isDeletingId); setIsDeletingId(null); }} className="flex-1 py-3.5 rounded-2xl bg-red-500 font-bold text-sm text-white transition-all">{t("page.delete")}</button></div></motion.div></div>}</AnimatePresence>
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        accentColor={profile.accentColor}
        selectedSubSiteId={selectedSubSiteId}
        profileUsername={profile.username}
        data={tempProfileData}
        setData={setTempProfileData}
        onSave={handleSaveProfile}
      />
      <ScoreInfoModal isOpen={isScoreInfoOpen} onClose={() => setIsScoreInfoOpen(false)} accentColor={profile.accentColor} profileId={profile.id} />
      <CreateSubSiteModal
        isOpen={isCreateSubSiteOpen}
        onClose={() => setIsCreateSubSiteOpen(false)}
        accentColor={profile.accentColor}
        onAddSubSite={handleAddSubSite}
        username={profile.username}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountOpen}
        onClose={() => {
          if (!isDeletingAccount) {
            setIsDeleteAccountOpen(false);
          }
        }}
        accentColor={profile.accentColor}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
      />
      <LinktreeRefactorModal
        isOpen={isLinktreeRefactorOpen}
        onClose={() => {
          if (!isRefactoringFromLinktree) {
            setIsLinktreeRefactorOpen(false);
          }
        }}
        accentColor={profile.accentColor}
        aiCredits={profile.aiCredits ?? 0}
        isSubmitting={isRefactoringFromLinktree}
        onConfirm={handleLinktreeRefactor}
      />
      {isUpgradeModalOpen && (
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          accentColor={profile.accentColor}
          freeTrial={profile.freeTrial}
          onClaimTrial={profile.freeTrial?.eligible ? handleClaimFreeTrial : undefined}
          isClaimingTrial={isClaimingTrial}
        />
      )}

      <ShareProfileModal
        isOpen={isShareProfileOpen}
        onClose={() => { setIsShareProfileOpen(false); setShareCelebrate(false); }}
        url={`${typeof window !== "undefined" ? window.location.origin : "https://huevsite.io"}/${profile.username}`}
        username={profile.username}
        displayName={profile.displayName}
        accentColor={profile.accentColor}
        message={t("page.shareMessage")}
        celebrate={shareCelebrate}
      />

      <JingleVoteModal
        isOpen={showJingle}
        onClose={() => {
          setShowJingle(false);
          if (!jingleVote && typeof window !== "undefined") {
            sessionStorage.setItem("huevsite_jingle_snoozed", "1");
          }
        }}
        accentColor={profile.accentColor}
        initialVote={jingleVote}
        onVoted={(choice) => setJingleVote(choice)}
      />

      <ProFeatureTour
        isOpen={isProTourOpen}
        onClose={() => setIsProTourOpen(false)}
        accentColor={profile.accentColor}
        onFinish={() => {
          setIsProTourOpen(false);
          setActiveTab("insights");
        }}
      />

      {/* Trial expired: let user choose which blocks to keep.
          Counts only VISIBLE blocks — hidden ones already resolved a past chooser,
          otherwise the modal would reappear on every session forever. */}
      {!isPro && !blockChooserResolved && profile.freeTrial?.claimed && !profile.freeTrial?.active &&
        profile.blocks.filter(b => b.visible !== false && (b.board_index ?? 0) === (profile.publishedBoard ?? 0)).length > MAX_FREE_BLOCKS + (profile.extraBlocksFromShare || 0) && (
        <TrialExpiredBlockChooser
          blocks={profile.blocks.filter(b => b.visible !== false && (b.board_index ?? 0) === (profile.publishedBoard ?? 0))}
          extraBlocksFromShare={profile.extraBlocksFromShare || 0}
          accentColor={profile.accentColor}
          onConfirm={handleBlockChooserConfirm}
          onUpgrade={() => {
            setBlockChooserResolved(true);
            setIsUpgradeModalOpen(true);
          }}
        />
      )}

      <TestimonialNudgeToast username={profile.username} />
    </div>
  );
}
