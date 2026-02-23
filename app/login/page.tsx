"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Loader2, Info, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "auth_failed") {
      setErrorMsg("No pudimos validar tu sesión. Intentá de nuevo.");
    }
  }, [searchParams]);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
          <div className="mb-10 text-center">
            <div className="section-label mb-2 mx-auto w-fit">// auth gateway</div>
            <h1 className="ou-q !text-3xl tracking-tight">Bienvenido, builder.</h1>
            <p className="ou-sub !text-base">
              Entrá para gestionar tu huevsite y mostrar lo nuevo.
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
              Continuar con GitHub
            </button>

            <div className="relative py-6 flex items-center">
              <div className="flex-grow border-t border-[var(--border)]"></div>
              <span className="flex-shrink mx-4 text-[10px] uppercase font-mono text-[var(--text-muted)] tracking-widest">o magic link</span>
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
                      placeholder="tu@email.com"
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
                        Enviame el link <ArrowRight size={18} />
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
                  <h3 className="text-xl font-bold tracking-tight text-white">¡Checkeá tu correo!</h3>
                  <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                    Te mandamos un link mágico a <br/>
                    <strong className="text-[var(--accent)]">{email}</strong>
                  </p>
                  <button 
                    onClick={() => setSent(false)}
                    className="text-[10px] uppercase font-mono text-[var(--text-muted)] hover:text-white transition-colors pt-4 block w-full"
                  >
                    ¿Te equivocaste de mail?
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-10 flex items-start gap-3 p-4 bg-white/[0.02] rounded-2xl border border-[var(--border-bright)]">
            <Info size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
              <strong>Importante:</strong> Bento.me anunció su cierre. Nosotros estamos rescatando a la comunidad. Si tenías cuenta allá, usa el mismo mail.
            </p>
          </div>
        </motion.div>

        <div className="mt-12 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-30">
          builder logic • real recognized real
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="landing min-h-screen bg-[var(--bg)] font-display flex items-center justify-center">
        <div className="text-[var(--text-muted)] font-mono text-sm">Cargando...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
