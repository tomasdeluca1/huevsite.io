"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Loader2, Info, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

function LoginContent() {
  const t = useTranslations("login");
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingClaim, setPendingClaim] = useState<string | null>(null);

  const refParam = searchParams.get("ref");
  const nextParam = searchParams.get("next") ?? (refParam ? `/onboarding?ref=${refParam}` : null);

  // Landing claim-bar handoff: the visitor already typed an available username
  // (next=/onboarding?claim=X + localStorage). Showing it here keeps the thread
  // alive through the auth step instead of dropping them on a generic login.
  useEffect(() => {
    let claim: string | null = null;
    const match = nextParam?.match(/[?&]claim=([a-zA-Z0-9_]{3,20})/);
    if (match) claim = match[1].toLowerCase();
    if (!claim) claim = window.localStorage.getItem("huevsite_pending_claim");
    if (claim && /^[a-z0-9_]{3,20}$/.test(claim)) setPendingClaim(claim);
  }, [nextParam]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "auth_failed") {
      setErrorMsg(t("errorAuthFailed"));
    }
  }, [searchParams]);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (nextParam) {
      callbackUrl.searchParams.set("next", nextParam);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (nextParam) {
      callbackUrl.searchParams.set("next", nextParam);
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="landing min-h-screen bg-[var(--bg)] font-display">
      <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(200,255,0,0.08)_0%,transparent 70%)] pointer-events-none z-0" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mb-12"
        >
          <Link href="/" className="logo !text-2xl">huev<span>site</span>.io</Link>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="onboard-ui w-full max-w-md relative z-10 !p-10 shadow-2xl"
        >
          {pendingClaim && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3 text-[13px] font-mono text-center">
              <span className="text-[var(--text-dim)]">{t("claimBanner")}</span>
              <span className="font-bold text-[var(--accent)]">huevsite.io/{pendingClaim}</span>
            </div>
          )}

          <div className="mb-10 text-center">
            <div className="section-label mb-2 mx-auto w-fit">{t("authGatewayLabel")}</div>
            <h1 className="ou-q !text-3xl tracking-tight">{t("title")}</h1>
            <p className="ou-sub !text-base">
              {t("subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono flex items-center gap-2"
              >
                <AlertTriangle size={14} /> {errorMsg}
              </motion.div>
            )}

            <button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border border-[var(--border-bright)] bg-[var(--surface2)] hover:bg-[var(--surface)] hover:border-[var(--accent)] transition-all font-bold text-sm disabled:opacity-50 group"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Github size={20} className="group-hover:rotate-12 transition-transform" />}
              {t("continueWithGithub")}
            </button>

            <div className="relative py-6 flex items-center">
              <div className="flex-grow border-t border-[var(--border)]"></div>
              <span className="flex-shrink mx-4 text-[10px] uppercase font-mono text-[var(--text-muted)] tracking-widest">{t("orMagicLink")}</span>
              <div className="flex-grow border-t border-[var(--border)]"></div>
            </div>

            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.form
                  key="login-form"
                  onSubmit={handleEmailLogin}
                  className="space-y-4"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="space-y-2">
                    <input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-all text-base font-mono placeholder:text-[var(--text-muted)]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ou-next !py-4 !flex !items-center !justify-center gap-2 disabled:opacity-50 !text-black shadow-lg"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        {t("sendMeTheLink")} <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="sent-message"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 rounded-[2rem] border border-[var(--accent)] bg-[var(--accent-dim)] text-center space-y-4 shadow-xl"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--accent)] text-black flex items-center justify-center mx-auto mb-2">
                    <ArrowRight size={32} className="-rotate-45" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white">{t("checkYourEmail")}</h3>
                  <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                    {t("magicLinkSentTo")} <br />
                    <strong className="text-[var(--accent)]">{email}</strong>
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="text-[10px] uppercase font-mono text-[var(--text-muted)] hover:text-white transition-colors pt-4 block w-full"
                  >
                    {t("wrongEmail")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-10 flex items-start gap-3 p-4 bg-white/[0.02] rounded-2xl border border-[var(--border-bright)]">
            <Info size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
              <strong>{t("tipLabel")}</strong> {t("tipBody")}
            </p>
          </div>
        </motion.div>

        <div className="mt-12 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-30">
          {t("footerTagline")}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations("login");
  return (
    <Suspense fallback={
      <div className="landing min-h-screen bg-[var(--bg)] font-display flex items-center justify-center">
        <div className="text-[var(--text-muted)] font-mono text-sm">{t("loading")}</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
