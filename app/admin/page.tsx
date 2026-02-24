"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface NominatedUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  accent_color: string;
}

interface Finalist {
  userId: string;
  count: number;
  user: NominatedUser;
}

interface ShowcaseData {
  week: string;
  winner: { week: string; user: NominatedUser } | null;
  finalists: Finalist[];
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingWinner, setSettingWinner] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/social/showcase");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  const setWinner = async (userId: string, week: string) => {
    setSettingWinner(userId);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/showcase-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ userId, week }),
      });
      const json = await res.json();
      if (res.ok) {
        setFeedback({ type: "ok", msg: "Winner establecido correctamente 🏆" });
        await fetchData();
      } else {
        setFeedback({ type: "err", msg: json.error ?? "Error al establecer winner." });
      }
    } finally {
      setSettingWinner(null);
    }
  };

  const handleAuth = async () => {
    setAuthed(true);
    await fetchData();
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 font-display">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="section-label mb-2 justify-center">// acceso restringido</div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>
          </div>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && secret && handleAuth()}
            placeholder="Admin secret..."
            className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] outline-none font-mono text-sm"
          />
          <button
            onClick={handleAuth}
            disabled={!secret}
            className="w-full py-4 rounded-2xl font-bold text-black bg-[var(--accent)]"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display py-12 px-4 max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <div className="section-label mb-1">// panel admin</div>
          <h1 className="text-4xl font-extrabold tracking-tight">Showcase Admin</h1>
        </div>
        <Link href="/" className="logo text-base">huev<span>site</span>.io</Link>
      </header>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-2xl mb-8 ${
            feedback.type === "ok"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{feedback.msg}</span>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
        </div>
      ) : data ? (
        <div className="space-y-10">
          {/* Semana actual */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Semana</div>
            <div className="font-bold font-mono text-lg">{data.week}</div>
          </div>

          {/* Winner actual */}
          {data.winner && (
            <div>
              <div className="section-label mb-4">// winner actual</div>
              <div
                className="flex items-center gap-4 p-5 rounded-2xl border-2"
                style={{ borderColor: data.winner.user.accent_color }}
              >
                <Trophy size={24} style={{ color: data.winner.user.accent_color }} />
                <div>
                  <p className="font-bold" style={{ color: data.winner.user.accent_color }}>
                    {data.winner.user.name ?? data.winner.user.username}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">@{data.winner.user.username}</p>
                </div>
              </div>
            </div>
          )}

          {/* Finalistas */}
          <div>
            <div className="section-label mb-4">// finalistas — elegí el winner</div>
            {data.finalists.length === 0 ? (
              <p className="text-[var(--text-dim)] font-mono text-sm">
                Sin nominaciones esta semana todavía.
              </p>
            ) : (
              <div className="space-y-3">
                {data.finalists.map((finalist, i) => (
                  <motion.div
                    key={finalist.userId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
                  >
                    {finalist.user.image ? (
                      <img src={finalist.user.image} alt={finalist.user.username} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black shrink-0"
                        style={{ backgroundColor: finalist.user.accent_color }}
                      >
                        {(finalist.user.name ?? finalist.user.username)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: finalist.user.accent_color }}>
                        {finalist.user.name ?? finalist.user.username}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">
                        {finalist.count} nominación{finalist.count !== 1 ? "es" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setWinner(finalist.userId, data.week)}
                      disabled={settingWinner === finalist.userId}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all"
                      style={{ backgroundColor: finalist.user.accent_color, opacity: settingWinner === finalist.userId ? 0.7 : 1 }}
                    >
                      {settingWinner === finalist.userId ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <><Trophy size={14} /> Elegir winner</>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[var(--text-dim)] font-mono text-sm text-center py-24">
          Error cargando datos del showcase.
        </p>
      )}
    </div>
  );
}
