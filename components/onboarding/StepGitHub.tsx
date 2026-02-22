"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type OnboardingState, type GitHubData } from "@/lib/onboarding-types";

// Mock GitHub data
const MOCK_GITHUB: GitHubData = {
  username: "gonzaferrer",
  avatarUrl: "",
  name: "Gonzalo Ferrer",
  bio: "Fullstack dev. Building things in BA 🇦🇷",
  publicRepos: 28,
  followers: 412,
  topLanguages: ["TypeScript", "Rust", "Python"],
  topRepos: [
    { name: "flowkit", stars: 3200, description: "Onboarding SDK for SaaS apps" },
    { name: "argmin", stars: 890, description: "Minimal state manager for React" },
    { name: "latamql", stars: 340, description: "GraphQL toolkit con sabor LATAM" },
  ],
};

type ImportStatus = "idle" | "connecting" | "importing" | "done";

interface StepGitHubProps {
  state: OnboardingState;
  onConnect: (data: GitHubData) => void;
  onSkip: () => void;
  onNext: () => void;
}

const IMPORT_STEPS = [
  "Iniciando handshake con GitHub...",
  "Clonando metadatos de repositorios...",
  "Calculando actividad de commits (2024)...",
  "Identificando stack tecnológico...",
  "Generando bloques sugeridos...",
];

export function StepGitHub({ state, onConnect, onSkip, onNext }: StepGitHubProps) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [importStep, setImportStep] = useState(0);

  const handleConnect = async () => {
    setStatus("connecting");
    await delay(800);
    setStatus("importing");

    for (let i = 0; i < IMPORT_STEPS.length; i++) {
      setImportStep(i);
      await delay(700);
    }

    onConnect(MOCK_GITHUB);
    setStatus("done");
  };

  if (status === "done" && state.githubData) {
    return <GitHubDoneView data={state.githubData} onNext={onNext} />;
  }

  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2">// paso 02</div>
        <h1 className="ou-q !text-4xl">¿Estás buildando algo?</h1>
        <p className="ou-sub !text-base">Conectá GitHub y armamos tu perfil solo. Sin mentiras en el CV.</p>
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
              <GithubIcon />
              Conectar con GitHub
            </button>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "📁", label: "Repos" },
                { icon: "🔥", label: "Heatmap" },
                { icon: "⭐", label: "Stars" },
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
            
            <button
              onClick={onSkip}
              className="ou-skip !mt-8 block w-full"
            >
              no tengo GitHub, cargar manual →
            </button>
          </motion.div>
        )}

        {(status === "connecting" || status === "importing") && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-black/50 border border-[var(--border-bright)] rounded-2xl p-6 font-mono text-xs">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">github_import.sh</span>
              </div>
              
              <div className="space-y-2 min-h-[120px]">
                {IMPORT_STEPS.slice(0, importStep + 1).map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={i === importStep ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}
                  >
                    <span className="text-[var(--text-muted)]">root@huevsite:~# </span>
                    {s}
                    {i === importStep && <BlinkCursor />}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="h-1 bg-[var(--surface2)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--accent)]"
                animate={{
                  width: `${((importStep + 1) / IMPORT_STEPS.length) * 100}%`,
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

function GitHubDoneView({ data, onNext }: { data: GitHubData; onNext: () => void }) {
  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2">// github conectado ✓</div>
        <h1 className="ou-q !text-4xl">¡La puta madre, quedó flama!</h1>
        <p className="ou-sub !text-base">Revisá lo que encontramos en tu GitHub.</p>
      </div>

      <div className="bg-[var(--surface2)] border border-[var(--border-bright)] rounded-[2rem] p-8 space-y-6 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[#00FF88] flex items-center justify-center text-black font-black text-2xl shadow-lg">
            {data.name[0]}
          </div>
          <div>
            <div className="text-xl font-bold">{data.name}</div>
            <div className="text-sm font-mono text-[var(--text-muted)]">@{data.username}</div>
          </div>
        </div>

        <p className="text-sm text-[var(--text-dim)] leading-relaxed italic">&quot;{data.bio}&quot;</p>

        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[var(--border)]">
          <div>
            <div className="text-2xl font-black text-white">{data.publicRepos}</div>
            <div className="section-label !text-[8px] !text-[var(--text-muted)]">Repos</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{data.followers}</div>
            <div className="section-label !text-[8px] !text-[var(--text-muted)]">Followers</div>
          </div>
          <div>
             <div className="flex gap-1 flex-wrap mt-1">
              {data.topLanguages.slice(0, 2).map((lang) => (
                <span key={lang} className="text-[9px] font-mono px-1.5 py-0.5 bg-black/40 border border-[var(--border-bright)] rounded text-[var(--accent)]">
                  {lang}
                </span>
              ))}
            </div>
            <div className="section-label !text-[8px] !text-[var(--text-muted)] mt-1">Stack</div>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="ou-next !py-5 !text-lg"
      >
        Seguir a elegir layout →
      </button>
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

function GithubIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
