"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, CheckCircle2, Loader2, BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { buildLemonCheckoutUrl } from "@/lib/lemon-checkout-url";
import { supabase } from "@/lib/supabase";
import { FreeTrialState } from "@/lib/profile-types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  freeTrial?: FreeTrialState;
  onClaimTrial?: () => Promise<void> | void;
  isClaimingTrial?: boolean;
}

export function UpgradeModal({ isOpen, onClose, accentColor, freeTrial, onClaimTrial, isClaimingTrial = false }: Props) {
  const t = useTranslations("dashboard");
  const showTrialCTA = !!freeTrial?.eligible && !!onClaimTrial;

  // Redirect to checkout carrying the logged-in user's id + email so the LS
  // webhook maps the purchase to them deterministically.
  const handleUpgrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    window.location.href = buildLemonCheckoutUrl(user?.id, user?.email);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="portal-root fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-0">
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
          className="relative w-[90%] max-w-lg bg-[var(--surface)] border border-[var(--border-bright)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 mx-auto"
        >
          <div className="relative p-8 pb-0 text-center">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--surface2)] transition-all text-[var(--border-bright)] hover:text-white"
            >
              <X size={20} />
            </button>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-black/40 border-2"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              <Sparkles size={32} />
            </div>
            <div className="section-label mb-2 mx-auto justify-center">// {t("upgradeModal.eyebrow")}</div>
            <h3 className="text-3xl font-extrabold tracking-tight mb-4">
              {showTrialCTA ? t("upgradeModal.titleTrial") : t("upgradeModal.title")}
            </h3>
            <p className="text-[var(--text-dim)] text-sm mx-auto max-w-[280px] leading-relaxed">
              {showTrialCTA
                ? t("upgradeModal.subtitleTrial")
                : t("upgradeModal.subtitle")}
            </p>
          </div>

          <div className="p-8 pb-6">
            <div className="space-y-4 mb-8">
              {[
                t("upgradeModal.benefit1"),
                t("upgradeModal.benefit2"),
                t("upgradeModal.benefit3"),
                t("upgradeModal.benefit4")
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={18} style={{ color: accentColor }} className="shrink-0" />
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {showTrialCTA ? (
              <button
                onClick={onClaimTrial}
                disabled={isClaimingTrial}
                className="btn btn-accent w-full py-4 text-base font-bold shadow-[0_0_20px_rgba(200,255,0,0.15)] flex justify-center items-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: accentColor, color: "black" }}
              >
                {isClaimingTrial ? <Loader2 size={18} className="animate-spin" /> : <BadgeCheck size={18} />}
                {t("upgradeModal.claimTrial")}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                className="btn btn-accent w-full py-4 text-base font-bold shadow-[0_0_20px_rgba(200,255,0,0.15)] flex justify-center items-center"
                style={{ backgroundColor: accentColor, color: "black" }}
              >
                {t("upgradeModal.upgradeCta")}
              </button>
            )}
            <p className="text-center text-[10px] text-[var(--text-muted)] mt-4 font-mono uppercase tracking-widest">
              {showTrialCTA ? t("upgradeModal.footerTrial") : t("upgradeModal.footer")}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
