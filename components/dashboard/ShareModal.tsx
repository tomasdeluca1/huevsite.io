"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Twitter, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  username: string;
  onUnlocked: () => void;
}

type Step = "prompt" | "tweeted" | "verifying" | "unlocked";

export function ShareModal({ isOpen, onClose, accentColor, username, onUnlocked }: Props) {
  const [step, setStep] = useState<Step>("prompt");
  const [isCapturing, setIsCapturing] = useState(false);
  const [tweetUrlInput, setTweetUrlInput] = useState("");

  const tweetText = encodeURIComponent(
    `Armé mi huevsite en huevsite.io — el portfolio para builders 🇦🇷\n\n👉 huevsite.io/${username}`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const handleTweet = async () => {
    setIsCapturing(true);
    try {
      // Intentar captura de screenshot del perfil via /api/og
      // Abrimos Twitter intent con el texto pre-llenado
      window.open(tweetUrl, "_blank", "width=600,height=450");
      setStep("tweeted");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleConfirmTweet = async () => {
    if (!tweetUrlInput.includes("twitter.com/") && !tweetUrlInput.includes("x.com/")) {
      alert("Uh, parece que ese link no es de Twitter/X. Fijate de copiar el link de tu tweet.");
      return;
    }

    setStep("verifying");
    try {
      const res = await fetch("/api/social/share-unlock", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetUrl: tweetUrlInput })
      });
      if (res.ok) {
        setStep("unlocked");
        onUnlocked();
      } else {
        const data = await res.json();
        alert(data.error || "Error al verificar el tweet.");
        setStep("tweeted");
      }
    } catch {
      alert("Error de conexión.");
      setStep("tweeted");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="portal-root fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 50 }}
          className="relative w-[90%] max-w-md bg-[var(--surface)] border border-[var(--border-bright)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 mx-auto"
        >
          <div className="p-8 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--surface2)] transition-all text-[var(--border-bright)] hover:text-white"
            >
              <X size={20} />
            </button>

            {step === "unlocked" ? (
              <UnlockedView accentColor={accentColor} onClose={onClose} />
            ) : (
              <PromptView
                step={step}
                accentColor={accentColor}
                username={username}
                isCapturing={isCapturing}
                tweetUrlInput={tweetUrlInput}
                setTweetUrlInput={setTweetUrlInput}
                onTweet={handleTweet}
                onConfirm={handleConfirmTweet}
                onUpgrade={() => { onClose(); window.location.href = "/api/checkout"; }}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

function PromptView({
  step,
  accentColor,
  username,
  isCapturing,
  tweetUrlInput,
  setTweetUrlInput,
  onTweet,
  onConfirm,
  onUpgrade,
}: {
  step: Step;
  accentColor: string;
  username: string;
  isCapturing: boolean;
  tweetUrlInput: string;
  setTweetUrlInput: (v: string) => void;
  onTweet: () => void;
  onConfirm: () => void;
  onUpgrade: () => void;
}) {
  return (
    <>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-black/40 border-2 text-white"
        style={{ borderColor: accentColor }}
      >
        <Sparkles size={28} style={{ color: accentColor }} />
      </div>

      <div className="section-label mb-2 mx-auto justify-center">// límite del plan free</div>
      <h3 className="text-2xl font-extrabold tracking-tight mb-3">
        Llegaste al límite.
      </h3>

      {step === "prompt" && (
        <>
          <p className="text-[var(--text-dim)] text-sm max-w-[280px] mx-auto leading-relaxed mb-8">
            ¿Querés <strong className="text-white">3 bloques más gratis</strong>?<br />
            Compartí tu huevsite en Twitter y te los desbloqueamos.
          </p>

          {/* Preview del perfil */}
          <div
            className="rounded-2xl border p-4 mb-8 text-left font-mono text-xs bg-black/30"
            style={{ borderColor: `${accentColor}30` }}
          >
            <p style={{ color: accentColor }}>→ huevsite.io/{username}</p>
            <p className="text-[var(--text-muted)] mt-1 text-[10px]">
              "Armé mi huevsite — el portfolio para builders 🇦🇷"
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onTweet}
              disabled={isCapturing}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all text-black"
              style={{ backgroundColor: accentColor, opacity: isCapturing ? 0.7 : 1 }}
            >
              {isCapturing ? (
                <><Loader2 size={16} className="animate-spin" /> Preparando tweet...</>
              ) : (
                <><Twitter size={16} /> Twittear con screenshot →</>
              )}
            </button>
            <button
              onClick={onUpgrade}
              className="w-full py-3 rounded-2xl border border-[var(--border-bright)] text-sm font-medium text-[var(--text-dim)] hover:text-white hover:border-white transition-all"
            >
              Ir a Pro — $5/mes
            </button>
          </div>
        </>
      )}

      {(step === "tweeted" || step === "verifying") && (
        <>
          <p className="text-[var(--text-dim)] text-sm max-w-[280px] mx-auto leading-relaxed mb-6">
            ¿Ya lo tuiteaste? Pegá el link de tu tweet acá abajo y te desbloqueamos los bloques.
          </p>

          <input
            type="text"
            placeholder="https://x.com/tomasmazzi/status/123..."
            value={tweetUrlInput}
            onChange={e => setTweetUrlInput(e.target.value)}
            className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-4 mb-6 text-sm outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
          />

          <button
            onClick={onConfirm}
            disabled={step === "verifying" || !tweetUrlInput}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all text-black disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {step === "verifying" ? (
              <><Loader2 size={16} className="animate-spin" /> Verificando...</>
            ) : (
              <>Verificar tweet y desbloquear ✅</>
            )}
          </button>
          <button
            onClick={onTweet}
            className="w-full mt-3 py-3 rounded-2xl border border-[var(--border-bright)] text-sm text-[var(--text-muted)] hover:text-white transition-all"
          >
            <Twitter size={14} className="inline mr-1" />
            Twittear de nuevo
          </button>
        </>
      )}
    </>
  );
}

function UnlockedView({ accentColor, onClose }: { accentColor: string; onClose: () => void }) {
  return (
    <>
      <CheckCircle2 size={48} className="mx-auto mb-6" style={{ color: accentColor }} />
      <div className="section-label mb-2 mx-auto justify-center">// bloques desbloqueados</div>
      <h3 className="text-2xl font-extrabold tracking-tight mb-3">
        ¡Gracias por compartir! 🇦🇷
      </h3>
      <p className="text-[var(--text-dim)] text-sm max-w-[260px] mx-auto leading-relaxed mb-8">
        Te agregamos 3 bloques extra. Ahora podés seguir armando tu portfolio.
      </p>
      <button
        onClick={onClose}
        className="w-full py-4 rounded-2xl font-bold text-sm text-black transition-all"
        style={{ backgroundColor: accentColor }}
      >
        Seguir buildeando →
      </button>
    </>
  );
}
