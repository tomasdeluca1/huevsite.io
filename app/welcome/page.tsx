"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Loader2, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (username.length < 3) {
      setAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setChecking(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      
      setAvailable(!data && !error);
      setChecking(false);
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!available) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const githubHandle = user.user_metadata.user_name || user.user_metadata.preferred_username || "";

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: username.toLowerCase(),
      name: user.user_metadata.full_name || username,
      image: user.user_metadata.avatar_url,
      github_handle: githubHandle,
    });

    if (error) {
      console.error("Profile creation error:", error);
      setError(`Error DB: ${error.message} (Code: ${error.code})`);
      setLoading(false);
      return;
    } 

    // Crear un bento grid por defecto interesante para el usuario
    const initialBlocks: any[] = [
      {
        user_id: user.id,
        type: "hero",
        order: 0,
        col_span: 2,
        row_span: 1,
        data: {
          name: user.user_metadata.full_name || username,
          avatarUrl: user.user_metadata.avatar_url || "",
          tagline: "Recién llegado a huevsite.io 👋",
          roles: [],
          status: "explorando",
          location: "Argentina 🇦🇷",
        },
        visible: true
      },
      {
        user_id: user.id,
        type: "building",
        order: 1,
        col_span: 2,
        row_span: 1,
        data: {
          project: "Mi primer proyecto",
          description: "Configurando mi bento en huevsite.io para mostrar lo que buildeo.",
          stack: ["React", "Next.js", "Supabase"],
          link: "https://huevsite.io"
        },
        visible: true
      }
    ];

    if (githubHandle) {
      initialBlocks.push({
        user_id: user.id,
        type: "github",
        order: 2,
        col_span: 2,
        row_span: 1,
        data: {
          username: githubHandle,
          stats: { stars: 0, repos: 0, followers: 0 }
        },
        visible: true
      });
    }

    await supabase.from("blocks").insert(initialBlocks);

    router.push("/dashboard");
  };

  return (
    <div className="landing min-h-screen bg-[var(--bg)] font-display">
      <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(200,255,0,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="onboard-ui w-full max-w-md relative z-10 !p-10 shadow-2xl"
        >
          <div className="mb-8">
            <div className="section-label mb-2">// setup inicial</div>
            <h1 className="ou-q !text-3xl tracking-tight">Elegí tu username</h1>
            <p className="ou-sub !text-base">
              Tu URL pública será: <br/>
              <span className="text-[var(--accent)] font-mono font-bold">huevsite.io/{username || 'username'}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                placeholder="tu-username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())}
                className="w-full p-4 pr-12 rounded-2xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-all text-xl font-mono placeholder:text-[var(--text-muted)]"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="animate-spin text-[var(--text-dim)]" size={24} />}
                {!checking && available === true && <Check className="text-[var(--accent)]" size={24} />}
                {!checking && available === false && <AlertCircle className="text-red-500" size={24} />}
              </div>
            </div>

            {available === false && (
              <p className="text-[11px] text-red-500 font-mono px-2">
                ✕ Uh, ese ya lo manotearon. Probá con otro.
              </p>
            )}

            {error && (
              <p className="text-[11px] text-red-500 font-mono px-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!available || loading}
              className="ou-next !py-4 flex items-center justify-center gap-2 disabled:opacity-50 !text-black shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Empezar a buildar →"}
            </button>
          </form>

          <div className="ou-skip text-center mt-8">
            Tranqui, después podés cambiarlo si te arrepentís.
          </div>
        </motion.div>
      </main>
    </div>
  );
}
