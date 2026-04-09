"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InterviewForm } from "@/components/builder-interview/InterviewForm";
import { ThankYouScreen } from "@/components/builder-interview/ThankYouScreen";
import { Loader2 } from "lucide-react";
import Link from "next/link";

type PageState =
  | { type: "loading" }
  | { type: "form"; builderName: string; builderUsername: string }
  | { type: "done"; builderName: string; builderUsername: string }
  | { type: "expired" }
  | { type: "already_submitted" }
  | { type: "error"; message: string };

export default function BuilderInterviewPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>({ type: "loading" });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/builder-interview/${token}`);
        if (res.ok) {
          const data = await res.json();
          setState({
            type: "form",
            builderName: data.builderName,
            builderUsername: data.builderUsername,
          });
        } else if (res.status === 410) {
          setState({ type: "expired" });
        } else if (res.status === 409) {
          setState({ type: "already_submitted" });
        } else {
          const data = await res.json();
          setState({ type: "error", message: data.error || "Algo salió mal." });
        }
      } catch {
        setState({ type: "error", message: "Error de conexión." });
      }
    }
    load();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-display flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <Link href="/" className="text-lg font-black tracking-tighter">
          HUEV<span className="text-[#C8FF00]">SITE</span>.IO
        </Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Builder de la Semana
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        {state.type === "loading" && (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C8FF00] mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">Cargando...</p>
          </div>
        )}

        {state.type === "form" && (
          <InterviewForm
            token={token}
            builderName={state.builderName}
            builderUsername={state.builderUsername}
            onComplete={() =>
              setState({
                type: "done",
                builderName: state.builderName,
                builderUsername: state.builderUsername,
              })
            }
          />
        )}

        {state.type === "done" && (
          <ThankYouScreen
            builderName={state.builderName}
            builderUsername={state.builderUsername}
          />
        )}

        {state.type === "expired" && (
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⏰</div>
            <h1 className="text-2xl font-extrabold text-white mb-3">Link expirado</h1>
            <p className="text-zinc-500">
              Este link ya no es válido. Si creés que es un error, contactá a Tomas.
            </p>
          </div>
        )}

        {state.type === "already_submitted" && (
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-extrabold text-white mb-3">Ya respondiste</h1>
            <p className="text-zinc-500">
              Tu entrevista ya fue enviada. Estamos procesando tu contenido.
            </p>
          </div>
        )}

        {state.type === "error" && (
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">😕</div>
            <h1 className="text-2xl font-extrabold text-white mb-3">Algo salió mal</h1>
            <p className="text-zinc-500">{state.message}</p>
          </div>
        )}
      </main>
    </div>
  );
}
