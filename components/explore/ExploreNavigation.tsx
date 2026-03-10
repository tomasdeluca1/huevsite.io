"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Compass, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function ExploreNavigation({ currentUsername }: { currentUsername: string }) {
    const router = useRouter();
    const [list, setList] = useState<string[]>([]);
    const [index, setIndex] = useState(-1);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fromExplore = sessionStorage.getItem("huevsite_from_explore") === "true";
        const savedList = sessionStorage.getItem("huevsite_explore_list");

        if (fromExplore && savedList) {
            try {
                const parsed = JSON.parse(savedList);
                if (Array.isArray(parsed)) {
                    setList(parsed);
                    setIndex(parsed.indexOf(currentUsername));
                    setIsVisible(true);
                }
            } catch (e) {
                console.error("Error parsing explore list", e);
            }
        }
    }, [currentUsername]);

    if (!isVisible || index === -1) return null;

    const prev = index > 0 ? list[index - 1] : null;
    const next = index < list.length - 1 ? list[index + 1] : null;

    return (
        <div className="fixed inset-x-0 bottom-8 z-[100] flex justify-center pointer-events-none px-4">
            <div className="flex items-center gap-3 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[28px] pointer-events-auto shadow-2xl shadow-black/50">
                {/* Previous */}
                <div className="relative group">
                    <button
                        disabled={!prev}
                        onClick={() => prev && router.push(`/${prev}`)}
                        className={`p-4 rounded-2xl transition-all flex items-center gap-2 ${prev
                            ? "hover:bg-white/10 text-white hover:text-[var(--accent)]"
                            : "opacity-20 translate-x-0 cursor-not-allowed"
                            }`}
                    >
                        <ChevronLeft size={24} className={prev ? "group-hover:-translate-x-1 transition-transform" : ""} />
                    </button>
                    {prev && (
                        <div className="absolute bottom-full left-0 mb-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none">
                            <div className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl whitespace-nowrap">
                                <span className="text-[10px] text-[var(--accent)] font-black uppercase tracking-widest block mb-0.5">Anterior</span>
                                <span className="text-sm font-bold text-white">@{prev}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-white/10" />

                {/* Explorer & Progress */}
                <Link
                    href="/explore"
                    className="flex flex-col items-center px-4 hover:bg-white/5 py-2 rounded-2xl transition-colors group"
                >
                    <Compass size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:rotate-12 transition-all mb-1" />
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Explorar</span>
                        <span className="text-[10px] font-mono text-[var(--text-dim)] bg-white/5 px-2 py-0.5 rounded-full mt-1 border border-white/5">
                            {index + 1} <span className="opacity-40">/</span> {list.length}
                        </span>
                    </div>
                </Link>

                <div className="h-8 w-px bg-white/10" />

                {/* Next */}
                <div className="relative group">
                    <button
                        disabled={!next}
                        onClick={() => next && router.push(`/${next}`)}
                        className={`p-4 rounded-2xl transition-all flex items-center gap-2 ${next
                            ? "hover:bg-white/10 text-white hover:text-[var(--accent)]"
                            : "opacity-20 cursor-not-allowed"
                            }`}
                    >
                        <ChevronRight size={24} className={next ? "group-hover:translate-x-1 transition-transform" : ""} />
                    </button>
                    {next && (
                        <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none">
                            <div className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl whitespace-nowrap text-right">
                                <span className="text-[10px] text-[var(--accent)] font-black uppercase tracking-widest block mb-0.5">Siguiente</span>
                                <span className="text-sm font-bold text-white">@{next}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Keyboard navigation helper */}
            <KeyboardNav prev={prev} next={next} />

            {/* Side floating arrows (Visual only, for mouse users) */}
            <div className="fixed top-1/2 -translate-y-1/2 left-8 hidden xl:block pointer-events-none">
                <AnimatePresence>
                    {prev && (
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 0.3, x: 0 }}
                            whileHover={{ opacity: 1, x: 2 }}
                            onClick={() => router.push(`/${prev}`)}
                            className="p-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm pointer-events-auto transition-all text-white"
                        >
                            <ChevronLeft size={32} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <div className="fixed top-1/2 -translate-y-1/2 right-8 hidden xl:block pointer-events-none">
                <AnimatePresence>
                    {next && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 0.3, x: 0 }}
                            whileHover={{ opacity: 1, x: -2 }}
                            onClick={() => router.push(`/${next}`)}
                            className="p-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm pointer-events-auto transition-all text-white"
                        >
                            <ChevronRight size={32} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function KeyboardNav({ prev, next }: { prev: string | null; next: string | null }) {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === "ArrowLeft" && prev) {
                router.push(`/${prev}`);
            } else if (e.key === "ArrowRight" && next) {
                router.push(`/${next}`);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [prev, next, router]);

    return null;
}
