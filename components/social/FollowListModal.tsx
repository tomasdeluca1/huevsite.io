"use client";

import { X, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FollowUser {
  id: string;
  username: string;
  name: string;
  image?: string;
  accent_color?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
  accentColor: string;
}

export function FollowListModal({ isOpen, onClose, userId, type, accentColor }: Props) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setPage(0);
      loadUsers(0, true, search);
    }
  }, [isOpen, userId, type, search]);

  const loadUsers = async (pageToLoad: number, reset = false, query = "") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/social/${type}?userId=${userId}&page=${pageToLoad}&q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setUsers(data[type] || []);
        } else {
          setUsers(prev => [...prev, ...(data[type] || [])]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadUsers(nextPage, false, search);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="portal-root fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-[90%] max-w-md bg-[var(--surface)] border border-[var(--border-bright)] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col z-10 max-h-[80vh]"
        >
          <div className="p-6 border-b border-[var(--border)] bg-black/40">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold tracking-tight capitalize">
                {type === "followers" ? "Seguidores" : "Siguiendo"}
              </h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--surface2)] transition-all text-[var(--text-muted)] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar builder..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>
          </div>

          <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-[var(--text-muted)]">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm font-mono uppercase tracking-widest">Cargando...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-dim)] font-mono text-sm px-4 whitespace-pre-line">
                {type === "followers" 
                  ? "Todavía no lo sigue nadie. \n¡Sé el primero!" 
                  : "Todavía no sigue a nadie."}
              </div>
            ) : (
              <div className="space-y-1">
                {users.map((user) => (
                  <Link
                    href={`/${user.username}`}
                    key={user.id}
                    onClick={onClose}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div 
                      className="w-10 h-10 rounded-full bg-[var(--surface2)] flex items-center justify-center text-sm font-bold border border-white/5 overflow-hidden"
                    >
                      {user.image ? (
                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ color: user.accent_color || accentColor }}>
                          {(user.name || user.username).substring(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm tracking-tight group-hover:text-white transition-colors">
                        {user.name || user.username}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--text-dim)]">
                        @{user.username}
                      </div>
                    </div>
                  </Link>
                ))}
                
                {hasMore && (
                  <button 
                    onClick={handleLoadMore}
                    className="w-full py-4 text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] hover:text-white transition-all"
                  >
                    {isLoading ? "Cargando..." : "Ver más"}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
