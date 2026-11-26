"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Globe2, AlertCircle, SendHorizontal, ChevronDown, X, Rocket, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import { MOCK_PROFILE } from "@/lib/mock-profile";
import { BlockData, BlockType, ProfileData, PRESET_COLORS, getContrastColor, isDarkColor, MAX_FREE_BLOCKS } from "@/lib/profile-types";
import { HeroBlock } from "@/components/blocks/HeroBlock";
import { BuildingBlock } from "@/components/blocks/BuildingBlock";
import { GitHubBlock } from "@/components/blocks/GitHubBlock";
import { ProjectBlock } from "@/components/blocks/ProjectBlock";
import { MetricBlock, SocialBlock, CVBlock } from "@/components/blocks/Widgets";
import { StackBlock, CommunityBlock, WritingBlock } from "@/components/blocks/ExtraBlocks";
import { MediaBlock, CertificationBlock, AchievementBlock, CustomBlock, CollabBlock, EcosystemBlock } from "@/components/blocks/NewBlocks";
import { SortableBlock } from "@/components/dashboard/SortableBlock";
import { MobilePreviewFrame } from "@/components/dashboard/MobilePreviewFrame";
import { MobileOrderList } from "@/components/dashboard/MobileOrderList";
import { hasMobileOrder, isDesktopOnlyType, materializeMobileOrder, nextMobileOrder, showsOnMobile, sortForMobile } from "@/lib/mobile-order";
import { BlockSelector } from "@/components/dashboard/BlockSelector";
import { BlockEditorModal } from "@/components/dashboard/BlockEditorModal";
import { ProjectTracker } from "@/components/dashboard/ProjectTracker";
import { ColorPicker } from "@/components/dashboard/ColorPicker";
import { FeedbackModal } from "@/components/dashboard/FeedbackModal";
import { McpAccessModal } from "@/components/dashboard/McpAccessModal";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import Link from "next/link";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";
import { createClient } from "@/lib/supabase/client";
import { ScoreInfoModal } from "@/components/social/ScoreInfoModal";
import { TestimonialNudgeToast } from "@/components/dashboard/TestimonialNudgeToast";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { DashboardBar, MobileTabBar, type DashboardTab, type SaveState } from "@/components/dashboard/shell/DashboardBar";
import { ProLine } from "@/components/dashboard/shell/ProLine";
import { DesignPanel } from "@/components/dashboard/shell/DesignPanel";
import { ScopeSelector } from "@/components/dashboard/shell/ScopeSelector";
import { EcosystemStrip } from "@/components/dashboard/shell/EcosystemStrip";
import { StatsTab } from "@/components/dashboard/shell/StatsTab";
import { SettingsTab, type SettingsSection } from "@/components/dashboard/shell/SettingsTab";
import { ShareProfileModal } from "@/components/share/ShareProfileModal";
import { PulseStrip, useProfilePulse } from "@/components/dashboard/shell/PulseStrip";
import { Celebrations } from "@/components/dashboard/shell/Celebrations";
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
import { ProfileStudio } from "@/components/dashboard/ProfileStudio";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { applyLinkOrder } from "@/lib/link-layout";
import { parseLinkBoxStyle, parseProfileLayout, type LinkBoxStyle, type ProfileLayoutMode } from "@/lib/profile-layout";

