"use client";

import { useState } from "react";
import { Github, Loader2 } from "lucide-react";
import { type OnboardingState, type GitHubData } from "@/lib/onboarding-types";

interface StepGitHubProps {
  state: OnboardingState;
  hasGitHubIdentity?: boolean;
  onConnect: (data: GitHubData) => void;
  onNext: () => void;
}

export function StepGitHub({ state, hasGitHubIdentity = false, onConnect, onNext }: StepGitHubProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/import");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No pudimos traer tu GitHub.");
      }

      const githubData = await response.json();
      onConnect({
        username: githubData.username,
        avatarUrl: githubData.avatarUrl || "",
        name: githubData.name || githubData.username,
        bio: githubData.bio || "",
        publicRepos: githubData.repos,
        followers: githubData.followers || 0,
        topLanguages: githubData.languages || [],
        topRepos: (githubData.topRepos || []).map((repo: any) => ({
          name: repo.name,
          stars: repo.stars,
          description: repo.description,
        })),
      });
      onNext();
    } catch (fetchError) {
      console.error("Error connecting to GitHub:", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "No pudimos traer tu GitHub.");
    } finally {
      setLoading(false);
    }
  };

  if (state.githubData) {
    return (
      <div className="onboard-ui !max-w-xl !p-10">
        <div className="mb-10">
          <div className="section-label mb-2">// paso 03</div>
          <h1 className="ou-q !text-4xl">GitHub conectado</h1>
          <p className="ou-sub !text-base">
            Ya tenemos tu perfil técnico. Seguimos con el estilo y publicamos.
          </p>
        </div>

        <div className="mb-8 rounded-[2rem] border border-[var(--border-bright)] bg-[var(--surface2)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[#00FF88] text-black font-black text-xl shadow-lg">
              {state.githubData.name[0]}
            </div>
            <div>
              <div className="text-lg font-bold">{state.githubData.name}</div>
              <div className="text-sm font-mono text-[var(--text-muted)]">@{state.githubData.username}</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-4">
            <Stat label="Repos" value={state.githubData.publicRepos} />
            <Stat label="Followers" value={state.githubData.followers} />
            <Stat label="Top repos" value={state.githubData.topRepos.length} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={onNext} className="ou-next !py-5 !text-lg">
            Seguir →
          </button>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full rounded-2xl border border-[var(--border-bright)] bg-transparent px-4 py-4 text-sm font-bold text-white transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Refrescar GitHub"}
          </button>
        </div>
      </div>
    );
  }

  const title = hasGitHubIdentity ? "Traé tu GitHub" : "¿Querés sumar GitHub?";
  const description = hasGitHubIdentity
    ? "Como entraste con GitHub, podemos traer repos, followers y lenguajes para que el board nazca con señal técnica real."
    : "Si tenés GitHub, podés conectarlo ahora para sumar repos, followers y lenguajes. Si no, seguí y lo hacés más tarde.";
  const buttonLabel = hasGitHubIdentity ? "Traer mi GitHub" : "Conectar GitHub ahora";
  const helperLabel = hasGitHubIdentity ? "Lo usamos para completar tu perfil técnico." : "Opcional, pero útil si querés mostrar señal técnica.";

  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2">// paso 03</div>
        <h1 className="ou-q !text-4xl">{title}</h1>
        <p className="ou-sub !text-base">
          {description}
        </p>
      </div>

      <div className="space-y-5">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-4 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-[var(--accent)] transition-all shadow-xl disabled:opacity-60"
        >
          {loading ? <Loader2 size={22} className="animate-spin" /> : <Github size={22} />}
          {loading ? "Trayendo data..." : buttonLabel}
        </button>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "📁", label: "Repos" },
            { icon: "👥", label: "Followers" },
            { icon: "⚡", label: "Stack" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-4 bg-[var(--surface2)] border border-[var(--border-bright)] rounded-2xl text-center"
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs text-[var(--text-muted)]">
          {helperLabel}
        </div>

        <button onClick={onNext} className="ou-skip !mt-8 block w-full">
          seguir sin github →
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="section-label !text-[8px] !text-[var(--text-muted)]">{label}</div>
    </div>
  );
}
