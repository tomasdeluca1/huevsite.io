"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Github, Link2 } from "lucide-react";
import { type LinktreeImportData } from "@/lib/linktree-import";
import { type OnboardingState, type GitHubData } from "@/lib/onboarding-types";

const MOCK_GITHUB: GitHubData = {
  username: "gonzaferrer",
  avatarUrl: "",
  name: "Gonzalo Ferrer",
  bio: "Fullstack dev. Building things in BA.",
  publicRepos: 28,
  followers: 412,
  topLanguages: ["TypeScript", "Rust", "Python"],
  topRepos: [
    { name: "flowkit", stars: 3200, description: "Onboarding SDK for SaaS apps" },
    { name: "argmin", stars: 890, description: "Minimal state manager for React" },
    { name: "latamql", stars: 340, description: "GraphQL toolkit con sabor LATAM" },
  ],
};

type ImportStatus = "idle" | "loading";
type ImportSource = "github" | "linktree" | null;

interface StepGitHubProps {
  state: OnboardingState;
  onConnect: (data: GitHubData) => void;
  onImportLinktree: (data: LinktreeImportData) => void;
  onSkip: () => void;
  onNext: () => void;
}

const IMPORT_STEPS: Record<Exclude<ImportSource, null>, string[]> = {
  github: [
    "Iniciando handshake con GitHub...",
    "Clonando metadatos de repositorios...",
    "Calculando actividad reciente...",
    "Identificando stack tecnológico...",
    "Preparando bloques sugeridos...",
  ],
  linktree: [
    "Abriendo tu Linktree con Playwright...",
    "Leyendo avatar, bio y links visibles...",
    "Filtrando ruido y enlaces duplicados...",
    "Clasificando plataformas y destinos...",
    "Armando un board inicial con más señal...",
  ],
};

