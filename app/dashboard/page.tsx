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
import { Save, Eye, Layout as LayoutIcon, Settings, LogOut, Plus, Sparkles, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { MOCK_PROFILE } from "@/lib/mock-profile";
import { BlockData, BlockType, ProfileData, PRESET_COLORS } from "@/lib/profile-types";
import { HeroBlock } from "@/components/blocks/HeroBlock";
import { BuildingBlock } from "@/components/blocks/BuildingBlock";
import { GitHubBlock } from "@/components/blocks/GitHubBlock";
import { ProjectBlock } from "@/components/blocks/ProjectBlock";
import { MetricBlock, SocialBlock, CVBlock } from "@/components/blocks/Widgets";
import { StackBlock, CommunityBlock, WritingBlock } from "@/components/blocks/ExtraBlocks";
import { SortableBlock } from "@/components/dashboard/SortableBlock";
import { BlockSelector } from "@/components/dashboard/BlockSelector";
import { BlockEditorModal } from "@/components/dashboard/BlockEditorModal";
import { ColorPicker } from "@/components/dashboard/ColorPicker";
import { FeedbackModal } from "@/components/dashboard/FeedbackModal";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingBlock, setEditingBlock] = useState<BlockData | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
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
          username: data.profile.username,
          displayName: data.profile.name || data.profile.username,
          accentColor: data.profile.accent_color,
          subscriptionTier: data.profile.pro_since ? 'pro' : 'free',
          extraBlocksFromShare: data.profile.extra_blocks_from_share || 0,
          twitterShareUnlocked: data.profile.twitter_share_unlocked || false,
          tagline: data.profile.tagline || "",
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
          username: "usuario",
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
            { title: "Mi primer post", link: "", date: "2024-01-01" },
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
      default: return (
        <div className="bento-block h-full flex items-center justify-center p-8 border-dashed border-[var(--border-bright)]">
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
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accent_color: profile.accentColor,
          username: profile.username,
          name: profile.displayName,
          tagline: profile.tagline,
        }),
      });

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

  // Autosave with debounce
  useEffect(() => {
    if (!profile || loading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 1500); // Debounce de 1.5s

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [profile]);

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
      {/* SIDEBAR */}
      <aside className="relative md:fixed md:inset-y-0 md:left-0 w-full md:w-[320px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 flex flex-col gap-8 top-0 h-auto md:h-screen overflow-y-auto z-10">
        <div>
          <Link href="/" className="logo mb-10 block">huev<span>site</span>.io</Link>

          <div className="space-y-6">
            <div className="space-y-2 mb-8 bg-[var(--surface2)]/50 p-4 rounded-2xl border border-[var(--border)] relative group transition-colors hover:border-[var(--border-bright)] shadow-sm">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono text-[var(--text-muted)] tracking-widest uppercase pointer-events-none">
                Editar
              </div>
              {!profile.blocks.some(b => b.type === 'hero') && (
                <>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => handleProfileDetailChange('name', e.target.value)}
                    className="bg-transparent border-none outline-none text-2xl font-extrabold truncate text-white w-full p-0 placeholder-[var(--text-muted)] focus:text-[var(--accent)] transition-colors"
                    placeholder="Tu Nombre"
                  />
                  <input
                    type="text"
                    value={profile.tagline || ""}
                    onChange={(e) => handleProfileDetailChange('tagline', e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-[var(--text-dim)] w-full p-0 placeholder-[var(--text-muted)] block"
                    placeholder="Un tagline cortito..."
                  />
                </>
              )}
              <div className={`flex items-center gap-1 ${!profile.blocks.some(b => b.type === 'hero') ? 'pt-3 mt-1 border-t border-[var(--border)]/50' : ''}`}>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">huevsite.io/</span>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => handleProfileDetailChange('username', e.target.value)}
                  className="bg-transparent border-none outline-none text-[11px] font-bold truncate text-[var(--accent)] font-mono flex-1 p-0 focus:underline tracking-wide"
                  placeholder="username"
                />
              </div>
            </div>

            <ColorPicker
              value={profile.accentColor}
              onChange={handleColorChange}
            />

            <div className="h-px bg-[var(--border)]" />

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

        <div className="mt-8 space-y-1">
          <div className="section-label !text-[9px] mb-3 px-1">// configuración</div>
          <button onClick={() => alert('Próximamente 🇦🇷')} className="flex items-center gap-3 w-full p-3 rounded-xl bg-transparent text-sm font-medium text-[var(--text-dim)] hover:text-white hover:bg-[var(--surface2)] transition-all group shrink-0">
            <Settings size={18} className="shrink-0 group-hover:rotate-45 transition-transform" /> 
            <span className="truncate">Ajustes del perfil</span>
          </button>
          <button onClick={() => alert('Próximamente 🇦🇷')} className="flex items-center gap-3 w-full p-3 rounded-xl bg-transparent text-sm font-medium text-[var(--text-dim)] hover:text-white hover:bg-[var(--surface2)] transition-all shrink-0">
            <LayoutIcon size={18} className="shrink-0" /> 
            <span className="truncate">Gestionar Layout</span>
          </button>
          <button onClick={() => setIsFeedbackOpen(true)} className="flex items-center gap-3 w-full p-3 rounded-xl bg-transparent text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all shrink-0">
            <MessageSquare size={18} className="shrink-0" /> 
            <span className="truncate">Enviar Feedback 🇦🇷</span>
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-[var(--border)]">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl text-red-400/70 hover:text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors group shrink-0">
            <LogOut size={18} className="shrink-0 group-hover:-translate-x-1 transition-transform" /> 
            <span className="truncate">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* CANVAS */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto relative z-0 md:ml-[320px]">
        <div className="absolute top-0 right-0 w-full lg:w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(200,255,0,0.03)_0%,transparent_70%)] pointer-events-none" />
        
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-12 max-w-7xl mx-auto">
          <div>
            <div className="section-label mb-2">// editor de huevsite</div>
            <h2 className="text-4xl font-extrabold tracking-tighter">Armá tu huevsite.</h2>
            <p className="section-sub !text-sm mt-2">
              Arrastrá para reordenar. Click en el rayito <Sparkles size={14} className="inline text-[var(--accent)]" /> para editar.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            {lastSaved && !isSaving && (
              <span className="text-xs text-[var(--text-muted)] font-mono">
                Guardado · hace {Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s
              </span>
            )}
            {isSaving && (
              <span className="text-xs text-[var(--accent)] font-mono animate-pulse">
                Guardando...
              </span>
            )}
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="btn btn-ghost !px-6"
            >
              <Eye size={16} className="mr-2" /> Ver perfil
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-accent !px-8 shadow-xl"
              style={{ backgroundColor: profile.accentColor }}
            >
              <Save size={16} className="mr-2" /> {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
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
              <div className="bento-grid min-h-[600px] p-8 rounded-[2rem] border border-dashed border-[var(--border-bright)] bg-white/[0.02]">
                {profile.blocks.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-40 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-6 border border-[var(--border-bright)] animate-pulse">
                       <Plus size={32} className="text-[var(--text-dim)]" />
                    </div>
                    <p className="text-[var(--text-dim)] font-mono text-sm max-w-xs leading-relaxed">
                       Este portfolio está más vacío que heladera de estudiante. 🇦🇷 <br/>
                       <span className="text-[var(--accent)]">Empezá agregando tu primer bloque.</span>
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Fallback Header Preview if no Hero block exists */}
                    {!profile.blocks.some(b => b.type === 'hero') && profile.displayName && (
                      <div className="md:col-span-2 md:row-span-1 opacity-50 grayscale-[0.5]">
                        <div className="bento-block flex flex-col justify-center p-8 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-[2rem]">
                          <div className="flex justify-between items-start mb-2">
                            <h1 className="text-3xl font-extrabold text-white mb-1">{profile.displayName}</h1>
                            <span className="text-[9px] font-mono text-[var(--accent)] border border-[var(--accent)] px-2 py-0.5 rounded-full uppercase">Fallback</span>
                          </div>
                          <p className="text-sm text-[var(--text-dim)] font-mono">// {profile.tagline || 'builder'}</p>
                        </div>
                      </div>
                    )}
                    {profile.blocks.map((block) => (
                      <SortableBlock
                        key={block.id}
                        id={block.id}
                        block={block}
                        onRemove={removeBlock}
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
      </main>

      {/* Editor Modal */}
      <AnimatePresence>
        {editingBlock && (
          <BlockEditorModal
            block={editingBlock}
            isOpen={!!editingBlock}
            onClose={() => setEditingBlock(null)}
            onSave={updateBlock}
          />
        )}
      </AnimatePresence>

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </div>
  );
}
