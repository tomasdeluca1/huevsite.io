"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface NominatedUser {
  username: string;
  name: string | null;
}

export function NominateButton({ 
  userId, 
  accentColor,
  onStatusChange 
}: { 
  userId: string; 
  accentColor: string;
  onStatusChange?: (nominated: boolean) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "nominated" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [anotherNominated, setAnotherNominated] = useState<NominatedUser | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/social/showcase/nominate?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRemaining(data.remaining);
        setAnotherNominated(data.nominatedUser && !data.hasNominated ? data.nominatedUser : null);
        
        if (data.hasNominated) {
          setStatus("nominated");
        } else {
          setStatus("idle");
        }
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  };

  const toggleNominate = async () => {
    if (status === "nominated") {
      // Un-nominate
      setStatus("loading");
      try {
        const res = await fetch(`/api/social/showcase/nominate?userId=${userId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setStatus("idle");
          setRemaining(1);
          setAnotherNominated(null);
          onStatusChange?.(false);
        } else {
          setStatus("error");
          const data = await res.json();
          setMsg(data.error ?? "Error al desnominar.");
        }
      } catch {
        setStatus("error");
        setMsg("Error de conexión.");
      }
    } else {
      // Nominate
      if (anotherNominated) {
        setShowModal(true);
        return;
      }

      executeNominate(false);
    }
  };

  const executeNominate = async (override: boolean) => {
    setStatus("loading");
    setShowModal(false);
    try {
      const res = await fetch("/api/social/showcase/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, override }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("nominated");
        setRemaining(0);
        setAnotherNominated(null);
        onStatusChange?.(true);
      } else {
        if (res.status === 409 && data.nominatedUser) {
          setAnotherNominated(data.nominatedUser);
          setShowModal(true);
          setStatus("idle");
          return;
        }

        setStatus("error");
        setMsg(data.error ?? "Error al nominar.");
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      setStatus("error");
      setMsg("Error de conexión.");
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={toggleNominate}
          disabled={status === "loading"}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border group"
          style={{ 
            backgroundColor: status === "nominated" ? "var(--surface2)" : (anotherNominated ? "var(--surface2)" : accentColor),
            color: status === "nominated" ? "white" : (anotherNominated ? "var(--text-dim)" : "black"),
            borderColor: status === "nominated" ? "var(--border-bright)" : (anotherNominated ? "var(--border)" : "transparent"),
            opacity: status === "loading" ? 0.7 : 1,
            cursor: "pointer"
          }}
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Star 
              size={16} 
              fill={status === "nominated" ? "var(--accent)" : "transparent"} 
              color={status === "nominated" ? "var(--accent)" : (anotherNominated ? "var(--text-dim)" : "black")} 
            />
          )}
          <span>{status === "error" ? msg : (status === "nominated" ? "Nominado" : "Nominar")}</span>
        </button>

        {anotherNominated && status !== "nominated" && (
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--text-muted)] mt-1 animate-in fade-in slide-in-from-top-1">
            <Info size={10} />
            <span>Ya nominaste a </span>
            <Link 
              href={`/${anotherNominated.username}`}
              className="text-[var(--accent)] hover:underline"
            >
              @{anotherNominated.username}
            </Link>
          </div>
        )}

        {remaining !== null && !anotherNominated && status !== "nominated" && status !== "loading" && (
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            {remaining} disponible esta semana
          </span>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && anotherNominated && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 max-w-md w-full relative shadow-2xl overflow-hidden"
            >
              {/* Subtle accent glow */}
              <div 
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />

              <h3 className="text-2xl font-black mb-4 tracking-tighter">¿Cambiar nominación?</h3>
              
              <div className="space-y-4 mb-8">
                <p className="text-base text-[var(--text-dim)] leading-relaxed">
                  Ya nominaste a <strong className="text-white">@{anotherNominated.username}</strong> esta semana.
                </p>
                <p className="text-base text-[var(--text-dim)] leading-relaxed">
                  ¿Querés cambiar tu voto para nominar a este builder en su lugar?
                </p>
                
                <div className="p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--border)] flex gap-3">
                  <Info size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-muted)] leading-normal">
                    Tu voto final es el que cuenta al cierre de la semana (domingo a la medianoche). Podés cambiarlo todas las veces que quieras.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3.5 rounded-2xl border border-[var(--border)] font-bold text-sm hover:bg-[var(--surface2)] transition-all order-2 sm:order-1"
                >
                  Mantener anterior
                </button>
                <button
                  onClick={() => executeNominate(true)}
                  className="flex-1 px-6 py-3.5 rounded-2xl text-black font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20 order-1 sm:order-2"
                  style={{ backgroundColor: accentColor }}
                >
                  Sí, cambiar voto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
