"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { type OnboardingState } from "@/lib/onboarding-types";
import { Loader2, Check, AlertCircle } from "lucide-react";

interface StepUsernameProps {
  state: OnboardingState;
  onChange: (username: string, available: boolean | null) => void;
  onFinish: () => void;
  creating?: boolean;
  error?: string | null;
}

export function StepUsername({ state, onChange, onFinish, creating = false, error = null }: StepUsernameProps) {
  const t = useTranslations("onboarding");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(state.usernameAvailable ?? null);
  const [reserved, setReserved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accent = state.accentColor;

  const validate = (val: string) => /^[a-z0-9_]{3,20}$/.test(val);

  useEffect(() => {
    setAvailable(state.usernameAvailable ?? null);
  }, [state.usernameAvailable]);

  useEffect(() => {
    if (!state.username || !validate(state.username) || state.usernameAvailable !== true) {
      return;
    }

    setAvailable(true);
    setChecking(false);
  }, [state.username, state.usernameAvailable]);

  const handleChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    onChange(clean, null);
    setReserved(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!clean || !validate(clean)) {
      setAvailable(null);
      setChecking(false);
      return;
    }

    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/username/check?u=${clean}`);
        const data = await response.json();

        setReserved(!!data.reserved);
        if (data.error && !data.reserved) {
          setAvailable(false);
        } else {
          setAvailable(data.available);
          onChange(clean, data.available);
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 700);
  };

  const canFinish = state.username.length >= 3 && validate(state.username) && available === true;

  return (
    <div className="onboard-ui !max-w-xl !p-10">
      <div className="mb-10">
        <div className="section-label mb-2" style={{ color: accent }}>{t("step4Label")}</div>
        <h1 className="ou-q !text-4xl">{t("usernameTitle")}</h1>
        <p className="ou-sub !text-base">{t("usernameSubtitle")}</p>
      </div>

      <div className="space-y-4 mb-10">
        <div className="relative">
          <div
            className="flex items-center gap-3 w-full bg-[var(--surface2)] border border-[var(--border-bright)] rounded-2xl px-6 py-5 focus-within:border-[var(--accent)] transition-all"
            style={{ '--accent': accent } as any}
          >
            <span className="shrink-0 font-mono text-[var(--text-muted)] text-base sm:text-lg">
              huevsite.io/
            </span>
            <input
              type="text"
              value={state.username}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={t("usernamePlaceholder")}
              className="min-w-0 flex-1 bg-transparent border-none font-mono text-xl text-white outline-none p-0 placeholder:text-[var(--text-muted)]/50"
              autoFocus
            />
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            {checking && <Loader2 className="animate-spin text-[var(--text-dim)]" size={20} />}
            {!checking && available === true && <Check className="text-[var(--accent)]" size={24} style={{ color: accent }} />}
            {!checking && available === false && <AlertCircle className="text-red-500" size={24} />}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {available === false && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 font-mono px-2"
            >
              {reserved ? t("usernameReserved") : t("usernameTaken")}
            </motion.p>
          )}
          {available === true && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-mono px-2"
              style={{ color: accent }}
            >
              {t("usernameAvailable")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-500 font-mono">{error}</p>
        </div>
      )}

      <button
        onClick={canFinish && !creating ? onFinish : undefined}
        disabled={!canFinish || creating}
        className="ou-next !py-5 !text-lg !text-black flex items-center justify-center gap-2"
        style={{
          background: canFinish && !creating ? accent : 'var(--surface2)',
          opacity: canFinish && !creating ? 1 : 0.5,
          cursor: canFinish && !creating ? 'pointer' : 'not-allowed'
        }}
      >
        {creating && <Loader2 className="animate-spin" size={20} />}
        {creating ? t("usernameCreating") : canFinish ? t("usernamePublish") : t("usernameChooseAvailable")}
      </button>

      <div className="mt-8 text-center text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-[0.2em] opacity-40">
        {t("usernameFooter")}
      </div>
    </div>
  );
}