export function StepGitHub({
  state,
  onConnect,
  onImportLinktree,
  onSkip,
  onNext,
}: StepGitHubProps) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [activeSource, setActiveSource] = useState<ImportSource>(null);
  const [importStep, setImportStep] = useState(0);
  const [showImporter, setShowImporter] = useState(false);
  const [linktreeUrl, setLinktreeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasImportedData = !!state.githubData || !!state.linktreeData;

  const runImportAnimation = async (source: Exclude<ImportSource, null>) => {
    const steps = IMPORT_STEPS[source];
    for (let i = 0; i < steps.length; i++) {
      setImportStep(i);
      await delay(450);
    }
  };

  const handleConnect = async () => {
    setStatus("loading");
    setActiveSource("github");
    setError(null);

    try {
      const response = await fetch("/api/github/import");
      if (!response.ok) throw new Error("Failed to fetch github data");

      const githubData = await response.json();
      await runImportAnimation("github");

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

      setShowImporter(false);
    } catch (fetchError) {
      console.error("Error connecting to GitHub:", fetchError);
      await runImportAnimation("github");
      onConnect(MOCK_GITHUB);
      setShowImporter(false);
    } finally {
      setStatus("idle");
      setActiveSource(null);
      setImportStep(0);
    }
  };

  const handleImportLinktree = async () => {
    if (!linktreeUrl.trim()) {
      setError("Pegá una URL de Linktree para importar.");
      return;
    }

    setStatus("loading");
    setActiveSource("linktree");
    setError(null);

    try {
      const response = await fetch("/api/linktree/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linktreeUrl.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No pudimos importar tu Linktree.");
      }

      await runImportAnimation("linktree");
      onImportLinktree(data);
      setShowImporter(false);
    } catch (importError) {
      console.error("Error importing Linktree:", importError);
      setError(
        importError instanceof Error
          ? importError.message
          : "No pudimos importar tu Linktree."
      );
    } finally {
      setStatus("idle");
      setActiveSource(null);
      setImportStep(0);
    }
  };

  if (hasImportedData && !showImporter && status === "idle") {
    return (
      <ImportDoneView
        githubData={state.githubData}
        linktreeData={state.linktreeData}
        onImportAnother={() => setShowImporter(true)}
        onNext={onNext}
      />
    );
  }

  const loadingSteps = activeSource ? IMPORT_STEPS[activeSource] : [];

  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2">// paso 02</div>
        <h1 className="ou-q !text-4xl">Traé lo que ya tenés</h1>
        <p className="ou-sub !text-base">
          Importá GitHub, Linktree o ambos. Así el board nace con contexto real y menos laburo manual.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-center gap-4 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-[var(--accent)] transition-all shadow-xl"
            >
              <Github size={22} />
              {state.githubData ? "Reconectar GitHub" : "Conectar con GitHub"}
            </button>

            <div className="rounded-[2rem] border border-[var(--border-bright)] bg-[var(--surface2)] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl border border-[var(--border-bright)] bg-black/30 flex items-center justify-center">
                  <Link2 size={18} className="text-[var(--accent)]" />
                </div>
                <div>
                  <div className="font-bold text-white">Importar desde Linktree</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Usamos Playwright para leer tus links y convertirlos en bloques.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="url"
                  value={linktreeUrl}
                  onChange={(event) => setLinktreeUrl(event.target.value)}
                  placeholder="https://linktr.ee/tuusuario"
                  className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                />
                <button
                  onClick={handleImportLinktree}
                  className="w-full rounded-2xl border border-[var(--border-bright)] bg-transparent px-4 py-4 text-sm font-bold text-white transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {state.linktreeData ? "Reimportar Linktree" : "Importar mi Linktree"}
                </button>
              </div>
            </div>

            {(state.githubData || state.linktreeData) && (
              <div className="rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-xs text-[var(--text-muted)]">
                Ya hay data cargada. Podés seguir ahora o sumar el otro origen antes de elegir layout.
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "📁", label: "Repos" },
                { icon: "🔗", label: "Links" },
                { icon: "⚡", label: "Board" },
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

            <button onClick={onSkip} className="ou-skip !mt-8 block w-full">
              seguir sin importar →
            </button>
          </motion.div>
        )}

        {status === "loading" && activeSource && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-black/50 border border-[var(--border-bright)] rounded-2xl p-6 font-mono text-xs">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">
                  {activeSource === "github" ? "github_import.sh" : "linktree_import.ts"}
                </span>
              </div>

              <div className="space-y-2 min-h-[120px]">
                {loadingSteps.slice(0, importStep + 1).map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={index === importStep ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}
                  >
                    <span className="text-[var(--text-muted)]">root@huevsite:~# </span>
                    {step}
                    {index === importStep && <BlinkCursor />}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="h-1 bg-[var(--surface2)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--accent)]"
                animate={{
                  width: `${((importStep + 1) / loadingSteps.length) * 100}%`,
                }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImportDoneView({
  githubData,
  linktreeData,
  onImportAnother,
  onNext,
}: {
  githubData: GitHubData | null;
  linktreeData: LinktreeImportData | null;
  onImportAnother: () => void;
  onNext: () => void;
}) {
  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2">// import listo ✓</div>
        <h1 className="ou-q !text-4xl">Ya tenemos material real</h1>
        <p className="ou-sub !text-base">
          Revisá lo que encontramos antes de elegir el layout del board.
        </p>
      </div>

      <div className="space-y-4 mb-10">
        {githubData && (
          <div className="bg-[var(--surface2)] border border-[var(--border-bright)] rounded-[2rem] p-6 space-y-5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[#00FF88] flex items-center justify-center text-black font-black text-xl shadow-lg">
                {githubData.name[0]}
              </div>
              <div>
                <div className="text-lg font-bold">{githubData.name}</div>
                <div className="text-sm font-mono text-[var(--text-muted)]">@{githubData.username}</div>
              </div>
            </div>

            <p className="text-sm text-[var(--text-dim)] leading-relaxed italic">
              &quot;{githubData.bio || "Perfil importado desde GitHub"}&quot;
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
              <Stat label="Repos" value={githubData.publicRepos} />
              <Stat label="Followers" value={githubData.followers} />
              <div>
                <div className="flex gap-1 flex-wrap mt-1">
                  {githubData.topLanguages.slice(0, 2).map((lang) => (
                    <span
                      key={lang}
                      className="text-[9px] font-mono px-1.5 py-0.5 bg-black/40 border border-[var(--border-bright)] rounded text-[var(--accent)]"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
                <div className="section-label !text-[8px] !text-[var(--text-muted)] mt-1">Stack</div>
              </div>
            </div>
          </div>
        )}

        {linktreeData && (
          <div className="bg-[var(--surface2)] border border-[var(--border-bright)] rounded-[2rem] p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl overflow-hidden bg-black/30 border border-[var(--border)] flex items-center justify-center">
                {linktreeData.avatarUrl ? (
                  <img
                    src={linktreeData.avatarUrl}
                    alt={linktreeData.displayName || "Linktree avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Globe size={20} className="text-[var(--accent)]" />
                )}
              </div>
              <div>
                <div className="text-lg font-bold">{linktreeData.displayName || "Linktree importado"}</div>
                <div className="text-sm font-mono text-[var(--text-muted)]">
                  {linktreeData.links.length} links listos para usar
                </div>
              </div>
            </div>

            {linktreeData.bio && (
              <p className="text-sm text-[var(--text-dim)] leading-relaxed italic">
                &quot;{linktreeData.bio}&quot;
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {linktreeData.links.slice(0, 5).map((link) => (
                <span
                  key={link.url}
                  className="rounded-full border border-[var(--border-bright)] bg-black/30 px-3 py-1 text-[11px] font-mono text-white/80"
                >
                  {link.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {(!githubData || !linktreeData) && (
          <button
            onClick={onImportAnother}
            className="w-full rounded-2xl border border-[var(--border-bright)] bg-transparent px-4 py-4 text-sm font-bold text-white transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Sumar {githubData ? "Linktree" : "GitHub"} también
          </button>
        )}

        <button onClick={onNext} className="ou-next !py-5 !text-lg">
          Seguir a elegir layout →
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

function BlinkCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
      className="inline-block w-2 h-4 bg-[var(--accent)] ml-1 align-middle"
    />
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
