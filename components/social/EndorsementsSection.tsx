"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Plus } from "lucide-react";
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
  created_at: string;
  from: EndorsementUser;
}

interface Props {
  profileId: string;
  profileAccentColor: string;
  currentUserId: string | null;
  isFollowing: boolean;
}

export function EndorsementsSection({ profileId, profileAccentColor, currentUserId, isFollowing }: Props) {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const canEndorse = !!currentUserId && currentUserId !== profileId && isFollowing;

  useEffect(() => {
    fetch(`/api/social/endorsements?toId=${profileId}`)
      .then(r => r.json())
      .then(data => setEndorsements(data.endorsements ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profileId]);

  const handleEndorseSubmit = (newEndorsement: Endorsement) => {
    setEndorsements(prev => [newEndorsement, ...prev]);
    setModalOpen(false);
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
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="section-label mb-2">// endorsements</div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Lo que dicen los que laburaron.
          </h2>
        </div>

        {canEndorse && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm border transition-all hover:opacity-90"
            style={{ backgroundColor: profileAccentColor, color: "black", borderColor: "transparent" }}
          >
            <Plus size={15} />
            Laburé con este builder →
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
          <div className="flex flex-wrap gap-2 mb-8">
            {Object.entries(grouped).map(([skill, { count }]) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border"
                style={{ borderColor: `${profileAccentColor}40`, color: profileAccentColor, backgroundColor: `${profileAccentColor}10` }}
              >
                {skill}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-lg font-mono text-black"
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
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-bright)] transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
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
                    <a href={`/${e.from.username}`} className="text-sm font-bold hover:underline" style={{ color: e.from.accent_color }}>
                      {e.from.name ?? e.from.username}
                    </a>
                    <span
                      className="ml-2 text-xs font-bold px-2 py-0.5 rounded-lg text-black"
                      style={{ backgroundColor: profileAccentColor }}
                    >
                      {e.skill}
                    </span>
                  </div>
                </div>
                {e.comment && (
                  <p className="text-sm text-[var(--text-dim)] leading-relaxed italic">
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
          onClose={() => setModalOpen(false)}
          onSubmit={handleEndorseSubmit}
        />
      )}
    </section>
  );
}

function EndorseModal({
  profileId,
  accentColor,
  onClose,
  onSubmit,
}: {
  profileId: string;
  accentColor: string;
  onClose: () => void;
  onSubmit: (e: Endorsement) => void;
}) {
  const [selectedSkill, setSelectedSkill] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const skill = selectedSkill || customSkill;

  const handleSubmit = async () => {
    if (!skill.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/social/endorsements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId: profileId, skill: skill.trim(), comment: comment.trim() || undefined }),
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
              <div className="section-label mb-1">// endorsar builder</div>
              <h3 className="text-2xl font-extrabold tracking-tight">¿En qué destacó?</h3>
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Endorsar →"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
