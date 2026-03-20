"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Link2, Loader2 } from "lucide-react";
import { type LinktreeImportData } from "@/lib/linktree-import";
import { type OnboardingState } from "@/lib/onboarding-types";

interface StepLinktreeProps {
  state: OnboardingState;
  onImport: (data: LinktreeImportData) => void;
  onNext: () => void;
}

export function StepLinktree({ state, onImport, onNext }: StepLinktreeProps) {
  const [mode, setMode] = useState<"ask" | "input">(() =>
    state.linktreeData ? "input" : "ask"
  );
  const [linktreeUrl, setLinktreeUrl] = useState(state.linktreeData?.sourceUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!linktreeUrl.trim()) {
      setError("Pega una URL de Linktree o Bio Site para importar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/linktree/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linktreeUrl.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No pudimos importar tu Linktree o Bio Site.");
      }

      onImport(data);
      onNext();
    } catch (importError) {
      console.error("Error importing Linktree:", importError);
      setError(
        importError instanceof Error
          ? importError.message
          : "No pudimos importar tu Linktree o Bio Site."
      );
    } finally {
      setLoading(false);
    }
  };

  if (state.linktreeData) {
    return (
      <div className="onboard-ui !max-w-xl !p-10">
        <div className="mb-10">
          <div className="section-label mb-2">// paso 02</div>
          <h1 className="ou-q !text-4xl">Links importados</h1>
          <p className="ou-sub !text-base">
            Ya trajimos tus links visibles. Ahora seguimos con GitHub para sumar más señal técnica.
          </p>
        </div>

        <div className="mb-8 rounded-[2rem] border border-[var(--border-bright)] bg-[var(--surface2)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl border border-[var(--border)] bg-black/30">
              {state.linktreeData.avatarUrl ? (
                <img
                  src={state.linktreeData.avatarUrl}
                  alt={state.linktreeData.displayName || "Perfil importado"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Globe size={20} className="text-[var(--accent)]" />
              )}
            </div>
            <div>
              <div className="text-lg font-bold">{state.linktreeData.displayName || "Perfil importado"}</div>
              <div className="text-sm font-mono text-[var(--text-muted)]">
                {state.linktreeData.links.length} links procesados
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={onNext} className="ou-next !py-5 !text-lg">
            Seguir con GitHub →
          </button>
          <button
            onClick={() => setMode("input")}
            className="w-full rounded-2xl border border-[var(--border-bright)] bg-transparent px-4 py-4 text-sm font-bold text-white transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Reimportar links
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2">// paso 02</div>
        <h1 className="ou-q !text-4xl">¿Tenés Linktree o Bio Site?</h1>
        <p className="ou-sub !text-base">
          Si ya tenés uno, lo usamos para arrancar el board con links y branding reales.
        </p>
      </div>

      {mode === "ask" ? (
        <div className="space-y-4">
          <button
            onClick={() => setMode("input")}
            className="w-full rounded-[2rem] border border-[var(--border-bright)] bg-[var(--surface2)] px-6 py-5 text-left transition-all hover:border-[var(--accent)]"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-bright)] bg-black/30">
                <Link2 size={18} className="text-[var(--accent)]" />
              </div>
              <div className="text-lg font-bold text-white">Sí, tengo</div>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Pegamos la URL y extraemos lo visible para convertirlo en bloques útiles.
            </p>
          </button>

          <button
            onClick={onNext}
            className="w-full rounded-[2rem] border border-[var(--border)] bg-black/20 px-6 py-5 text-left transition-all hover:border-white/20"
          >
            <div className="text-lg font-bold text-white">No tengo</div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Seguimos directo con GitHub y armamos el board desde ahí.
            </p>
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="rounded-[2rem] border border-[var(--border-bright)] bg-[var(--surface2)] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-bright)] bg-black/30">
                <Link2 size={18} className="text-[var(--accent)]" />
              </div>
              <div>
                <div className="font-bold text-white">Importar desde Linktree o Bio Site</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Leemos avatar, bio, títulos y thumbnails visibles.
                </div>
              </div>
            </div>

            <input
              type="url"
              value={linktreeUrl}
              onChange={(event) => setLinktreeUrl(event.target.value)}
              placeholder="https://linktr.ee/tuusuario o https://bio.site/tuusuario"
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setMode("ask")}
                className="flex-1 rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-4 text-sm font-bold text-white/70 transition-colors hover:border-white/20 hover:text-white"
              >
                Volver
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="ou-next !m-0 !flex-[1.4] !py-4 !text-base disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="mx-auto animate-spin" /> : "Importar y seguir →"}
              </button>
            </div>

            <button onClick={onNext} className="ou-skip block w-full">
              seguir sin importar links →
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
