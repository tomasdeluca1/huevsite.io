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
  Save, Eye, Layout as LayoutIcon, Settings, LogOut, Plus, Sparkles, MessageSquare,
  Activity, Compass, Trash2, Copy, Check, Trophy, ArrowUpRight, BadgeCheck, ArrowLeft, Lock, Globe, ChevronRight,
  Globe2, AlertCircle, SendHorizontal, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { MOCK_PROFILE } from "@/lib/mock-profile";
import { BlockData, BlockType, ProfileData, PRESET_COLORS, getContrastColor, isDarkColor } from "@/lib/profile-types";
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
import { ColorPicker } from "@/components/dashboard/ColorPicker";
import { FeedbackModal } from "@/components/dashboard/FeedbackModal";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ScoreInfoModal } from "@/components/social/ScoreInfoModal";
import { ProSettingsModal } from "@/components/dashboard/ProSettingsModal";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { InsightsTab } from "@/components/dashboard/InsightsTab";
import { CreateSubSiteModal } from "@/components/dashboard/CreateSubSiteModal";
import { TwitterWarning } from "@/components/dashboard/TwitterWarning";
import { PriceBanner } from "@/components/marketing/PriceBanner";
import { ReferralDashboard } from "@/components/dashboard/ReferralDashboard";
import { GitHubData, OnboardingCompletionData, Role, LayoutOption } from "@/lib/onboarding-types";

