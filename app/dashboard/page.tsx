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
  Activity, Compass, Trash2, Copy, Check, Trophy, ArrowUpRight, BadgeCheck, ArrowLeft, Lock, Globe
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
import { MediaBlock, CertificationBlock, AchievementBlock, CustomBlock, CollabBlock } from "@/components/blocks/NewBlocks";
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
  const supabase = createClient();

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

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');

        if (!response.ok) {
          if (response.status === 404) {
            // Usuario autenticado pero sin perfil (posiblemente borrado por el cambio de schema)
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
          subscriptionTier: (data.profile.subscription_tier === 'pro' || !!data.profile.pro_since) ? 'pro' : 'free',
          extraBlocksFromShare: data.profile.extra_blocks_from_share || 0,
          twitterShareUnlocked: data.profile.twitter_share_unlocked || false,
          hasSeenUpdateFeb25: data.profile.has_seen_update_feb25 || false,
          tagline: data.profile.tagline || "",
          avatarUrl: data.profile.image || "",
          githubHandle: data.profile.github_handle || "",
          builderScore: data.profile.builder_score || 0,
          customDomain: data.profile.custom_domain || "",
          subSites: data.subSites || [],
          blocks: data.blocks.map((block: any) => {
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
          })
        };

        setProfile(transformedProfile);

        // Initializing last saved version to avoid immediate autosave on load
        const { builderScore, ...content } = transformedProfile;
        lastSavedVersionRef.current = JSON.stringify(content);
        if (transformedProfile.blocks.length === 0) {
          const hasSeen = localStorage.getItem("huevsite_onboarding_seen");
          if (!hasSeen) {
            setIsOnboardingOpen(true);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Quitamos el fallback al MOCK_PROFILE para que no muestre data "hardcodeada"
        // Si no hay sesión o falla con 401, redirigimos al login
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch blocks when switching sub-sites
  useEffect(() => {
    if (!profile) return;

    const fetchBlocks = async () => {
      setLoading(true);
      try {
        const url = selectedSubSiteId
          ? `/api/sub-sites/${selectedSubSiteId}/blocks`
          : '/api/profile'; // Get main profile blocks

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

    // Skip the very first fetch on mount because fetchProfile already does it for main site
    if (selectedSubSiteId !== null) {
      fetchBlocks();
    } else if (profile?.blocks.length === 0 && !loading) {
      // if main site was empty, maybe re-fetch or keep empty? 
      // Better to let fetchProfile handle the first one.
    }
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
    console.log('removeBlock called with id:', id);

    // Eliminar del backend primero si no es temporal
    if (!id.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/blocks/${id}`, {
          method: 'DELETE',
        });

        console.log('DELETE response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('DELETE failed:', errorData);
          alert(`Error al eliminar bloque: ${errorData.error || 'Error desconocido'}`);
          return; // No eliminar localmente si falló en el backend
        }

        const result = await response.json();
        console.log('DELETE success:', result);
      } catch (error) {
        console.error('Error deleting block:', error);
        alert('Error de red al eliminar bloque');
        return; // No eliminar localmente si hay error de red
      }
    }

    // Eliminar localmente solo si el backend tuvo éxito (o es temporal)
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

    // Determinar col_span y row_span según el tipo
    const colSpan = type === "hero" ? 2 : (type === "github" || type === "project" ? 1 : 1);
    const rowSpan = type === "hero" ? 2 : (type === "github" || type === "project" ? 2 : 1);

    // Crear data inicial según el tipo
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
          stats: {
            stars: 0,
            repos: 0,
            followers: 0,
          },
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
          users: [
            { username: "ejemplo", role: "Co-founder" }
          ]
        };
        break;
    }

    // Agregar el bloque localmente primero
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: [...prev.blocks, initialData as BlockData]
      };
    });

    // Crear en el backend
    try {
      // Separar metadata de data específica del bloque
      const { id, type: blockType, order, col_span, row_span, visible, ...blockSpecificData } = initialData;

      console.log('POST block payload:', { type, colSpan, rowSpan, data: blockSpecificData });

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

      console.log('POST response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('POST failed:', errorData);
        alert(`Error al crear bloque: ${errorData.error || 'Error desconocido'}`);
        // Remover el bloque temporal ya que falló
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            blocks: prev.blocks.filter(b => b.id !== newId)
          };
        });
        return;
      }

      const { block } = await response.json();
      console.log('POST success:', block);

      // Actualizar con el ID real del backend
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          blocks: prev.blocks.map(b =>
            b.id === newId
              ? { ...b, id: block.id }
              : b
          )
        };
      });

      // Asignar el bloque al modal usando el ID real que nos dio Supabase
      setEditingBlock({ ...initialData, id: block.id } as BlockData);
    } catch (error) {
      console.error('Error creating block:', error);
      alert('Error de red al crear bloque');
      // Remover el bloque temporal ya que falló
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          blocks: prev.blocks.filter(b => b.id !== newId)
        };
      });
      return;
    }
  };

  const updateBlock = async (updatedBlock: BlockData) => {
    console.log('updateBlock called:', updatedBlock);

    // Actualizar localmente primero (para feedback inmediato)
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b)
      };
    });

    // Actualizar en el backend si no es temporal
    if (!updatedBlock.id.startsWith('temp-')) {
      try {
        // Separar campos de ID que no se deben enviar del resto
        const { id, ...updatePayload } = updatedBlock;

        console.log('PATCH payload:', updatePayload);

        // El endpoint /api/blocks/[id] se encarga de separar
        // campos PG (type, order, col_span, etc) de campos del JSONB data
        const response = await fetch(`/api/blocks/${updatedBlock.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        console.log('PATCH response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('PATCH failed:', errorData);
          alert(`Error al actualizar bloque: ${errorData.error || 'Error desconocido'}`);
          return;
        }

        const result = await response.json();
        console.log('PATCH success:', result);
      } catch (error) {
        console.error('Error updating block:', error);
        alert('Error de red al actualizar bloque');
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
      default: return (
        <div className="huevsite-block h-full flex items-center justify-center p-8 border-dashed border-[var(--border-bright)]">
          <p className="text-xs text-[var(--text-dim)] font-mono text-center">Bloque fantasma 🇦🇷</p>
        </div>
      );
    }
  };

  const handleColorChange = async (color: string, confirmed: boolean) => {
    // Siempre aplicar preview en vivo (cambia el CSS var localmente en estado)
    setProfile(prev => prev ? { ...prev, accentColor: color } : null);

    if (confirmed) {
      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, accentColor: color };
      });

      // Persistir en backend
      try {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accent_color: color,
          }),
        });
      } catch (e) {
        console.error('Error saving color:', e);
      }
    }
  };

  const handleProfileDetailChange = (field: 'username' | 'name' | 'tagline', value: string) => {
    setProfile(prev => prev ? { ...prev, [field === 'name' ? 'displayName' : field]: value } : null);

    // Auto-save logic handles persistence
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      // Save profile metadata
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accent_color: profile.accentColor,
          username: profile.username,
          name: profile.displayName,
          tagline: profile.tagline,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile?.builder_score !== undefined) {
          setProfile(prev => prev ? { ...prev, builderScore: data.profile.builder_score } : prev);
        }
      }

      // Save blocks order (ignoring temporary ones that haven't been created yet)
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

  const handleUpdateDomain = async (domain: string) => {
    try {
      const resp = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_domain: domain }),
      });
      if (resp.ok) {
        setProfile(prev => prev ? { ...prev, customDomain: domain } : null);
      }
    } catch (e) {
      console.error('Error updating domain:', e);
    }
  };

  const handleAddSubSite = async (title: string, slug: string) => {
    try {
      const resp = await fetch('/api/sub-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug }),
      });
      if (resp.ok) {
        const { subSite } = await resp.json();
        setProfile(prev => prev ? { ...prev, subSites: [subSite, ...(prev.subSites || [])] } : null);
      } else {
        const err = await resp.json();
        alert(err.error || 'No se pudo crear el sub-site');
      }
    } catch (e) {
      console.error('Error adding sub-site:', e);
    }
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
        const { subSite } = await resp.json();
        setProfile(prev => prev ? {
          ...prev,
          subSites: prev.subSites.map(s => s.id === id ? { ...s, ...subSite } : s)
        } : null);
      } else {
        const err = await resp.json();
        alert(err.error || 'No se pudo actualizar el sub-site');
      }
    } catch (e) {
      console.error('Error updating sub-site:', e);
    }
  };

  const handleDeleteSubSite = async (id: string) => {
    if (!confirm('¿Seguro que querés borrar este sub-site?')) return;
    try {
      const resp = await fetch(`/api/sub-sites/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        setProfile(prev => prev ? { ...prev, subSites: prev.subSites.filter(s => s.id !== id) } : null);
      }
    } catch (e) {
      console.error('Error deleting sub-site:', e);
    }
  };

  // Autosave with debounce (only if enabled)
  useEffect(() => {
    if (!profile || loading || !autoSaveEnabled) return;

    const { builderScore, ...content } = profile;
    const currentVersion = JSON.stringify(content);

    if (currentVersion === lastSavedVersionRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      lastSavedVersionRef.current = currentVersion;
      handleSave();
    }, 2000); // Higher debounce for safety

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
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
          <p className="text-[var(--text-dim)] font-mono text-sm">Cargando tu huevsite...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] font-display">
        <p className="text-[var(--text-dim)] font-mono text-sm">Error cargando perfil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg)] font-display overflow-x-hidden">
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-[100] backdrop-blur-md">
        <Link href="/" className="logo block text-lg font-extrabold tracking-tight">huev<span>site</span>.io</Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--accent)]"
          >
            <Settings size={20} />
          </button>
          <button onClick={handleLogout} className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[105] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR / DRAWER */}
      <aside className={`
        fixed inset-y-0 left-0 w-[280px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-6 
        flex flex-col gap-6 z-[110] transition-transform duration-300 ease-in-out custom-scrollbar overflow-y-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:fixed md:inset-y-0 md:left-0
      `}>
        <div className="hidden md:flex justify-between items-center mb-6">
          <Link href="/" className="logo block text-2xl font-extrabold tracking-tight">huev<span>site</span>.io</Link>
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-6">
            {selectedSubSiteId ? (
              // SUB-SITE DISPLAY IN SIDEBAR
              <div
                className="space-y-1.5 md:mb-4 bg-[var(--surface2)]/50 p-4 rounded-2xl border border-[var(--border)] relative transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 w-full p-0">
                  {profile.subSites.find(s => s.id === selectedSubSiteId)?.avatarUrl ? (
                    <img src={profile.subSites.find(s => s.id === selectedSubSiteId)?.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-xl object-cover bg-black" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-[var(--accent)] font-bold uppercase">
                      {profile.subSites.find(s => s.id === selectedSubSiteId)?.title.substring(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-black truncate text-[var(--accent)] w-full block">
                      {profile.subSites.find(s => s.id === selectedSubSiteId)?.title || "Sub-site"}
                    </div>
                    <div className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] mt-0.5">Ecosistema</div>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-black/30 border border-white/5 group/url mt-4`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">/{profile.username}/</span>
                    <span className="text-xs font-black truncate text-[var(--accent)] font-mono">
                      {profile.subSites.find(s => s.id === selectedSubSiteId)?.slug}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${profile.username}/${profile.subSites.find(s => s.id === selectedSubSiteId)?.slug}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all bg-white/5"
                    title="Copiar URL del sub-site"
                  >
                    {copied ? <Check size={12} className="text-[var(--accent)]" /> : <Copy size={12} />}
                  </button>
                </div>

                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setIsProSettingsOpen(true)}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-white hover:bg-white/10 hover:border-white/10 transition-all group"
                  >
                    <Settings size={14} className="text-[var(--accent)] group-hover:rotate-45 transition-transform" />
                    <span>Ajustes del Sitio</span>
                  </button>
                  <button
                    onClick={() => setSelectedSubSiteId(null)}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-bold text-[var(--text-dim)] hover:text-white hover:bg-white/5 transition-all group"
                  >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Volver al Principal</span>
                  </button>
                </div>
              </div>
            ) : (
              // MAIN PROFILE DISPLAY IN SIDEBAR
              <div
                onClick={() => {
                  setTempProfileData({
                    username: profile.username,
                    display_name: profile.displayName,
                    tagline: profile.tagline || '',
                    avatarUrl: profile.avatarUrl || '',
                    githubHandle: profile.githubHandle || ''
                  });
                  setIsProfileModalOpen(true);
                }}
                className="space-y-1.5 md:mb-4 bg-[var(--surface2)]/50 p-4 rounded-2xl border border-[var(--border)] relative group transition-all hover:border-[var(--border-bright)] cursor-pointer hover:bg-[var(--surface2)] shadow-sm"
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-mono text-[var(--accent)] tracking-widest uppercase pointer-events-none hidden md:block">
                  Editar
                </div>
                {!profile.blocks.some(b => b.type === 'hero') && (
                  <>
                    <div className="text-xl font-black truncate text-white w-full p-0">
                      {profile.displayName || "Tu Nombre"}
                    </div>
                    <div className="text-[11px] text-[var(--text-dim)] w-full p-0 block truncate font-mono uppercase tracking-tight opacity-70">
                      {profile.tagline || "Sin tagline"}
                    </div>
                  </>
                )}
                <div
                  className={`flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-black/30 border border-white/5 group/url mt-3`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">huevsite.io/</span>
                    <span className="text-xs font-black truncate text-[var(--accent)] font-mono">
                      {profile.username}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUrl();
                    }}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all bg-white/5"
                    title="Copiar URL"
                  >
                    {copied ? <Check size={12} className="text-[var(--accent)]" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            )}

            <ColorPicker
              value={profile.accentColor}
              onChange={handleColorChange}
              subscriptionTier={profile.subscriptionTier}
            />

            <div className="h-px bg-[var(--border)] hidden md:block" />

            {/* Builder Score */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsScoreInfoOpen(true)}
              className="w-full text-left bg-gradient-to-br from-[var(--surface2)]/50 to-black/30 rounded-2xl p-5 border border-white/5 relative overflow-hidden group/score hover:border-[var(--accent)]/40 transition-all shadow-xl"
            >
              {/* Dynamic Glow Accent */}
              <div
                className="absolute -top-12 -right-12 w-24 h-24 blur-[40px] rounded-full group-hover/score:w-32 group-hover/score:h-32 transition-all duration-700 opacity-20 group-hover/score:opacity-40"
                style={{ backgroundColor: profile.accentColor }}
              />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black font-mono text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                    Builder Status
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_8px_var(--accent)]" />
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black font-mono text-white tracking-tighter group-hover/score:text-[var(--accent)] transition-colors">
                      {profile.builderScore || 0}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider">pts</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[var(--accent)] shadow-inner group-hover/score:bg-[var(--accent)] group-hover/score:text-black transition-all duration-300">
                  <Trophy size={18} />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 relative z-10 mb-4">
                <div className="flex justify-between text-[8px] font-mono text-[var(--text-muted)] uppercase font-bold px-0.5">
                  <span className="group-hover/score:text-[var(--text-dim)] transition-colors">Progreso de Ranking</span>
                  <span className="text-[var(--accent)]">
                    {Math.round(((profile.builderScore || 0) / 1000) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((profile.builderScore || 0) / 1000) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full shadow-[0_0_10px_var(--accent)]"
                    style={{ backgroundColor: profile.accentColor }}
                  />
                </div>
              </div>

              {/* Next Steps / Tip */}
              <div className="relative z-10 pt-3 border-t border-white/5 mt-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[8px] font-black font-mono text-[var(--accent)] uppercase tracking-widest">Siguiente Nivel</span>
                  <ArrowUpRight size={10} className="text-[var(--accent)] opacity-50 group-hover/score:translate-x-0.5 group-hover/score:-translate-y-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-[var(--text-dim)] leading-tight italic bg-white/5 p-2.5 px-3 rounded-xl border border-white/5 group-hover/score:bg-white/[0.08] transition-colors group-hover/score:text-[var(--text-muted)]">
                  {(profile.builderScore || 0) < 50 || (!profile.avatarUrl || profile.displayName === profile.username) ? (
                    "Validá tu identidad con nombre y foto."
                  ) : !profile.blocks.some(b => (b.type === 'project' || b.type === 'building')) ? (
                    "Agregá al menos un proyecto real."
                  ) : !(profile.githubHandle || profile.blocks.some(b => b.type === 'github')) ? (
                    "Conectá tu GitHub para sumar fuerte."
                  ) : (profile.builderScore || 0) < 400 ? (
                    "Pedí recomendaciones para subir al top."
                  ) : (
                    "¡Perfil de Elite! Seguí buildeando."
                  )}
                </p>
              </div>

              {/* Interactive Tooltip Badge */}
              <div className="absolute bottom-2 right-4 text-[8px] font-black uppercase tracking-widest text-[var(--accent)] opacity-0 group-hover/score:opacity-100 translate-y-1 group-hover/score:translate-y-0 transition-all pointer-events-none">
                ¿Cómo subir mi score?
              </div>
            </motion.button>

            <BlockSelector
              onAdd={addBlock}
              accentColor={profile.accentColor}
              currentBlockCount={profile.blocks.length}
              subscriptionTier={profile.subscriptionTier}
              username={profile.username}
              twitterShareUnlocked={profile.twitterShareUnlocked}
              extraBlocksFromShare={profile.extraBlocksFromShare}
              onShareUnlocked={() => {
                setProfile(prev => prev ? {
                  ...prev,
                  twitterShareUnlocked: true,
                  extraBlocksFromShare: (prev.extraBlocksFromShare || 0) + 3,
                } : null);
              }}
            />
          </div>
        </div>

        <div className="mt-4 md:mt-6 space-y-2">
          <div className="section-label !text-[9px] mb-2 px-1 hidden md:block text-[var(--text-muted)] tracking-widest uppercase">// comunidad</div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-1.5">
            <Link href="/feed?from=dashboard" className="flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--surface2)]/50 md:bg-transparent text-sm font-bold text-[var(--text-muted)] hover:text-white md:hover:bg-[var(--surface2)] transition-all group">
              <Activity size={18} className="shrink-0 group-hover:scale-110 transition-transform opacity-70" />
              <span className="whitespace-nowrap">Feed</span>
            </Link>
            <Link href="/explore?from=dashboard" className="flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--surface2)]/50 md:bg-transparent text-sm font-bold text-[var(--text-muted)] hover:text-white md:hover:bg-[var(--surface2)] transition-all group">
              <Compass size={18} className="shrink-0 group-hover:scale-110 transition-transform opacity-70" />
              <span className="whitespace-nowrap">Explorar</span>
            </Link>
          </div>
        </div>

        <div className="mt-4 md:mt-6 space-y-2">
          <div className="section-label !text-[9px] mb-2 px-1 hidden md:block text-[var(--accent)] tracking-widest uppercase">// pro features</div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-1.5">
            <button
              onClick={() => {
                if (profile.subscriptionTier === 'pro') {
                  setIsProSettingsOpen(true);
                } else {
                  setIsUpgradeModalOpen(true);
                }
              }}
              className={`flex items-center justify-between w-full p-3 rounded-xl transition-all group ${
                profile.subscriptionTier === 'pro' 
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 shadow-[0_0_15px_rgba(200,255,0,0.05)]' 
                : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe size={18} className={`shrink-0 group-hover:scale-110 transition-transform ${profile.subscriptionTier === 'pro' ? 'text-[var(--accent)]' : ''}`} />
                <span className="text-sm font-bold whitespace-nowrap">PRO Settings</span>
              </div>
              {profile.subscriptionTier !== 'pro' && (
                <Lock size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 md:mt-6 space-y-2">
          <div className="section-label !text-[9px] mb-2 px-1 hidden md:block text-[var(--text-muted)] tracking-widest uppercase">// configuración</div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-1.5">
            <div className="flex items-center justify-between gap-3 w-full p-3 rounded-xl bg-[var(--surface2)]/50 md:bg-transparent text-sm font-bold text-[var(--text-muted)] hover:text-white md:hover:bg-[var(--surface2)] transition-all group">
              <div className="flex items-center gap-3">
                <Save size={18} className="shrink-0 opacity-70" />
                <span className="whitespace-nowrap">Auto</span>
              </div>
              <button
                onClick={toggleAutoSave}
                className={`w-8 h-4.5 rounded-full relative transition-colors ${autoSaveEnabled ? 'bg-[var(--accent)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${autoSaveEnabled ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            <button onClick={() => setIsFeedbackOpen(true)} className="flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--surface2)]/50 md:bg-transparent text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all">
              <MessageSquare size={18} className="shrink-0 opacity-70" />
              <span className="whitespace-nowrap">Feedback</span>
            </button>
          </div>
        </div>

        <div className="hidden md:block mt-auto pt-4 border-t border-[var(--border)]">
          <button onClick={handleLogout} className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-red-400/60 hover:text-red-400 text-[13px] font-medium hover:bg-red-500/10 transition-colors group shrink-0">
            <LogOut size={16} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className="truncate">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* CANVAS */}
      <main className="p-4 md:p-8 lg:p-10 lg:px-14 overflow-y-auto relative z-0 md:ml-[280px]">
        <style dangerouslySetInnerHTML={{
          __html: `
          :root {
            --accent: ${profile.accentColor};
            --accent-dim: ${profile.accentColor}1f;
            --btn-border: ${isDarkColor(profile.accentColor) ? 'rgba(255,255,255,0.15)' : 'transparent'};
          }
        `}} />
        <div className="absolute top-0 right-0 w-full lg:w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(200,255,0,0.03)_0%,transparent_70%)] pointer-events-none" />

        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8 md:mb-14 max-w-7xl mx-auto items-center text-center md:text-left pt-2 md:pt-0">
          <div className="w-full md:w-auto">
            <div className="mb-2">
              <div className="section-label hidden md:block">// editor de huevsite</div>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter">
                Armá tu <span style={{ color: profile.accentColor }}>{selectedSubSiteId ? (profile.subSites.find(s => s.id === selectedSubSiteId)?.title || "Sub-site") : "huevsite"}</span>.
              </h2>
              {profile?.subscriptionTier === "pro" && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[var(--accent)]/10 border border-[var(--accent)]/30 px-2.5 py-1 rounded-full mt-1">
                    <BadgeCheck size={16} style={{ color: profile.accentColor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: profile.accentColor }}>PRO</span>
                  </div>
                  {profile.subSites.length > 0 && (
                    <select
                      value={selectedSubSiteId || ""}
                      onChange={(e) => setSelectedSubSiteId(e.target.value || null)}
                      className="mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-bold text-[var(--accent)] outline-none focus:border-[var(--accent)]/50 transition-all cursor-pointer hover:bg-white/10"
                    >
                      <option value="" className="bg-black text-white">Sitio Principal</option>
                      {profile.subSites.map(site => (
                        <option key={site.id} value={site.id} className="bg-black text-white">
                          {site.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
            <p className="section-sub !text-sm mt-2 hidden md:block">
              Arrastrá para reordenar. Click en el rayito <Sparkles size={14} className="inline text-[var(--accent)]" /> para editar.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
            {lastSaved && !isSaving && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono hidden md:inline uppercase tracking-widest">
                Guardado hace {Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s
              </span>
            )}
            {isSaving && (
              <span className="text-[10px] text-[var(--accent)] font-mono animate-pulse hidden md:inline uppercase tracking-widest">
                Guardando cambios...
              </span>
            )}
            <div className="flex gap-2 w-full md:w-auto">
              <Link
                href={`/${profile.username}`}
                target="_blank"
                className="btn btn-ghost !px-6 flex-1 md:flex-none justify-center !py-3 md:!py-2"
              >
                <Eye size={16} className="mr-2" /> <span className="">Ver perfil</span>
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-accent !px-8 shadow-xl flex-1 md:flex-none justify-center whitespace-nowrap border !py-3 md:!py-2"
                style={{
                  backgroundColor: profile.accentColor,
                  color: getContrastColor(profile.accentColor),
                  borderColor: 'var(--btn-border)'
                }}
              >
                <Save size={16} className="mr-2" /> <span className="">{isSaving ? 'Guardando' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto pb-32">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={profile.blocks.map(b => b.id)}
              strategy={rectSortingStrategy}
            >
              <div className="huevsite-grid min-h-[600px] p-4 sm:p-8 desktop:p-12 rounded-[2.5rem] border border-dashed border-[var(--border-bright)] bg-white/[0.01] transition-all duration-500">
                {profile.blocks.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-40 text-center">
                    <div className="w-20 h-20 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-8 border border-[var(--border-bright)] animate-pulse shadow-xl shadow-black/40">
                      <Plus size={32} className="text-[var(--text-dim)]" />
                    </div>
                    <p className="text-[var(--text-dim)] font-mono text-base max-w-sm leading-relaxed font-medium">
                      Tu huevsite está esperando tu magia. 🇦🇷 <br />
                      <span className="text-[var(--accent)] mt-2 block">Agregá tu primer bloque para empezar.</span>
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Fallback Header Preview if no Hero block exists */}
                    {!profile.blocks.some(b => b.type === 'hero') && profile.displayName && (
                      <div className="col-span-2 row-span-1 opacity-50 grayscale-[0.8] scale-[0.98] pointer-events-none">
                        <div className="huevsite-block flex flex-col justify-center p-8 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-[2rem]">
                          <div className="flex justify-between items-start mb-2">
                            <h1 className="text-3xl font-extrabold text-white mb-1">{profile.displayName}</h1>
                            <span className="text-[9px] font-mono text-[var(--accent)] border border-[var(--accent)] px-2 py-0.5 rounded-full uppercase tracking-tighter">Vista Previa identity</span>
                          </div>
                          <p className="text-sm text-[var(--text-dim)] font-mono opacity-60">// {profile.tagline || 'builder'}</p>
                        </div>
                      </div>
                    )}
                    {profile.blocks.map((block) => (
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
                    ))}
                  </>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </main >

      {/* Editor Modal */}
      <AnimatePresence>
        {
          editingBlock && (
            <BlockEditorModal
              block={editingBlock}
              isOpen={!!editingBlock}
              onClose={() => setEditingBlock(null)}
              onSave={updateBlock}
              accentColor={profile?.accentColor || "#C8FF00"}
            />
          )
        }
      </AnimatePresence >

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />


      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          localStorage.setItem("huevsite_onboarding_seen", "true");
          setIsOnboardingOpen(false);
        }}
        username={profile.username}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeletingId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsDeletingId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-sm bg-[var(--surface)] border border-red-500/30 rounded-[2rem] shadow-2xl p-8 z-10 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">¿Eliminar bloque?</h3>
              <p className="text-[var(--text-dim)] mb-8 text-sm leading-relaxed">
                Esta acción es irreversible y se perderá todo el contenido del bloque. ¿Estás seguro?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeletingId(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-[var(--surface2)] font-bold text-sm text-white hover:bg-[var(--border)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    removeBlock(isDeletingId);
                    setIsDeletingId(null);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 font-bold text-sm text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile / URL Editing Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border-bright)] rounded-[2.5rem] shadow-2xl overflow-hidden z-10 p-8 pt-10"
            >
              <div className="text-center mb-8">
                <div className="section-label mb-2 mx-auto w-fit">// ajustes de identidad</div>
                <h3 className="text-2xl font-black tracking-tighter">Editar Perfil</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] px-1">Tu URL (Username)</label>
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-black/40 border border-white/10 focus-within:border-[var(--accent)] transition-all">
                    <span className="text-xs text-[var(--text-muted)] font-mono">huevsite.io/</span>
                    <input
                      value={tempProfileData.username}
                      onChange={(e) => setTempProfileData(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                      className="bg-transparent border-none outline-none text-sm font-black text-[var(--accent)] font-mono flex-1 p-0"
                      placeholder="username"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono px-1">
                    Solo letras, números, guiones y guiones bajos.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] px-1 font-bold">Foto de Perfil (URL)</label>
                  <input
                    value={tempProfileData.avatarUrl}
                    onChange={(e) => setTempProfileData(p => ({ ...p, avatarUrl: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none text-sm text-[var(--text-dim)] focus:border-[var(--accent)] transition-all font-mono"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] px-1 font-bold">GitHub Username</label>
                  <input
                    value={tempProfileData.githubHandle}
                    onChange={(e) => setTempProfileData(p => ({ ...p, githubHandle: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none text-sm text-[var(--accent)] font-mono"
                    placeholder="ej: tomasdeluca"
                  />
                  <p className="text-[9px] text-[var(--text-muted)] font-mono px-1">
                    Esto habilita métricas avanzadas y bloques de repo.
                  </p>
                </div>

                <div className="h-px bg-white/5 my-2" />

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] px-1 font-bold">Nombre Público</label>
                    <input
                      value={tempProfileData.display_name}
                      onChange={(e) => setTempProfileData(p => ({ ...p, display_name: e.target.value }))}
                      className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none text-sm font-bold text-white focus:border-[var(--accent)] transition-all"
                      placeholder="Tu Nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] px-1 font-bold">Tagline / Rol</label>
                    <input
                      value={tempProfileData.tagline}
                      onChange={(e) => setTempProfileData(p => ({ ...p, tagline: e.target.value }))}
                      className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none text-sm text-[var(--text-dim)] focus:border-[var(--accent)] transition-all"
                      placeholder="p. ej. Product Designer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-4 text-sm font-bold text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    const oldUsername = profile.username;
                    const newUsername = tempProfileData.username;

                    // Actualizar estado local
                    setProfile(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        username: newUsername,
                        displayName: tempProfileData.display_name,
                        tagline: tempProfileData.tagline,
                        avatarUrl: tempProfileData.avatarUrl,
                        githubHandle: tempProfileData.githubHandle
                      };
                    });

                    setIsProfileModalOpen(false);

                    // Persistencia inmediata
                    try {
                      const response = await fetch('/api/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          username: newUsername,
                          name: tempProfileData.display_name,
                          tagline: tempProfileData.tagline,
                          image: tempProfileData.avatarUrl,
                          github_handle: tempProfileData.githubHandle
                        }),
                      });

                      if (!response.ok) {
                        const data = await response.json();
                        alert(`Error: ${data.error || 'No se pudo actualizar'}`);
                        // Revertir? Podríamos recargar si falla mucho.
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="flex-[2] py-4 rounded-2xl bg-[var(--accent)] text-black font-black text-sm shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{ backgroundColor: profile.accentColor, color: getContrastColor(profile.accentColor) }}
                >
                  Confirmar cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ScoreInfoModal
        isOpen={isScoreInfoOpen}
        onClose={() => setIsScoreInfoOpen(false)}
        accentColor={profile.accentColor}
        profileId={profile.id}
      />

      {isProSettingsOpen && (
        <ProSettingsModal
          isOpen={isProSettingsOpen}
          onClose={() => setIsProSettingsOpen(false)}
          accentColor={profile.accentColor}
          subSites={profile.subSites}
          customDomain={profile.customDomain}
          onUpdateDomain={handleUpdateDomain}
          onAddSubSite={handleAddSubSite}
          onUpdateSubSite={handleUpdateSubSite}
          onDeleteSubSite={handleDeleteSubSite}
          username={profile.username}
        />
      )}

      {isUpgradeModalOpen && (
        <UpgradeModal 
          isOpen={isUpgradeModalOpen} 
          onClose={() => setIsUpgradeModalOpen(false)} 
          accentColor={profile.accentColor} 
        />
      )}
    </div>
  );
}
