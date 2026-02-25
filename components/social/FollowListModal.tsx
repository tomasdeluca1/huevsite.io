"use client";

import { X, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, userId, type]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/social/${type}?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data[type] || []);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
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
          <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-black/40">
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
                          {(user.name || user.username).substring(0, 2).toUpperCase()}
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
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