// "transfer" NO va en estas listas a propósito. La pestaña era Pro-only, o sea
// que la veía el que acababa de pagar, y al tocarla saltaba un alert() diciendo
// "Función inhabilitada temporalmente" (handleTransferProject más abajo, con el
// fetch comentado). Un tab muerto es lo peor que se puede encontrar justo
// después del checkout. El panel y el endpoint /api/profile/transfer quedan en
// el repo: para reactivarlo, agregá "transfer" a las dos listas y descomentá el
// fetch. Antes de eso hay que resolver que la transferencia pisa el perfil del
// destinatario (name/tagline/image/accent) y no valida sus límites de bloques.
const DASHBOARD_TABS = ["board", "projects", "insights", "subsites", "domain"] as const;
const PRO_ONLY_TABS = ["insights", "subsites", "domain"] as const;

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingBlock, setEditingBlock] = useState<BlockData | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isScoreInfoOpen, setIsScoreInfoOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCreateSubSiteOpen, setIsCreateSubSiteOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isLinktreeRefactorOpen, setIsLinktreeRefactorOpen] = useState(false);
  const [isShareProfileOpen, setIsShareProfileOpen] = useState(false);
  const [shareCelebrate, setShareCelebrate] = useState(false);
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
  // Guarda siempre solo: el botón Guardar y su interruptor quedaron de antes.
  const autoSaveEnabled = true;
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedVersionRef = useRef<string>("");
  const justLoadedRef = useRef(true);
  const pulse = useProfilePulse();
  // Solo en la primera carga alineamos el board editado con el publicado; en
  // refetches posteriores respetamos el board que el usuario está editando.
  const boardInitRef = useRef(false);
  const [tab, setTab] = useState<DashboardTab>("profile");
  const [profileView, setProfileView] = useState<"grid" | "projects">("grid");
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null);
  const [isDesignOpen, setIsDesignOpen] = useState(false);
  const [studioSave, setStudioSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [previewKey, setPreviewKey] = useState(0);
  const [domain, setDomain] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; message: string; needsTxtVerification?: boolean; txtRecord?: { host: string; value: string } } | null>(null);
  // Vista del tablero: 'mobile' muestra la lista de orden de celular + iframe.
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  // true si el orden de celular cambió y todavía no se guardó (handleSave lo manda).
  const [mobileDirty, setMobileDirty] = useState(false);
  // Orden de celular tal como estaba al empezar a editarlo (por id), para poder descartar.
  const mobileSnapshotRef = useRef<Map<string, number | null> | null>(null);
  const supabase = createClient();
  const isPro = profile?.hasProAccess === true;

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
        if (response.status === 401) {
          window.location.href = '/login';
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
        profileLayout: parseProfileLayout(data.profile.profile_layout),
        linkBoxStyle: parseLinkBoxStyle(data.profile.link_box_style),
        showEcosystem: data.profile.show_ecosystem !== false,
        roles: data.profile.roles || [],
        layout: data.profile.layout || null,
        subscriptionTier: (data.profile.subscription_tier === 'pro' || !!data.profile.pro_since) ? 'pro' : 'free',
        hasProAccess: hasProAccess(data.profile),
        // Debe seguir espejando `subscriptionTier` de lib/profile-service.ts (vista pública): incluye la recompensa de referidos vigente.
        publicEcosystemEligible: (() => {
          const p = data.profile;
          if (p.subscription_tier === 'pro' || !!p.pro_since) return true;
          if (p.referral_reward_expires_at) return new Date(p.referral_reward_expires_at) > new Date();
          return false;
        })(),
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
            mobileOrder: block.mobile_order ?? null,
            visibleOn: block.visible_on || 'both',
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
      setProfileLoadFailed(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileLoadFailed(true);
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

  // Las pestañas viejas (?tab=home|board|projects|insights|more|domain|subsites|transfer
  // y ?scrollTo=referrals) siguen llegando desde mails, avisos y /referrals: cada una
  // cae en su lugar nuevo.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const legacy = params.get("tab");
    if (params.get("scrollTo") === "referrals") { setTab("settings"); setSettingsSection("referrals"); return; }
    if (!legacy) return;
    if (legacy === "insights" || legacy === "stats") setTab("stats");
    else if (legacy === "projects") { setTab("profile"); setProfileView("projects"); }
    else if (legacy === "more" || legacy === "settings") setTab("settings");
    else if (legacy === "domain") { setTab("settings"); setSettingsSection("domain"); }
    else if (legacy === "subsites") { setTab("settings"); setSettingsSection("subsites"); }
    else setTab("profile");
  }, []);

  const goTab = (next: DashboardTab) => {
    if (next !== "settings") setSettingsSection(null);
    setTab(next);
  };

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
            mobileOrder: block.mobile_order ?? null,
            visibleOn: block.visible_on || 'both',
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

  // Foto del orden de celular guardado, tomada antes del primer cambio pendiente.
  const captureMobileSnapshot = () => {
    if (mobileDirty || mobileSnapshotRef.current) return;
    mobileSnapshotRef.current = new Map(boardBlocks.map(b => [b.id, b.mobileOrder ?? null]));
  };

  // Descarta los cambios pendientes del orden de celular y vuelve al último estado guardado.
  // Es la salida cuando el guardado falla y el cambio de board queda frenado.
  const discardMobileOrder = () => {
    const snap = mobileSnapshotRef.current;
    if (snap) {
      setProfile((prev) => prev ? {
        ...prev,
        blocks: prev.blocks.map(b => snap.has(b.id) ? { ...b, mobileOrder: snap.get(b.id) ?? null } : b),
      } : prev);
    }
    mobileSnapshotRef.current = null;
    setMobileDirty(false);
  };

  // Reordenamiento de CELULAR (lista lateral). El primer arrastre fija el orden
  // de TODO el board (materializeMobileOrder), no solo del bloque movido; si no,
  // los NULL se irían al final y el resto saltaría de lugar.
  const handleMobileDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    captureMobileSnapshot();
    setProfile((prev) => {
      if (!prev) return prev;
      const board = prev.blocks.filter(b => (b.board_index ?? 0) === selectedBoardIndex);
      const materialized = hasMobileOrder(board)
        ? null
        : new Map(materializeMobileOrder(board).map(m => [m.id, m.mobile_order]));
      const base = materialized
        ? board.map(b => ({ ...b, mobileOrder: materialized.get(b.id)! }))
        : board;
      const sorted = sortForMobile(base);
      const from = sorted.findIndex(b => b.id === active.id);
      const to = sorted.findIndex(b => b.id === over.id);
      if (from < 0 || to < 0) return prev;
      const moved = arrayMove(sorted, from, to);
      const index = new Map(moved.map((b, i) => [b.id, i]));
      return {
        ...prev,
        blocks: prev.blocks.map(b => index.has(b.id) ? { ...b, mobileOrder: index.get(b.id)! } : b),
      };
    });
    setMobileDirty(true);
  };

  // "Volver a seguir el orden de escritorio": mobile_order = NULL en todo el board.
  const resetMobileOrder = () => {
    captureMobileSnapshot();
    setProfile((prev) => prev ? {
      ...prev,
      blocks: prev.blocks.map(b => (b.board_index ?? 0) === selectedBoardIndex ? { ...b, mobileOrder: null } : b),
    } : prev);
    setMobileDirty(true);
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

  const removeBlock = async (id: string): Promise<boolean> => {
    if (!id.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/blocks/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          alert(t("page.errorDeleteBlock", { error: errorData.error || t("page.errorUnknown") }));
          return false;
        }
      } catch (error) {
        console.error('Error deleting block:', error);
        alert(t("page.errorNetworkDeleteBlock"));
        return false;
      }
    }

    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.filter(b => b.id !== id)
      };
    });
    setEditingBlock((current) => (current?.id === id ? null : current));
    setPreviewKey((key) => key + 1);
    setLastSaved(new Date());
    return true;
  };

  const confirmDeleteBlock = async () => {
    if (!isDeletingId || isDeletePending) return;
    setIsDeletePending(true);
    const ok = await removeBlock(isDeletingId);
    setIsDeletePending(false);
    if (ok) setIsDeletingId(null);
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

  // Visibilidad por vista (Pro). Optimista; si el servidor la rechaza (o la
  // columna aún no existe) se vuelve al valor anterior y se avisa.
  const handleViewChange = async (id: string, view: 'both' | 'desktop' | 'mobile') => {
    const previous = profile?.blocks.find(b => b.id === id)?.visibleOn || 'both';
    const apply = (v: 'both' | 'desktop' | 'mobile') =>
      setProfile(prev => prev ? { ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, visibleOn: v } : b) } : prev);
    apply(view);
    // Avisar (sin prohibir) si el cambio deja el perfil de celular sin ningún bloque visible.
    if (view === 'desktop') {
      const othersOnMobile = boardBlocks.some(b => b.id !== id && b.visible !== false && showsOnMobile(b));
      if (!othersOnMobile) alert(t("page.warnNoMobileBlocks"));
    }
    if (id.startsWith("temp-")) return;
    try {
      const res = await fetch(`/api/blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible_on: view }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Con orden de celular pendiente, recargar la vista previa la dejaría mostrando el
      // orden publicado y no el de la lista que el usuario tiene delante.
      if (!mobileDirty) setLastSaved(new Date());
    } catch (e) {
      console.error("Error saving visible_on:", e);
      apply(previous);
      alert(t("page.errorSaveVisibleOn"));
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
  // Lista de orden de celular: fuera los tipos que el celular no renderiza (ecosystem),
  // así no se arrastra ni se le elige vista a algo que no se va a ver.
  const mobileListBlocks = visibleBlocks.filter(b => !isDesktopOnlyType(b.type));
  const desktopOnlyTypeBlocks = visibleBlocks.filter(b => isDesktopOnlyType(b.type));

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

  const addBlock = async (type: BlockType, prefill?: Record<string, any>, opts?: { silent?: boolean }) => {
    // Un solo hero por board: si ya hay uno, se abre ese en vez de duplicar la bio.
    if (type === "hero") {
      const existingHero = boardBlocks.find((b) => b.type === "hero" && b.visible);
      if (existingHero) {
        setEditingBlock(existingHero);
        return;
      }
    }
    const newId = `temp-${type}-${Date.now()}`;
    const colSpan = type === "hero" || type === "ecosystem" ? 2 : (type === "github" || type === "project" ? 1 : 1);
    const rowSpan = type === "hero" || type === "ecosystem" ? 2 : (type === "github" || type === "project" ? 2 : 1);

    let initialData: any = {
      id: newId,
      type: type,
      order: profile?.blocks.length || 0,
      // null mientras el board no tenga orden propio de celular; si lo tiene, al final.
      mobileOrder: nextMobileOrder(boardBlocks),
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
      const { id, type: blockType, order, col_span, row_span, visible, board_index, mobileOrder, visibleOn: _visibleOn, ...blockSpecificData } = initialData;
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
          ...(typeof mobileOrder === "number" ? { mobile_order: mobileOrder } : {}),
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
      if (!opts?.silent) setEditingBlock({ ...initialData, id: block.id } as BlockData);
      // El EcosystemBlock ya lista los sub-sitios: apagar el panel del header para que no se dupliquen.
      if (type === "ecosystem" && profile?.showEcosystem !== false) {
        handleShowEcosystemChange(false);
      }
    } catch (error) {
      console.error('Error creating block:', error);
      setProfile((prev) => prev ? { ...prev, blocks: prev.blocks.filter(b => b.id !== newId) } : prev);
    }
  };

  const updateBlock = async (updatedBlock: BlockData): Promise<boolean> => {
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
        // mobileOrder solo se escribe por /api/blocks/reorder (handleSave); editar un
        // bloque no debe tocarlo (y evita depender de la columna en cada edición).
        // Lo mismo vale para visibleOn: solo lo escribe handleViewChange (gate Pro).
        const { id, mobileOrder: _mo, visibleOn: _vo, ...updatePayload } = updatedBlock;
        const res = await fetch(`/api/blocks/${updatedBlock.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
        return res.ok;
      } catch (error) {
        console.error('Error updating block:', error);
        return false;
      }
    }
    return true;
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

  const handleShowEcosystemChange = async (value: boolean) => {
    const previous = profile?.showEcosystem !== false;
    setProfile(prev => prev ? { ...prev, showEcosystem: value } : null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_ecosystem: value }),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
    } catch (e) {
      console.error('Error saving show_ecosystem:', e);
      setProfile(prev => prev ? { ...prev, showEcosystem: previous } : prev);
      alert(t("page.errorSaveShowEcosystem"));
    }
  };

  // Guarda el orden de celular pendiente del board/sub-site que se está editando.
  // El payload sale de boardBlocks (depende de selectedBoardIndex y del sub-site),
  // por eso hay que descargarlo ANTES de cambiar de alcance (ver changeScope).
  // Un NULL se manda explícito (vuelve a seguir escritorio). true = nada pendiente o guardado.
  const flushMobileOrder = async (): Promise<boolean> => {
    if (!mobileDirty) return true;
    const mobileItems = boardBlocks
      .filter(b => !b.id.startsWith('temp-'))
      .map(b => ({ id: b.id, mobile_order: b.mobileOrder ?? null }));
    if (mobileItems.length === 0) {
      mobileSnapshotRef.current = null;
      setMobileDirty(false);
      return true;
    }
    try {
      const res = await fetch('/api/blocks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view: 'mobile', blocks: mobileItems }),
      });
      if (res.ok) {
        mobileSnapshotRef.current = null;
        setMobileDirty(false);
        return true;
      }
    } catch (e) {
      console.error("Error guardando el orden de celular:", e);
    }
    alert(t("page.errorSaveMobileOrder"));
    return false;
  };

  // Cambiar de board o de sub-site con un reordenamiento de celular sin guardar:
  // primero se guarda lo pendiente del alcance actual; si no se pudo guardar, NO
  // se cambia (así el orden nunca se descarta ni se escribe en el board equivocado).
  const changeScope = async (apply: () => void): Promise<boolean> => {
    if (mobileDirty && !(await flushMobileOrder())) return false;
    apply();
    return true;
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

      // Orden de celular: solo si cambió. El guardado de escritorio de arriba no
      // lo toca. Si falla NO se marca como guardado (ni se recarga la vista previa).
      const mobileSaved = await flushMobileOrder();
      if (mobileSaved) setLastSaved(new Date());
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
    if (!profile || loading || profileLoadFailed || !autoSaveEnabled) { justLoadedRef.current = true; return; }
    const { builderScore, ...content } = profile;
    const currentVersion = JSON.stringify(content);
    // Lo que llega del servidor ya está guardado: es el punto de partida, no un cambio.
    if (justLoadedRef.current) { justLoadedRef.current = false; lastSavedVersionRef.current = currentVersion; return; }
    if (currentVersion === lastSavedVersionRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      lastSavedVersionRef.current = currentVersion;
      handleSave();
    }, 2000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [profile, autoSaveEnabled, loading, profileLoadFailed]);

  const markStudio = (ok: boolean) => {
    setStudioSave(ok ? "saved" : "error");
    if (ok) setPreviewKey((key) => key + 1);
  };

  const handleProfileLayout = async (layout: ProfileLayoutMode) => {
    const previous = profile?.profileLayout || "portfolio";
    setProfile((prev) => prev ? { ...prev, profileLayout: layout } : prev);
    setStudioSave("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_layout: layout }),
      });
      if (!res.ok) throw new Error("layout");
      markStudio(true);
    } catch {
      setProfile((prev) => prev ? { ...prev, profileLayout: previous } : prev);
      setStudioSave("error");
    }
  };

  const handleLinkBoxStyle = async (style: LinkBoxStyle) => {
    const previous = profile?.linkBoxStyle || "pill";
    setProfile((prev) => prev ? { ...prev, linkBoxStyle: style } : prev);
    setStudioSave("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_box_style: style }),
      });
      if (!res.ok) throw new Error("box");
      markStudio(true);
    } catch {
      setProfile((prev) => prev ? { ...prev, linkBoxStyle: previous } : prev);
      setStudioSave("error");
    }
  };

  const handleStudioBasics = useCallback(async (patch: { displayName: string; tagline: string }) => {
    setStudioSave("saving");
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        displayName: patch.displayName,
        tagline: patch.tagline,
        blocks: prev.blocks.map((block) =>
          block.type === "hero" ? { ...block, name: patch.displayName, tagline: patch.tagline } : block
        ),
      };
    });
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: patch.displayName, tagline: patch.tagline }),
      });
      const hero = profile?.blocks.find((block) => block.type === "hero");
      if (hero && !hero.id.startsWith("temp-")) {
        await updateBlock({ ...hero, name: patch.displayName, tagline: patch.tagline } as BlockData);
      }
      markStudio(res.ok);
    } catch {
      setStudioSave("error");
    }
  }, [profile?.blocks]);

  const handleStudioReorder = async (orderedIds: string[]) => {
    if (!profile) return;
    const next = applyLinkOrder(profile.blocks, orderedIds);
    setProfile({ ...profile, blocks: next });
    setStudioSave("saving");
    try {
      const res = await fetch("/api/blocks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next.filter((block) => !block.id.startsWith("temp-")).map((block) => ({ id: block.id, order: block.order }))),
      });
      markStudio(res.ok);
    } catch {
      setStudioSave("error");
    }
  };

  const handleStudioBox = async (block: BlockData, style: LinkBoxStyle | null) => {
    setStudioSave("saving");
    const ok = await updateBlock({ ...block, boxStyle: style });
    markStudio(ok);
  };

  const handleStudioVisible = async (block: BlockData) => {
    setStudioSave("saving");
    const ok = await updateBlock({ ...block, visible: block.visible === false });
    markStudio(ok);
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

  if (loading || profileLoadFailed || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] font-display">
        <div className="text-center">
          {!loading && profileLoadFailed ? (
            <>
              <p role="alert" className="text-[var(--text-dim)] font-mono text-sm">{t("page.errorLoadProfile")}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void fetchProfile();
                }}
                className="mt-4 rounded-lg border border-[var(--border-bright)] bg-[var(--surface2)] px-4 py-2 text-sm font-bold text-[var(--text)]"
              >
                {t("page.retryLoadProfile")}
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-6 border border-[var(--border-bright)] animate-pulse mx-auto">
                <Sparkles size={32} className="text-[var(--accent)] animate-spin" />
              </div>
              <p className="text-[var(--text-dim)] font-mono text-sm">{t("page.loading")}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const currentSubSite = selectedSubSiteId ? profile.subSites.find((s) => s.id === selectedSubSiteId) : null;
  const profilePath = currentSubSite ? `/${profile.username}/${currentSubSite.slug}` : `/${profile.username}`;
  const canSeeInsights = isPro || profile.freeTrial?.canUseLastInsightsView === true;
  const isLinksLayout = profile.profileLayout === "links";
  const saveState: SaveState =
    isSaving || studioSave === "saving" ? "saving" :
    studioSave === "error" ? "error" :
    lastSaved || studioSave === "saved" ? "saved" : "idle";
  const openSubsite = (id: string) => {
    void changeScope(() => setSelectedSubSiteId(id)).then((ok) => { if (ok) { setProfileView("grid"); setTab("profile"); } });
  };
  const designPanel = (
    <DesignPanel
      profile={profile}
      isPro={isPro}
      onColor={handleColorChange}
      onRadius={handleBorderRadiusChange}
      onLayout={handleProfileLayout}
      onGlobalBox={handleLinkBoxStyle}
      onEcosystem={handleShowEcosystemChange}
      onUpgrade={() => setIsUpgradeModalOpen(true)}
    />
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)] font-display">
      <style dangerouslySetInnerHTML={{
        __html: `:root { --accent: ${profile.accentColor}; --accent-dim: ${profile.accentColor}1f; --btn-border: ${isDarkColor(profile.accentColor) ? 'rgba(255,255,255,0.15)' : 'transparent'}; --dashboard-radius: ${profile.borderRadius || '1.5rem'}; --radius-xl: ${profile.borderRadius || '1.5rem'}; }`
      }} />
      <DiscoveryHeader currentUserId={profile?.id} username={profile?.username} />

      <main className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto pb-24 md:pb-0">
        <DashboardBar
          tab={tab}
          onTab={goTab}
          statsLocked={!canSeeInsights}
          saveState={saveState}
          profilePath={profilePath}
          accentColor={profile.accentColor}
          onShare={() => { setShareCelebrate(false); setIsShareProfileOpen(true); }}
        />
        <ProLine
          profile={profile}
          isPro={isPro}
          claiming={isClaimingTrial}
          onClaim={handleClaimFreeTrial}
          onUpgrade={() => setIsUpgradeModalOpen(true)}
          onOpenStats={() => goTab("stats")}
        />

        <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 md:px-8 md:pt-8 lg:px-10">
          {tab === "profile" && (
            <div className="flex gap-8">
              <div className="flex min-w-0 flex-1 flex-col gap-5">
                {/* Lo que está pasando con tu perfil: visitas y tu lugar en el muro */}
                <PulseStrip pulse={pulse} onOpenStats={() => goTab("stats")} />
                {/* Qué estás editando + cómo lo ves + agregar */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <ScopeSelector
                    profile={profile}
                    isPro={isPro}
                    selectedSubSiteId={selectedSubSiteId}
                    onSelect={(id) => { void changeScope(() => setSelectedSubSiteId(id)); }}
                    onCreate={() => setIsCreateSubSiteOpen(true)}
                    onUpgrade={() => setIsUpgradeModalOpen(true)}
                  />
                  <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1" role="group" aria-label={t("shell.viewLabel")}>
                    {(["grid", "projects"] as const).map((view) => (
                      <button
                        key={view}
                        type="button"
                        aria-pressed={profileView === view}
                        onClick={() => setProfileView(view)}
                        className={`min-h-8 rounded-lg px-3 text-[12.5px] font-bold transition-colors ${profileView === view ? "bg-white/[0.08] text-white" : "text-white/45 hover:text-white"}`}
                      >
                        {view === "projects" ? t("shell.viewProjects") : isLinksLayout && !selectedSubSiteId ? t("shell.viewList") : t("shell.viewGrid")}
                      </button>
                    ))}
                  </div>
                  {profileView === "grid" && !(isLinksLayout && !selectedSubSiteId) && (
                    <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1" role="group" aria-label={t("page.viewToggleLabel")}>
                      {(["desktop", "mobile"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={viewMode === mode}
                          onClick={() => setViewMode(mode)}
                          className={`min-h-8 rounded-lg px-3 text-[12.5px] font-bold transition-colors ${viewMode === mode ? "bg-white/[0.08] text-white" : "text-white/45 hover:text-white"}`}
                        >
                          {mode === "desktop" ? t("page.viewDesktop") : t("page.viewMobile")}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setIsDesignOpen(true)}
                    className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-[13px] font-bold text-white/80 transition-colors hover:border-white/20 hover:text-white xl:hidden"
                  >
                    <Palette size={15} /> {t("shell.design")}
                  </button>
                  <BlockSelector
                    compact
                    onAdd={addBlock}
                    accentColor={profile.accentColor}
                    currentBlockCount={visibleBlocks.length}
                    subscriptionTier={isPro ? "pro" : profile.subscriptionTier}
                    username={profile.username}
                    twitterShareUnlocked={profile.twitterShareUnlocked}
                    extraBlocksFromShare={profile.extraBlocksFromShare}
                    onShareUnlocked={(extraBlocks) => setProfile(prev => prev ? { ...prev, twitterShareUnlocked: true, extraBlocksFromShare: extraBlocks } : null)}
                  />
                </div>

                {/* Boards (Pro): hasta 3 versiones del perfil, una publicada */}
                {isPro && profileView === "grid" && !selectedSubSiteId && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/35">{t("shell.boardsLabel")}</span>
                    {[0, 1, 2].map((i) => {
                      const isSelected = selectedBoardIndex === i;
                      const isPublished = (profile.publishedBoard ?? 0) === i;
                      const name = profile.boardNames?.[String(i)] || t("page.boardDefaultName", { n: i + 1 });
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => changeScope(() => setSelectedBoardIndex(i))}
                          aria-pressed={isSelected}
                          className={`flex min-h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-bold transition-colors ${isSelected ? "border-white/20 bg-white/[0.08] text-white" : "border-white/[0.06] text-white/50 hover:text-white"}`}
                        >
                          {name}
                          {isPublished && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" title={t("page.published")} />}
                        </button>
                      );
                    })}
                    {(profile.publishedBoard ?? 0) !== selectedBoardIndex ? (
                      <button
                        type="button"
                        onClick={() => publishBoard(selectedBoardIndex)}
                        disabled={isPublishingBoard}
                        className="ml-1 min-h-8 rounded-lg border border-[var(--accent)]/40 px-3 text-[12px] font-bold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10 disabled:opacity-50"
                      >
                        {isPublishingBoard ? t("page.publishing") : t("page.publishThisBoard")}
                      </button>
                    ) : (
                      <span className="ml-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--accent)]/70">● {t("page.live")}</span>
                    )}
                  </div>
                )}

                <TwitterWarning blocks={profile.blocks} isSubSite={Boolean(selectedSubSiteId)} onAddTwitter={() => {
                  const socialBlock = profile.blocks.find(b => b.type === 'social');
                  if (socialBlock) setEditingBlock(socialBlock); else addBlock('social');
                }} />

                {!selectedSubSiteId && profile.publicEcosystemEligible === true && profile.subSites.length > 0 && profileView === "grid" && (
                  <EcosystemStrip profile={profile} onOpen={openSubsite} onToggle={handleShowEcosystemChange} />
                )}

                {profileView === "projects" && (
                  <div className="mx-auto w-full max-w-3xl">
                    <ProjectTracker
                      blocks={boardBlocks}
                      onUpdateBlock={updateBlock}
                      onEdit={(b) => setEditingBlock(b)}
                      onAddProject={(prefill) => addBlock("project", prefill)}
                      onDeleteProject={(id) => setIsDeletingId(id)}
                      accentColor={profile.accentColor}
                      subscriptionTier={profile.subscriptionTier}
                    />
                  </div>
                )}

                {profileView === "grid" && isLinksLayout && !selectedSubSiteId && (
                  <ProfileStudio
                    embedded
                    profile={profile}
                    blocks={profile.blocks.filter((block) => (block.board_index ?? 0) === (profile.publishedBoard ?? 0))}
                    isSubSite={false}
                    saveState={studioSave}
                    copied={copied}
                    onLayout={handleProfileLayout}
                    onGlobalBox={handleLinkBoxStyle}
                    onBoxStyle={handleStudioBox}
                    onToggleVisible={handleStudioVisible}
                    onReorder={handleStudioReorder}
                    onBasics={handleStudioBasics}
                    onAddProject={(title, link) => addBlock("project", { title, link, description: "" }, { silent: true })}
                    onDeleteProject={(block) => setIsDeletingId(block.id)}
                    onEdit={(block) => setEditingBlock(block)}
                    onEditProfile={() => {
                      const hero = boardBlocks.find((b) => b.type === "hero" && b.visible !== false);
                      if (hero) setEditingBlock(hero); else setIsProfileModalOpen(true);
                    }}
                    onShare={() => { setShareCelebrate(false); setIsShareProfileOpen(true); }}
                    onCopy={handleCopyUrl}
                    onOpenGrid={() => setProfileView("grid")}
                    onOpenStats={() => goTab("stats")}
                    statsLocked={!profile.hasProAccess}
                    onBackToMain={() => { void changeScope(() => setSelectedSubSiteId(null)); }}
                    previewPath={profilePath}
                    previewKey={previewKey}
                  />
                )}

                {profileView === "grid" && !(isLinksLayout && !selectedSubSiteId) && (
                  <>
                    <p className="text-[12.5px] text-white/35">{viewMode === "mobile" ? t("page.mobileHint") : t("page.boardHint")}</p>

                    {viewMode === "mobile" && (
                      <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
                        <div className="w-full min-w-0 lg:flex-1">
                          {!hasMobileOrder(boardBlocks) ? (
                            <p className="mb-3 text-[12px] font-medium text-white/40">{t("page.mobileFollowsDesktop")}</p>
                          ) : (
                            <button type="button" onClick={resetMobileOrder} className="mb-3 min-h-10 rounded-xl border border-white/15 px-3 text-[12px] font-bold text-white/60 transition-colors hover:border-white/30 hover:text-white">
                              {t("page.mobileReset")}
                            </button>
                          )}
                          <MobileOrderList
                            blocks={sortForMobile(mobileListBlocks)}
                            typeLabels={BLOCK_TYPE_LABELS}
                            onDragEnd={handleMobileDragEnd}
                            sensors={sensors}
                            onViewChange={isPro ? handleViewChange : undefined}
                            onDeleteProject={(id) => setIsDeletingId(id)}
                          />
                          {desktopOnlyTypeBlocks.length > 0 && (
                            <p className="mt-4 text-[12px] font-medium text-white/40">
                              {t("page.desktopOnlyTypeNote", { types: desktopOnlyTypeBlocks.map(b => BLOCK_TYPE_LABELS[b.type] || b.type).join(", ") })}
                            </p>
                          )}
                          {isPro && hiddenBlocks.length > 0 && (
                            <p className="mt-4 text-[12px] font-medium text-white/40">{t("page.hiddenBlocksMobileNote", { count: hiddenBlocks.length })}</p>
                          )}
                        </div>
                        <div className="flex w-full justify-center lg:w-auto lg:shrink-0">
                          <MobilePreviewFrame
                            path={profilePath}
                            reloadKey={lastSaved ? lastSaved.getTime() : 0}
                            notPublished={!selectedSubSiteId && (profile.publishedBoard ?? 0) !== selectedBoardIndex}
                          />
                        </div>
                      </div>
                    )}

                    {viewMode === "desktop" && (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={visibleBlocks.map(b => b.id)} strategy={rectSortingStrategy}>
                          <div className="dashboard-board-grid huevsite-grid min-h-[560px] rounded-[calc(var(--dashboard-radius)+0.5rem)] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008))] p-3 sm:p-6 lg:p-8">
                            {visibleBlocks.length === 0 ? (
                              <div className="col-span-full flex flex-col items-center justify-center py-40 text-center text-sm font-bold uppercase tracking-widest text-white/25">
                                <Plus className="mb-4 opacity-40" size={36} />
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
                    )}

                    {viewMode === "desktop" && isPro && hiddenBlocks.length > 0 && (
                      <section className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.015] p-4">
                        <h3 className="mb-3 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/40">
                          <EyeOff size={12} /> {t("page.hiddenBlocks")} · {hiddenBlocks.length}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {hiddenBlocks.map((block) => (
                            <div key={block.id} className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-1 pl-3 pr-1">
                              <span className="mr-1 text-[13px] font-semibold text-white/65">{BLOCK_TYPE_LABELS[block.type] || block.type}</span>
                              <button type="button" onClick={() => restoreBlock(block.id)} className="flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold text-white/55 transition-colors hover:bg-white/[0.06] hover:text-[var(--accent)]">
                                <Eye size={13} /> {t("page.show")}
                              </button>
                              {block.type === "project" && (
                                <button type="button" onClick={() => setIsDeletingId(block.id)} aria-label={t("page.deleteProject")} className="grid h-9 w-9 place-items-center rounded-lg text-red-400/80 transition-colors hover:bg-red-500/10">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>

              <aside className="sticky top-24 hidden h-fit w-[290px] shrink-0 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-5 xl:block" aria-label={t("shell.design")}>
                <h2 className="mb-4 text-[15px] font-extrabold tracking-tight text-white">{t("shell.design")}</h2>
                {designPanel}
              </aside>
            </div>
          )}

          {tab === "stats" && (
            <StatsTab
              profile={profile}
              canSeeInsights={canSeeInsights}
              insights={
                <InsightsTab
                  accentColor={profile.accentColor}
                  blocks={profile.blocks}
                  subscriptionTier={profile.subscriptionTier}
                  onOptimizeBoard={() => goTab("profile")}
                  onLastTrialViewConsumed={() => {
                    setProfile((prev) => prev ? {
                      ...prev,
                      freeTrial: prev.freeTrial ? { ...prev.freeTrial, canUseLastInsightsView: false } : prev.freeTrial,
                      freeTrialLastInsightsViewedAt: new Date().toISOString(),
                      hasProAccess: false,
                    } : prev);
                  }}
                />
              }
              visibleBlockCount={visibleBlocks.length}
              claiming={isClaimingTrial}
              onClaimTrial={!isPro && profile.freeTrial?.eligible ? handleClaimFreeTrial : undefined}
              onUpgrade={() => setIsUpgradeModalOpen(true)}
              onScoreInfo={() => setIsScoreInfoOpen(true)}
              onAddBlock={(type) => { goTab("profile"); addBlock(type); }}
              onEditProfile={() => setIsProfileModalOpen(true)}
              onShare={() => { setShareCelebrate(false); setIsShareProfileOpen(true); }}
            />
          )}

          {tab === "settings" && (
            <SettingsTab
              profile={profile}
              isPro={isPro}
              initialSection={settingsSection}
              domainCard={
                <DomainConnectionCard
                  domain={domain}
                  currentDomain={profile.customDomain}
                  domainGuide={domainGuide}
                  verifying={verifying}
                  verificationResult={verificationResult}
                  onDomainChange={(value) => { setDomain(value); setVerificationResult(null); }}
                  onSave={() => handleUpdateDomain(domain)}
                  onVerify={handleVerify}
                />
              }
              referrals={<ReferralDashboard profile={profile} />}
              onUpgrade={() => setIsUpgradeModalOpen(true)}
              onEditAccount={() => { void changeScope(() => setSelectedSubSiteId(null)).then((ok) => { if (ok) setIsProfileModalOpen(true); }); }}
              onLinktree={() => setIsLinktreeRefactorOpen(true)}
              onLogout={handleLogout}
              onCreateSubsite={() => setIsCreateSubSiteOpen(true)}
              onOpenSubsite={openSubsite}
              onDeleteSubsite={handleDeleteSubSite}
              onMcp={() => setIsMcpOpen(true)}
              onNewsletter={toggleNewsletter}
              onFeedback={() => setIsFeedbackOpen(true)}
              onDeleteAccount={() => setIsDeleteAccountOpen(true)}
            />
          )}
        </div>
      </main>

      <MobileTabBar tab={tab} onTab={goTab} statsLocked={!canSeeInsights} accentColor={profile.accentColor} />

      {/* Diseño en pantallas chicas: cajón desde la derecha */}
      <AnimatePresence>
        {isDesignOpen && (
          <div className="fixed inset-0 z-[220] xl:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsDesignOpen(false)} />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-y-0 right-0 flex w-[min(340px,92vw)] flex-col border-l border-white/10 bg-[#0b0b0c]"
              aria-label={t("shell.design")}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-[15px] font-extrabold tracking-tight text-white">{t("shell.design")}</h2>
                <button type="button" onClick={() => setIsDesignOpen(false)} aria-label={t("shell.closeDesign")} className="grid h-9 w-9 place-items-center rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="custom-scrollbar flex-1 overflow-y-auto p-5">{designPanel}</div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {editingBlock && (
        <BlockEditorModal 
          block={editingBlock} 
          isOpen={!!editingBlock} 
          onClose={() => setEditingBlock(null)} 
          onSave={updateBlock}
          onRequestDelete={editingBlock.type === "project" ? () => {
            const id = editingBlock.id;
            setEditingBlock(null);
            setIsDeletingId(id);
          } : undefined}
          accentColor={profile?.accentColor || "#C8FF00"} 
        />
      )}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <McpAccessModal isOpen={isMcpOpen} onClose={() => setIsMcpOpen(false)} />
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
      {(() => {
        const deletingBlock = profile.blocks.find((block) => block.id === isDeletingId);
        const deletingProject = deletingBlock?.type === "project";
        const projectTitle = deletingProject && "title" in deletingBlock ? deletingBlock.title : "";
        return (
          <ConfirmDeleteDialog
            open={!!isDeletingId}
            title={deletingProject ? t("page.deleteProjectConfirmTitle") : t("page.deleteBlockConfirmTitle")}
            body={deletingProject
              ? t("page.deleteProjectConfirmBody", { title: projectTitle || t("page.deleteProjectFallback") })
              : t("page.actionCannotBeUndone")}
            cancelLabel={t("page.cancel")}
            confirmLabel={deletingProject ? t("page.deleteProject") : t("page.delete")}
            pending={isDeletePending}
            onCancel={() => {
              if (!isDeletePending) setIsDeletingId(null);
            }}
            onConfirm={confirmDeleteBlock}
          />
        );
      })()}
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

      <Celebrations profile={profile} onShare={() => { setShareCelebrate(false); setIsShareProfileOpen(true); }} />

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

      <ProFeatureTour
        isOpen={isProTourOpen}
        onClose={() => setIsProTourOpen(false)}
        accentColor={profile.accentColor}
        onFinish={() => {
          setIsProTourOpen(false);
          goTab("stats");
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

      {!isProTourOpen && <TestimonialNudgeToast username={profile.username} />}
    </div>
  );
}
