"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Plus, MoreHorizontal, EyeOff, Eye, Trash2, Edit2 } from "lucide-react";
import { createPortal } from "react-dom";

const PRESET_SKILLS = [
  "React", "TypeScript", "Next.js", "Node.js", "Python",
  "Go", "Rust", "PostgreSQL", "AWS", "Design Systems",
  "Product", "Diseño", "UX", "Marketing", "Fundraising",
];

interface EndorsementUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  accent_color: string;
}

interface Endorsement {
  id: string;
  skill: string;
  comment: string | null;
  visible: boolean;
  created_at: string;
  from: EndorsementUser;
}

interface Props {
  profileId: string;
  profileAccentColor: string;
  currentUserId: string | null;
  isFollowing: boolean;
  hasNominated: boolean;
}

export function EndorsementsSection({ profileId, profileAccentColor, currentUserId, isFollowing, hasNominated }: Props) {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEndorsement, setEditingEndorsement] = useState<Endorsement | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const canEndorse = !!currentUserId && currentUserId !== profileId && (isFollowing || hasNominated);

  useEffect(() => {
    fetch(`/api/social/endorsements?toId=${profileId}`)
      .then(r => r.json())
      .then(data => setEndorsements(data.endorsements ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profileId]);

  const handleEndorseSubmit = (newEndorsement: Endorsement) => {
    // Si era una edición, reemplazamos, si no agregamos
    if (editingEndorsement) {
      setEndorsements(prev => prev.map(e => e.id === newEndorsement.id ? newEndorsement : e));
    } else {
      setEndorsements(prev => [newEndorsement, ...prev]);
    }
    setModalOpen(false);
    setEditingEndorsement(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este endorsement?")) return;
    try {
      const res = await fetch(`/api/social/endorsements?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEndorsements(prev => prev.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error("Error deleting endorsement:", error);
    }
  };

  const toggleVisibility = async (id: string, currentVisible: boolean) => {
    try {
      const res = await fetch("/api/social/endorsements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, visible: !currentVisible }),
      });
      if (res.ok) {
        setEndorsements(prev => prev.map(e => e.id === id ? { ...e, visible: !currentVisible } : e));
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  // Agrupar por skill con conteo
  const grouped = endorsements.reduce<Record<string, { count: number; items: Endorsement[] }>>((acc, e) => {
    if (!acc[e.skill]) acc[e.skill] = { count: 0, items: [] };
    acc[e.skill].count++;
    acc[e.skill].items.push(e);
    return acc;
  }, {});

  return (
    <section className="mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <div>
          <div className="section-label mb-2">// endorsements</div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Lo que dicen los que laburaron.
          </h2>
        </div>

        {canEndorse && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm border transition-all hover:opacity-90 active:scale-95 w-full sm:w-auto shadow-sm"
            style={{ backgroundColor: profileAccentColor, color: "black", borderColor: "transparent" }}
          >
            <Plus size={16} strokeWidth={3} />
            Laburé con este builder
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : endorsements.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border-bright)] rounded-3xl">
          <p className="text-[var(--text-dim)] font-mono text-sm">
            Todavía nadie lo endorsó. Sé el primero.
          </p>
          {canEndorse && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 px-5 py-2 rounded-xl font-bold text-sm text-black transition-all"
              style={{ backgroundColor: profileAccentColor }}
            >
              Endorsar ahora →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Skill badges con conteo */}
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap gap-2 mb-8 no-scrollbar">
            {Object.entries(grouped).map(([skill, { count }]) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border shrink-0"
                style={{ borderColor: `${profileAccentColor}40`, color: profileAccentColor, backgroundColor: `${profileAccentColor}10` }}
              >
                {skill}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-lg font-mono text-black"
                  style={{ backgroundColor: profileAccentColor }}
                >
                  {count}
                </span>
              </span>
            ))}
          </div>

          {/* Cards de endorsements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endorsements.slice(0, 6).map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-bright)] transition-all ${!e.visible ? 'opacity-50 grayscale-[0.5]' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <a href={`/${e.from.username}`}>
                      {e.from.image ? (
                        <img src={e.from.image} alt={e.from.username} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-black"
                          style={{ backgroundColor: e.from.accent_color }}
                        >
                          {(e.from.name ?? e.from.username)[0]?.toUpperCase()}
                        </div>
                      )}
                    </a>
                    <div>
                      <div className="flex items-center gap-2">
                        <a href={`/${e.from.username}`} className="text-sm font-bold hover:underline" style={{ color: e.from.accent_color }}>
                          {e.from.name ?? e.from.username}
                        </a>
                        {!e.visible && (
                          <span className="text-[9px] font-mono text-red-400 uppercase tracking-tighter bg-red-400/10 px-1.5 rounded flex items-center gap-1">
                            <EyeOff size={10} /> Oculto
                          </span>
                        )}
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-lg text-black inline-block mt-0.5"
                        style={{ backgroundColor: profileAccentColor }}
                      >
                        {e.skill}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  {(currentUserId === e.from.id || currentUserId === profileId) && (
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === e.id ? null : e.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface2)] text-[var(--text-muted)] transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      <AnimatePresence>
                        {activeMenuId === e.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute right-0 top-full mt-1 w-40 bg-[var(--surface2)] border border-[var(--border-bright)] rounded-xl shadow-xl z-20 overflow-hidden"
                          >
                            {currentUserId === e.from.id && (
                              <button 
                                onClick={() => { setEditingEndorsement(e); setModalOpen(true); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                              >
                                <Edit2 size={12} /> Editar
                              </button>
                            )}
                            {currentUserId === profileId && (
                              <button 
                                onClick={() => { toggleVisibility(e.id, e.visible); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                              >
                                {e.visible ? <><EyeOff size={12} /> Ocultar</> : <><Eye size={12} /> Mostrar</>}
                              </button>
                            )}
                            <button 
                              onClick={() => { handleDelete(e.id); setActiveMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 size={12} /> Eliminar
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                {e.comment && (
                  <p className="text-sm text-[var(--text-dim)] leading-relaxed italic pr-4">
                    &ldquo;{e.comment}&rdquo;
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <EndorseModal
          profileId={profileId}
          accentColor={profileAccentColor}
          editingEndorsement={editingEndorsement}
          onClose={() => { setModalOpen(false); setEditingEndorsement(null); }}
          onSubmit={handleEndorseSubmit}
        />
      )}
    </section>
  );
}

function EndorseModal({
  profileId,
  accentColor,
  editingEndorsement,
  onClose,
  onSubmit,
}: {
  profileId: string;
  accentColor: string;
  editingEndorsement?: Endorsement | null;
  onClose: () => void;
  onSubmit: (e: Endorsement) => void;
}) {
  const [selectedSkill, setSelectedSkill] = useState(editingEndorsement?.skill || "");
  const [customSkill, setCustomSkill] = useState("");
  const [comment, setComment] = useState(editingEndorsement?.comment || "");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!PRESET_SKILLS.includes(editingEndorsement?.skill || "")) {
      if (editingEndorsement?.skill) {
        setCustomSkill(editingEndorsement.skill);
        setSelectedSkill("");
      }
    }
  }, [editingEndorsement]);

  useEffect(() => { setMounted(true); }, []);

  const skill = selectedSkill || customSkill;

  const handleSubmit = async () => {
    if (!skill.trim()) return;
    setLoading(true);
    try {
      const isEditing = !!editingEndorsement;
      const res = await fetch("/api/social/endorsements", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: editingEndorsement?.id,
          toId: profileId, 
          skill: skill.trim(), 
          comment: comment.trim() || undefined 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSubmit(data.endorsement);
      } else {
        alert(data.error || "Error al endorsar.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="portal-root fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border-bright)] rounded-[2rem] shadow-2xl overflow-hidden z-10"
        >
          <div className="p-6 border-b border-[var(--border)] flex justify-between items-start bg-black/40">
            <div>
              <div className="section-label mb-1">// {editingEndorsement ? 'editar' : 'endorsar'} builder</div>
              <h3 className="text-2xl font-extrabold tracking-tight">
                {editingEndorsement ? 'Ajustá tu endorsement' : '¿En qué destacó?'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface2)] transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Skill chips */}
            <div className="space-y-3">
              <div className="section-label !text-[9px]">// elegí una skill</div>
              <div className="flex flex-wrap gap-2">
                {PRESET_SKILLS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSelectedSkill(s); setCustomSkill(""); }}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all border"
                    style={
                      selectedSkill === s
                        ? { backgroundColor: accentColor, color: "black", borderColor: "transparent" }
                        : { borderColor: "var(--border-bright)", color: "var(--text-dim)" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                value={customSkill}
                onChange={(e) => { setCustomSkill(e.target.value); setSelectedSkill(""); }}
                className="w-full p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all text-sm"
                placeholder="O escribí una skill personalizada..."
              />
            </div>

            {/* Comentario */}
            <div className="space-y-2">
              <div className="section-label !text-[9px]">// comentario (opcional · máx 140 chars)</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 140))}
                className="w-full p-3 h-20 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none resize-none text-sm leading-relaxed"
                placeholder="Laburamos juntos en X proyecto y..."
              />
              <p className="text-right text-xs text-[var(--text-muted)] font-mono">{comment.length}/140</p>
            </div>
          </div>

          <div className="p-6 border-t border-[var(--border)] bg-black/20 flex gap-3">
            <button onClick={onClose} className="btn btn-ghost flex-1 py-3">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !skill.trim()}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-black flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: skill.trim() ? accentColor : "var(--surface2)", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (editingEndorsement ? "Guardar cambios" : "Endorsar →")}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