export default function DashboardPage() {
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
  const [isProSettingsOpen, setIsProSettingsOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCreateSubSiteOpen, setIsCreateSubSiteOpen] = useState(false);
  const [tempProfileData, setTempProfileData] = useState({
    username: '',
    display_name: '',
    tagline: '',
    avatarUrl: '',
    githubHandle: ''
  });
  const [copied, setCopied] = useState(false);
  const [selectedSubSiteId, setSelectedSubSiteId] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("huevsite_autosave") === "true" : false));
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedVersionRef = useRef<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'insights' | 'subsites' | 'domain' | 'transfer'>('board');
  const [domain, setDomain] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; message: string } | null>(null);
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const supabase = createClient();
  const referralsSectionRef = useRef<HTMLDivElement | null>(null);

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

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');

      if (!response.ok) {
        if (response.status === 404) {
          window.location.href = '/welcome';
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();

      const transformedProfile: ProfileData = {
        id: data.profile.id,
        username: data.profile.username,
        displayName: data.profile.name || data.profile.username,
        accentColor: data.profile.accent_color,
        roles: data.profile.roles || [],
        layout: data.profile.layout || null,
        subscriptionTier: (data.profile.subscription_tier === 'pro' || !!data.profile.pro_since) ? 'pro' : 'free',
        extraBlocksFromShare: data.profile.extra_blocks_from_share || 0,
        twitterShareUnlocked: data.profile.twitter_share_unlocked || false,
        hasSeenUpdateFeb25: data.profile.has_seen_update_feb25 || false,
        tagline: data.profile.tagline || "",
        avatarUrl: data.profile.image || "",
        githubHandle: data.profile.github_handle || "",
        builderScore: data.profile.builder_score || 0,
        aiCredits: data.profile.ai_credits || 0,
        isOnboardingTestUser: data.profile.is_onboarding_test_user || false,
        customDomain: data.profile.custom_domain || "",
        referralCode: data.profile.referral_code || "",
        referredBy: data.profile.referred_by || "",
        proReferralsCount: data.profile.pro_referrals_count || 0,
        referralRewardExpiresAt: data.profile.referral_reward_expires_at || null,
        subSites: normalizeSubSites(data.subSites || []),
        blocks: data.blocks.map((block: any) => {
          const { id: _, type: __, order: ___, col_span: ____, row_span: _____, visible: ______, ...cleanData } = block.data || {};
          return {
            id: block.id,
            type: block.type as BlockType,
            order: block.order,
            col_span: block.col_span,
            row_span: block.row_span,
            visible: block.visible,
            ...cleanData
          };
        })
      };

      setProfile(transformedProfile);
      setTempProfileData({
        username: transformedProfile.username,
        display_name: transformedProfile.displayName,
        tagline: transformedProfile.tagline || '',
        avatarUrl: transformedProfile.avatarUrl || '',
        githubHandle: transformedProfile.githubHandle || ''
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

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "insights" || tab === "subsites" || tab === "domain" || tab === "transfer" || tab === "board") {
      setActiveTab(tab);
    }
  }, []);

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

  const removeBlock = async (id: string) => {
    if (!id.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/blocks/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          alert(`Error al eliminar bloque: ${errorData.error || 'Error desconocido'}`);
          return;
        }
      } catch (error) {
        console.error('Error deleting block:', error);
        alert('Error de red al eliminar bloque');
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

  const addBlock = async (type: BlockType) => {
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

    setProfile((prev) => prev ? { ...prev, blocks: [...prev.blocks, initialData as BlockData] } : prev);

    try {
      const { id, type: blockType, order, col_span, row_span, visible, ...blockSpecificData } = initialData;
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
        }),
      });

      if (!response.ok) {
        setProfile((prev) => prev ? { ...prev, blocks: prev.blocks.filter(b => b.id !== newId) } : prev);
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
    setProfile((prev) => prev ? {
      ...prev,
      blocks: prev.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b)
    } : prev);

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
          Bloque fantasma
        </div>
      );
    }
  };

  const handleColorChange = async (color: string, confirmed: boolean) => {
    setProfile(prev => prev ? { ...prev, accentColor: color } : null);
    if (confirmed) {
      try {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accent_color: color }),
        });
      } catch (e) {
        console.error('Error saving color:', e);
      }
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
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      setVerificationResult({ isValid: data.isValid, message: data.message });
      if (data.isValid) alert("¡Dominio verificado!");
      else alert(data.message || "Propagación pendiente.");
    } catch (error) {
      setVerificationResult({ isValid: false, message: "Error" });
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateDomain = async (domain: string) => {
    try {
      const resp = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_domain: domain }),
      });
      if (!resp.ok) throw new Error('Error domain update');
      setProfile(prev => prev ? { ...prev, customDomain: domain } : null);
    } catch (e: any) {
      alert('Error guardando dominio.');
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
    if (!confirm('¿Borrar board?')) return;
    try {
      const resp = await fetch(`/api/sub-sites/${id}`, { method: 'DELETE' });
      if (resp.ok) setProfile(prev => prev ? { ...prev, subSites: prev.subSites.filter(s => s.id !== id) } : null);
    } catch (e) { console.error(e); }
  };

  const handleOnboardingComplete = async (data: OnboardingCompletionData & { blocks: BlockData[] }) => {
    const managedBlockTypes = new Set(["hero", "github", "social", "metric", "stack"]);
    const nextDisplayName = data.githubData?.name || profile?.displayName || data.username;
    const nextTagline = data.githubData?.bio || profile?.tagline || "";
    const nextAvatar = data.githubData?.avatarUrl || profile?.avatarUrl || "";

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
    alert("Función inhabilitada temporalmente.");
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
            tagline: site.description || '',
            avatarUrl: site.avatarUrl || '',
            githubHandle: ''
          });
          return;
        }
      }
      
      setTempProfileData({
        username: profile.username || '',
        display_name: profile.displayName || '',
        tagline: profile.tagline || '',
        avatarUrl: profile.avatarUrl || '',
        githubHandle: profile.githubHandle || ''
      });
    }
  }, [isProfileModalOpen, profile, selectedSubSiteId]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] font-display">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-6 border border-[var(--border-bright)] animate-pulse mx-auto">
            <Sparkles size={32} className="text-[var(--accent)] animate-spin" />
          </div>
          <p className="text-[var(--text-dim)] font-mono text-sm">Cargando...</p>
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
        setIsProSettingsOpen={setIsProSettingsOpen}
        setIsCreateSubSiteOpen={setIsCreateSubSiteOpen}
        setIsUpgradeModalOpen={setIsUpgradeModalOpen}
        setIsFeedbackOpen={setIsFeedbackOpen}
        setTempProfileData={setTempProfileData}
        addBlock={addBlock}
        handleColorChange={handleColorChange}
        toggleAutoSave={toggleAutoSave}
        autoSaveEnabled={autoSaveEnabled}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onShareUnlocked={() => {
          setProfile(prev => prev ? { ...prev, twitterShareUnlocked: true, extraBlocksFromShare: (prev.extraBlocksFromShare || 0) + 3 } : null);
        }}
      />

      <main className={`flex-1 min-w-0 h-full overflow-y-auto p-4 md:px-8 lg:px-10 relative z-0 custom-scrollbar ${
        profile.subscriptionTier === 'pro'
          ? 'pt-6 md:pb-8 md:pt-6 lg:pb-10 lg:pt-8'
          : 'md:pb-8 md:pt-0 lg:pb-10'
      }`}>
        <style dangerouslySetInnerHTML={{
          __html: `:root { --accent: ${profile.accentColor}; --accent-dim: ${profile.accentColor}1f; --btn-border: ${isDarkColor(profile.accentColor) ? 'rgba(255,255,255,0.15)' : 'transparent'}; }`
        }} />
        <div className="absolute top-0 right-0 w-full lg:w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.03)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-[1600px] mx-auto relative">
          <div className="absolute inset-x-6 top-0 h-24 md:h-32 bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.12)_0%,transparent_72%)] blur-3xl pointer-events-none opacity-70" />
          {profile.subscriptionTier !== 'pro' && (
            <div className="relative z-20 mb-6 md:mb-8 lg:mb-10">
              <PriceBanner className="top-0 sm:top-2" />
            </div>
          )}

          <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 lg:gap-8 mb-8 md:mb-12 items-center lg:text-left text-center px-2 md:px-0 relative z-[999]">
          <div className="w-full md:w-auto relative">
            <TwitterWarning blocks={profile.blocks} isSubSite={Boolean(selectedSubSiteId)} />
            <div className="mb-3 hidden md:block"><div className="section-label">// dashboard / {activeTab}</div></div>
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-[950] tracking-tighter leading-[0.94] text-balance">
              {activeTab === 'board' ? <>Armá tu <span style={{ color: profile.accentColor }}>{selectedSubSiteId ? (profile.subSites.find(s => s.id === selectedSubSiteId)?.title || "Board") : "huevsite"}</span>.</> :
               activeTab === 'insights' ? <>Tus <span style={{ color: profile.accentColor }}>Insights</span>.</> :
               activeTab === 'domain' ? <>Tu <span style={{ color: profile.accentColor }}>Dominio</span>.</> :
               activeTab === 'subsites' ? <>Tus <span style={{ color: profile.accentColor }}>Sub-sites</span>.</> :
               <>Transferí tu <span style={{ color: profile.accentColor }}>Proyecto</span>.</>}
            </h2>
          </div>
          {activeTab === 'board' && (
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:flex lg:items-center">
              <Link href={selectedSubSiteId ? `/${profile.username}/${profile.subSites.find(s => s.id === selectedSubSiteId)?.slug}` : `/${profile.username}`} target="_blank" className="btn-premium flex items-center justify-center gap-2 py-3 px-5 lg:px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-bold text-sm transition-all hover:bg-white/5 hover:border-white/20 min-w-0"><Eye size={18} className="text-white/40 shrink-0" /><span>Ver</span></Link>
              <button onClick={handleSave} disabled={isSaving} className="btn-premium flex items-center justify-center gap-2 py-3 px-6 lg:px-10 rounded-2xl text-black font-[900] text-sm transition-all shadow-xl min-w-0" style={{ backgroundColor: profile.accentColor, color: getContrastColor(profile.accentColor) }}>
                {isSaving ? <Sparkles size={18} className="animate-spin" /> : <Save size={18} />}<span>{isSaving ? 'Guardando' : 'Guardar'}</span>
              </button>
            </div>
          )}
          </header>
        </div>

        <div className="max-w-[1600px] mx-auto pb-32">
          {/* DESKTOP TABS */}
          <div className="hidden md:flex relative mb-16 z-20 items-center justify-center">
            <div className="flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl overflow-x-auto scrollbar-none max-w-full w-fit">
              {(['board', 'insights', 'subsites', 'domain', 'transfer'] as const).map((t) => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t)} 
                  className={`px-4 lg:px-8 py-3 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.18em] transition-all relative shrink-0 ${activeTab === t ? 'text-black' : 'text-white/20 hover:text-white/60 hover:bg-white/[0.03]'}`}
                >
                  {activeTab === t && (
                    <motion.div 
                      layoutId="activeTabSel" 
                      className="absolute inset-0 bg-[var(--accent)] rounded-[2rem] shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]" 
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} 
                    />
                  )}
                  <span className="relative z-10">{t === 'board' ? 'Editor' : t === 'insights' ? 'Insights' : t === 'subsites' ? 'Sub-sites' : t === 'domain' ? 'Dominio' : 'Transferir'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MOBILE DROPDOWN */}
          <div className="md:hidden relative mb-10 z-30 px-4">
             <button 
                onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
                className="w-full bg-white/[0.05] border border-white/10 p-5 rounded-[2rem] flex items-center justify-between text-white group active:scale-95 transition-all"
             >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]">
                      {activeTab === 'board' ? <LayoutIcon size={18} /> : 
                       activeTab === 'insights' ? <Activity size={18} /> :
                       activeTab === 'subsites' ? <Compass size={18} /> :
                       activeTab === 'domain' ? <Globe size={18} /> : <ArrowUpRight size={18} />}
                   </div>
                   <div className="text-left">
                      <span className="text-[10px] block font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Vista Activa</span>
                      <span className="text-sm font-black uppercase tracking-widest">
                        {activeTab === 'board' ? 'Editor' : activeTab === 'insights' ? 'Insights' : activeTab === 'subsites' ? 'Sub-sites' : activeTab === 'domain' ? 'Dominio' : 'Transferir'}
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
                         className="relative bg-[#121214] border border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl p-3"
                      >
                         {(['board', 'insights', 'subsites', 'domain', 'transfer'] as const).map((t) => (
                            <button
                               key={t}
                               onClick={() => { setActiveTab(t); setIsTabMenuOpen(false); }}
                               className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === t ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                               <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeTab === t ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-white/30'}`}>
                                  {t === 'board' ? <LayoutIcon size={16} /> : 
                                   t === 'insights' ? <Activity size={16} /> :
                                   t === 'subsites' ? <Compass size={16} /> :
                                   t === 'domain' ? <Globe size={16} /> : <ArrowUpRight size={16} />}
                               </div>
                               <span className={`text-xs font-black uppercase tracking-[0.1em] ${activeTab === t ? 'text-white' : 'text-white/40'}`}>
                                  {t === 'board' ? 'Editor' : t === 'insights' ? 'Insights' : t === 'subsites' ? 'Sub-sites' : t === 'domain' ? 'Dominio' : 'Transferir'}
                               </span>
                               {activeTab === t && <Check size={14} className="ml-auto text-[var(--accent)]" />}
                            </button>
                         ))}
                      </motion.div>
                   </div>
                )}
             </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'board' && (
              <motion.div key="board" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                <div className="mb-6 md:mb-8 lg:mb-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
                  <div className="rounded-[2rem] border border-white/[0.06] bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-5 py-4 md:px-6 md:py-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <p className="text-[10px] uppercase tracking-[0.22em] font-black text-white/25 mb-2">Board Editor</p>
                    <p className="text-sm md:text-base text-white/65 max-w-3xl text-balance">
                      Arrastrá bloques, ajustá su tamaño y ordená la composición para que el board se sienta consistente en mobile, tablet y desktop.
                    </p>
                  </div>
                  <div className="hidden xl:flex items-center gap-2 rounded-[2rem] border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: profile.accentColor }} />
                    {profile.blocks.length} bloques activos
                  </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={profile.blocks.map(b => b.id)} strategy={rectSortingStrategy}>
                    <div className="dashboard-board-grid huevsite-grid min-h-[560px] md:min-h-[620px] p-3 sm:p-6 lg:p-8 xl:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      {profile.blocks.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-40 text-center text-white/20 font-bold uppercase tracking-widest text-sm">
                          <Plus className="mb-4 opacity-30" size={40} />
                          Agregá tu primer bloque
                        </div>
                      ) : (
                        profile.blocks.map((block) => (
                          <SortableBlock 
                            key={block.id} 
                            id={block.id} 
                            block={block} 
                            onRemove={(id) => setIsDeletingId(id)} 
                            onEdit={(b) => setEditingBlock(b)} 
                            onResize={(id, colSpan, rowSpan) => updateBlock({ ...block, col_span: colSpan, row_span: rowSpan })}
                          >
                            {renderBlockContent(block)}
                          </SortableBlock>
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>

                {profile.subscriptionTier !== 'pro' && (
                  <div ref={referralsSectionRef} className="mt-12 max-w-[1200px] mx-auto scroll-mt-28">
                     <ReferralDashboard profile={profile} />
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'insights' && (
              <motion.div key="insights" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} className="max-w-5xl mx-auto px-2">
                <InsightsTab
                  accentColor={profile.accentColor}
                  blocks={profile.blocks}
                  onOptimizeBoard={() => setActiveTab('board')}
                />
              </motion.div>
            )}

            {activeTab === 'domain' && (
              <motion.div key="domain" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-xl mx-auto space-y-8 md:space-y-12 px-4">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl md:text-3xl font-[950] tracking-tighter text-white">Conectá tu Marca.</h3>
                  <p className="text-white/40 text-xs md:text-sm">Usá tu dominio propio para una presencia 100% profesional.</p>
                </div>
                <div className="space-y-4 md:space-y-6">
                  <div className="relative group">
                    <Globe className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--accent)] transition-all size-5 md:size-6" />
                    <input 
                      value={domain} 
                      onChange={(e) => setDomain(e.target.value)} 
                      placeholder="tudominio.com" 
                      className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] pl-14 md:pl-16 pr-6 md:pr-8 py-5 md:py-6 text-lg md:text-xl font-bold focus:outline-none focus:border-[var(--accent)] transition-all" 
                    />
                  </div>
                  <button onClick={() => handleUpdateDomain(domain)} className="w-full py-5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] bg-[var(--accent)] text-black font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-xs md:text-sm">Vincular Dominio</button>
                </div>
                {profile.customDomain && (
                  <div className="pt-8 md:pt-10 border-t border-white/5 space-y-6">
                    <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2">
                       <span className="text-white/20">DNS Records</span>
                       <button onClick={handleVerify} disabled={verifying} className="text-[var(--accent)] hover:brightness-125 transition-all disabled:opacity-30">{verifying ? 'Verificando...' : 'Check Status'}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                       <div onClick={() => { navigator.clipboard.writeText("76.76.21.21"); alert("Copiado!"); }} className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-all">
                          <p className="text-[8px] md:text-[9px] font-black text-white/20 mb-2 uppercase">Registro A</p>
                          <code className="text-white font-mono text-xs md:text-sm">76.76.21.21</code>
                       </div>
                       <div onClick={() => { navigator.clipboard.writeText("nodes.huevsite.io"); alert("Copiado!"); }} className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-all">
                          <p className="text-[8px] md:text-[9px] font-black text-white/20 mb-2 uppercase">CNAME</p>
                          <code className="text-white font-mono text-xs md:text-sm uppercase truncate block">nodes.huevsite.io</code>
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'subsites' && (
              <motion.div key="subsites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8 md:space-y-12 px-4">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <h3 className="text-2xl font-black text-white text-center sm:text-left">Tus Proyectos</h3>
                   <button onClick={() => setIsCreateSubSiteOpen(true)} className="flex items-center justify-center gap-2 bg-[var(--accent)]/10 text-[var(--accent)] px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-all">
                     <Plus size={16} /> Crear Sub-site
                   </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.subSites.length === 0 ? (
                      <div className="col-span-full py-20 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[2.5rem]">
                        <p className="text-white/20 font-black uppercase text-[10px] tracking-[0.2em]">No tenés sub-sites creados aún.</p>
                      </div>
                    ) : (
                      profile.subSites.map(site => (
                        <div key={site.id} className="p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-between group">
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
                      <h4 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tighter">Feature Inhabilitada</h4>
                      <p className="text-white/40 text-[10px] font-bold font-mono uppercase tracking-widest">Próximamente disponible para PRO</p>
                   </div>
                </div>
                <div className="space-y-4 filter blur-md pointer-events-none">
                  <h3 className="text-3xl font-[950] tracking-tighter text-white">Transferir Proyecto.</h3>
                  <p className="text-white/40 text-sm">Entregá la propiedad total de este board a otro usuario.</p>
                </div>
                <div className="space-y-6 filter blur-md pointer-events-none">
                  <div className="relative">
                    <SendHorizontal className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                    <input disabled value={transferEmail} placeholder="email@receptor.com" className="w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] pl-16 pr-8 py-6 text-xl font-bold" />
                  </div>
                  <button disabled className="w-full py-6 rounded-[2rem] bg-white/10 text-white/20 font-black uppercase tracking-widest">Confirmar Transferencia</button>
                </div>
                <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 text-amber-500/60 text-[10px] font-bold italic flex items-center gap-3 filter blur-md pointer-events-none">
                  <AlertCircle size={16} /> Esta acción es definitiva e irreversible.
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
      <AnimatePresence>{isDeletingId && <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsDeletingId(null)} /><motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-sm bg-[var(--surface)] border border-red-500/30 rounded-[2rem] shadow-2xl p-8 z-[510] text-center"><div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 text-red-500"><Trash2 size={32} /></div><h3 className="text-2xl font-black mb-3 text-white">¿Borrar bloque?</h3><p className="text-[var(--text-dim)] mb-8 text-sm leading-relaxed">Esta acción no se puede deshacer.</p><div className="flex gap-3"><button onClick={() => setIsDeletingId(null)} className="flex-1 py-3.5 rounded-2xl bg-[var(--surface2)] font-bold text-sm text-white">Cancelar</button><button onClick={() => { removeBlock(isDeletingId); setIsDeletingId(null); }} className="flex-1 py-3.5 rounded-2xl bg-red-500 font-bold text-sm text-white transition-all">Eliminar</button></div></motion.div></div>}</AnimatePresence>
      <AnimatePresence>{isProfileModalOpen && <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfileModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" /><motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-md bg-[var(--surface)] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-[510] p-8 pt-10"><div className="text-center mb-8"><div className="section-label mb-2 mx-auto w-fit">// identidad {selectedSubSiteId ? '(sub-site)' : ''}</div><h3 className="text-2xl font-black tracking-tighter">Editar {selectedSubSiteId ? 'Sub-site' : 'Perfil'}</h3></div><div className="space-y-6"><div className="space-y-2"><label className="text-[10px] uppercase font-mono tracking-widest text-white/40 px-1">URL del {selectedSubSiteId ? 'Sub-site' : 'Perfil'}</label><div className="flex items-center gap-2 p-4 rounded-2xl bg-black/40 border border-white/10 focus-within:border-[var(--accent)] transition-all font-mono"><span className="text-xs text-white/20">huevsite.io/{selectedSubSiteId ? `${profile.username}/` : ''}</span><input value={tempProfileData.username} onChange={(e) => setTempProfileData(p => ({ ...p, username: e.target.value.toLowerCase() }))} className="bg-transparent border-none outline-none text-sm font-black text-[var(--accent)] flex-1 p-0" /></div></div><div className="space-y-2"><label className="text-[10px] uppercase font-mono tracking-widest text-white/40 px-1 font-bold">Foto (URL)</label><input value={tempProfileData.avatarUrl} onChange={(e) => setTempProfileData(p => ({ ...p, avatarUrl: e.target.value }))} className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none text-sm text-white/60 focus:border-[var(--accent)] transition-all font-mono" /></div><div className="space-y-4 pt-2"><div className="space-y-2"><label className="text-[10px] uppercase font-mono tracking-widest text-white/40 px-1 font-bold">Nombre</label><input value={tempProfileData.display_name} onChange={(e) => setTempProfileData(p => ({ ...p, display_name: e.target.value }))} className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none text-sm font-black text-white focus:border-[var(--accent)] transition-all" /></div><div className="space-y-2"><label className="text-[10px] uppercase font-mono tracking-widest text-white/40 px-1 font-bold">{selectedSubSiteId ? 'Descripción' : 'Tagline'}</label><input value={tempProfileData.tagline} onChange={(e) => setTempProfileData(p => ({ ...p, tagline: e.target.value }))} className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none text-sm text-white/60 focus:border-[var(--accent)] transition-all" /></div></div></div><div className="flex gap-4 mt-10"><button onClick={() => setIsProfileModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-white/30 hover:text-white transition-colors">Cancelar</button><button onClick={async () => { 
        if (selectedSubSiteId) {
          await handleUpdateSubSite(selectedSubSiteId, {
            title: tempProfileData.display_name,
            slug: tempProfileData.username,
            description: tempProfileData.tagline,
            avatarUrl: tempProfileData.avatarUrl
          });
        } else {
          setProfile(prev => prev ? { ...prev, username: tempProfileData.username, displayName: tempProfileData.display_name, tagline: tempProfileData.tagline, avatarUrl: tempProfileData.avatarUrl } : null); 
          await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: tempProfileData.username, name: tempProfileData.display_name, tagline: tempProfileData.tagline, image: tempProfileData.avatarUrl }) });
        }
        setIsProfileModalOpen(false); 
      }} className="flex-[2] py-4 rounded-2xl bg-[var(--accent)] text-black font-black text-sm shadow-xl" style={{ backgroundColor: profile.accentColor, color: getContrastColor(profile.accentColor) }}>Guardar</button></div></motion.div></div>}</AnimatePresence>
      <ScoreInfoModal isOpen={isScoreInfoOpen} onClose={() => setIsScoreInfoOpen(false)} accentColor={profile.accentColor} profileId={profile.id} />
      <ProSettingsModal
        isOpen={isProSettingsOpen}
        onClose={() => setIsProSettingsOpen(false)}
        accentColor={profile.accentColor}
        subSites={profile.subSites}
        blocks={profile.blocks}
        customDomain={profile.customDomain}
        onUpdateDomain={handleUpdateDomain}
        onAddSubSite={handleAddSubSite}
        onUpdateSubSite={handleUpdateSubSite}
        onDeleteSubSite={handleDeleteSubSite}
        onTransferProject={handleTransferProject}
        username={profile.username}
      />

      <CreateSubSiteModal
        isOpen={isCreateSubSiteOpen}
        onClose={() => setIsCreateSubSiteOpen(false)}
        accentColor={profile.accentColor}
        onAddSubSite={handleAddSubSite}
        username={profile.username}
      />
      {isUpgradeModalOpen && <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} accentColor={profile.accentColor} />}
    </div>
  );
}
