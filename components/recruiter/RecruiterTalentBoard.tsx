"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, Zap } from "lucide-react";

export interface RecruiterTalent {
    id: string;
    username: string;
    name: string | null;
    tagline: string | null;
    image: string | null;
    location: string | null;
    builder_score: number | null;
    mainStack: string[];
    heroStatus: string | null;
    openToWork: boolean;
}

interface Props {
    talent: RecruiterTalent[];
}

export function RecruiterTalentBoard({ talent }: Props) {
    const [stackQuery, setStackQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [onlyOpenToWork, setOnlyOpenToWork] = useState(false);

    const filtered = useMemo(() => {
        const stack = stackQuery.trim().toLowerCase();
        const location = locationQuery.trim().toLowerCase();

        return talent.filter((dev) => {
            if (stack && !dev.mainStack.some((tech) => tech.toLowerCase().includes(stack))) {
                return false;
            }
            if (location && !(dev.location || "").toLowerCase().includes(location)) {
                return false;
            }
            if (onlyOpenToWork && !dev.openToWork) {
                return false;
            }
            return true;
        });
    }, [talent, stackQuery, locationQuery, onlyOpenToWork]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Sidebar Filters */}
            <aside className="lg:col-span-1 space-y-6">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-[#C8FF00] mb-6">// Filtros</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-mono text-[var(--text-muted)] block mb-2">Tech Stack</label>
                            <input
                                type="text"
                                value={stackQuery}
                                onChange={(e) => setStackQuery(e.target.value)}
                                placeholder="ej. React, Python..."
                                className="w-full bg-black/40 border border-[var(--border-bright)] rounded-xl px-4 py-3 text-sm focus:border-[#C8FF00] outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-mono text-[var(--text-muted)] block mb-2">Ubicación</label>
                            <input
                                type="text"
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                                placeholder="ej. Argentina, Remoto..."
                                className="w-full bg-black/40 border border-[var(--border-bright)] rounded-xl px-4 py-3 text-sm focus:border-[#C8FF00] outline-none transition-colors"
                            />
                        </div>
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-black/20 cursor-pointer hover:border-[#C8FF00]/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={onlyOpenToWork}
                                onChange={(e) => setOnlyOpenToWork(e.target.checked)}
                                className="accent-[#C8FF00]"
                            />
                            <span className="text-sm font-bold">Solo Open to Work</span>
                        </label>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-xs text-[#C8FF00] font-mono leading-relaxed">
                    ℹ️ El Builder Score se recalcula de forma automática basándose en proyectos, validación de la comunidad y actividad open source.
                </div>
            </aside>

            {/* List */}
            <div className="lg:col-span-3 space-y-4">
                <div className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">
                    {filtered.length} {filtered.length === 1 ? "builder" : "builders"}
                    {filtered.length !== talent.length && ` (de ${talent.length})`}
                </div>

                {filtered.map((dev) => (
                    <Link href={`/${dev.username}`} target="_blank" key={dev.id} className="block group">
                        <div className="bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] group-hover:border-[#C8FF00]/40 rounded-3xl p-6 transition-all duration-300 flex flex-col md:flex-row gap-6 relative overflow-hidden">

                            {/* Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8FF00]/5 blur-3xl rounded-full" />

                            <div className="flex gap-4 min-w-[300px]">
                                {dev.image ? (
                                    <img src={dev.image} alt={dev.username} className="w-16 h-16 rounded-full object-cover border border-[var(--border)]" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center font-bold text-lg border border-[var(--border)] text-[#C8FF00]">
                                        {dev.username.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex flex-col justify-center">
                                    <h2 className="text-xl font-bold tracking-tight text-white mb-1 group-hover:text-[#C8FF00] transition-colors">{dev.name || dev.username}</h2>
                                    <div className="text-sm text-[var(--text-dim)] line-clamp-1">{dev.tagline || "Builder"}</div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        {dev.openToWork && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C8FF00]/10 border border-[#C8FF00]/25 text-[10px] font-bold text-[#C8FF00] uppercase tracking-wider">
                                                ● Open to work
                                            </span>
                                        )}
                                        {dev.location && (
                                            <span className="text-[11px] font-mono text-[var(--text-muted)]">{dev.location}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                {dev.mainStack.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {dev.mainStack.map((tech, i) => (
                                            <span key={i} className="px-2 py-1 bg-black/40 border border-white/5 rounded pl-2 text-xs font-mono text-[var(--text-muted)]">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs font-mono text-white/20 italic">No stack indexado</div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-6 shrink-0 md:min-w-[200px] mt-4 md:mt-0 pt-4 md:pt-0 border-t border-[var(--border)] md:border-none">
                                <div className="flex flex-col items-end">
                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-1">Score</div>
                                    <div className="flex items-center gap-2">
                                        <Award size={18} className="text-[#C8FF00]" />
                                        <span className="text-2xl font-black font-mono">{dev.builder_score || 0}</span>
                                    </div>
                                </div>

                                <div className="w-10 h-10 rounded-full border border-[var(--border-bright)] flex items-center justify-center -rotate-45 group-hover:rotate-0 group-hover:bg-[#C8FF00] group-hover:text-black group-hover:border-[#C8FF00] transition-all text-white">
                                    <Zap size={18} className="fill-current" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {filtered.length === 0 && (
                    <div className="text-center py-20 text-[var(--text-dim)] font-mono border border-dashed border-[var(--border)] rounded-3xl">
                        {talent.length === 0
                            ? "No se encontró talento rankeado aún."
                            : "Ningún builder matchea esos filtros. Probá aflojando alguno."}
                    </div>
                )}
            </div>

        </div>
    );
}
