"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

const CONFIRMATION_TEXT = "Quiero eliminar mi cuenta";

interface DeleteAccountModalProps {
  isOpen: boolean;
  accentColor: string;
  onClose: () => void;
  onConfirm: (confirmation: string) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteAccountModal({
  isOpen,
  accentColor,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteAccountModalProps) {
  const t = useTranslations("dashboard");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setConfirmation("");
    }
  }, [isOpen]);

  const isMatch = confirmation === CONFIRMATION_TEXT;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={isDeleting ? undefined : onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            className="relative z-[560] w-full max-w-lg overflow-hidden rounded-[2rem] border border-red-500/20 bg-[#0A0A0A] shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
          >
            <div
              className="absolute inset-x-0 top-0 h-px opacity-70"
              style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
            />

            <div className="flex items-start justify-between border-b border-white/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <Trash2 size={22} />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-red-400/70">
                    {t("deleteAccount.dangerZone")}
                  </p>
                  <h3 className="text-2xl font-black tracking-tight text-white">
                    {t("deleteAccount.title")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">
                    {t("deleteAccount.description")}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-[1.5rem] border border-amber-500/15 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
                  <p className="text-sm leading-relaxed text-amber-100/75">
                    {t("deleteAccount.irreversible")}
                    <span className="mt-2 block rounded-xl bg-black/30 px-3 py-2 font-mono text-xs text-white">
                      {CONFIRMATION_TEXT}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  {t("deleteAccount.manualConfirmation")}
                </label>
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder={CONFIRMATION_TEXT}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isDeleting}
                  className="w-full rounded-[1.5rem] border border-white/10 bg-black/40 px-5 py-4 text-sm font-medium text-white outline-none transition-all placeholder:text-white/20 focus:border-red-400/60"
                />
                <p className={`px-1 text-xs ${isMatch ? "text-emerald-400" : "text-white/30"}`}>
                  {isMatch ? t("deleteAccount.phraseCorrect") : t("deleteAccount.phraseMismatch")}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 rounded-2xl bg-white/5 py-4 text-sm font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("deleteAccount.cancel")}
                </button>
                <button
                  onClick={() => onConfirm(confirmation)}
                  disabled={!isMatch || isDeleting}
                  className="flex flex-[1.2] items-center justify-center gap-2 rounded-2xl bg-red-500 py-4 text-sm font-black text-white transition-all hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-red-500/30 disabled:text-white/40"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  {isDeleting ? t("deleteAccount.deleting") : t("deleteAccount.deleteForever")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
