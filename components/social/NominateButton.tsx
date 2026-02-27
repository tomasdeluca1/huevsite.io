"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, Info } from "lucide-react";
import Link from "next/link";

interface NominatedUser {
  username: string;
  name: string | null;
}

export function NominateButton({ userId, accentColor }: { userId: string; accentColor: string }) {
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

      {showModal && anotherNominated && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Cambiar nominación</h3>
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-sm text-[var(--text-dim)]">
                ¿Seguro que querés dejar de nominar a <strong className="text-white">@{anotherNominated.username}</strong> y nominar a este builder?
              </p>
              <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] mt-2">
                <p className="text-xs text-[var(--text-muted)] flex gap-2">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  Podés cambiar tu voto las veces que quieras, el recuento final de la semana cierra el domingo a la medianoche.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] font-bold text-sm hover:bg-[var(--surface2)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => executeNominate(true)}
                className="flex-1 px-4 py-2.5 rounded-xl text-black font-bold text-sm transition-colors hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                Cambiar voto
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
