"use client";

import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";

export function NominateButton({ userId, accentColor }: { userId: string; accentColor: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "nominated" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/social/showcase/nominate?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
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
      setStatus("loading");
      try {
        const res = await fetch("/api/social/showcase/nominate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("nominated");
        } else {
          setStatus("error");
          setMsg(data.error ?? "Error al nominar.");
        }
      } catch {
        setStatus("error");
        setMsg("Error de conexión.");
      }
    }
  };

  return (
    <button
      onClick={toggleNominate}
      disabled={status === "loading"}
      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border"
      style={{ 
        backgroundColor: status === "nominated" ? "var(--surface2)" : accentColor,
        color: status === "nominated" ? "white" : "black",
        borderColor: status === "nominated" ? "var(--border-bright)" : "transparent",
        opacity: status === "loading" ? 0.7 : 1 
      }}
    >
      {status === "loading" ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Star 
          size={16} 
          fill={status === "nominated" ? "var(--accent)" : "transparent"} 
          color={status === "nominated" ? "var(--accent)" : "black"} 
        />
      )}
      <span>{status === "error" ? msg : (status === "nominated" ? "Nominado" : "Nominar")}</span>
    </button>
  );
}
