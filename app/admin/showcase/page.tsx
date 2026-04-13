"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Search,
} from "lucide-react";

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
  winners: Array<{ week: string; user: NominatedUser }>;
  finalists: Finalist[];
}

export default function ShowcasePage() {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingWinner, setSettingWinner] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

  const setWinner = async (userId: string, week: string) => {
    setSettingWinner(userId);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/showcase-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, week }),
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: "Winner establecido correctamente 🏆" });
        await fetchData();
      } else {
        setMsg({
          type: "err",
          text: json.error ?? "Error al establecer winner.",
        });
      }
    } finally {
      setSettingWinner(null);
    }
  };

  const clearWeek = async () => {
    if (!data) return;
    if (!confirm("¿Limpiar todos los winners de esta semana?")) return;
    await fetch(`/api/admin/showcase-winner?week=${data.week}`, {
      method: "DELETE",
    });
    fetchData();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/explore?q=${encodeURIComponent(searchQuery)}&limit=5`);
      const json = await res.json();
      setSearchResults(json.profiles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <div className="section-label mb-1">// showcase</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Winners & Finalistas
        </h1>
      </header>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-2xl mb-8 ${
            msg.type === "ok"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{msg.text}</span>
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
            <div className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">
              Semana
            </div>
            <div className="font-bold font-mono text-lg">{data.week}</div>
          </div>

          {/* Winner(s) actual(es) */}
          {data.winners && data.winners.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="section-label !mb-0">// winner(s) actual(es)</div>
                <button
                  onClick={clearWeek}
                  className="text-[10px] font-mono text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={10} /> Limpiar semana
                </button>
              </div>
              <div className="grid gap-4">
                {data.winners.map((winner) => (
                  <div
                    key={winner.user.id}
                    className="flex items-center gap-4 p-5 rounded-2xl border-2"
                    style={{ borderColor: winner.user.accent_color }}
                  >
                    <Trophy size={24} style={{ color: winner.user.accent_color }} />
                    <div>
                      <p
                        className="font-bold"
                        style={{ color: winner.user.accent_color }}
                      >
                        {winner.user.name ?? winner.user.username}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">
                        @{winner.user.username}
                      </p>
                    </div>
                  </div>
                ))}
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
                {data.finalists.map((finalist, i) => {
                  const isWinner = data.winners?.some(
                    (w) => w.user.id === finalist.userId
                  );
                  return (
                    <motion.div
                      key={finalist.userId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
                    >
                      {finalist.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={finalist.user.image}
                          alt={finalist.user.username}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black shrink-0"
                          style={{ backgroundColor: finalist.user.accent_color }}
                        >
                          {(finalist.user.name ?? finalist.user.username)[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p
                          className="font-bold text-sm"
                          style={{ color: finalist.user.accent_color }}
                        >
                          {finalist.user.name ?? finalist.user.username}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">
                          {finalist.count} nominación
                          {finalist.count !== 1 ? "es" : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => setWinner(finalist.userId, data.week)}
                        disabled={settingWinner === finalist.userId}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          backgroundColor: isWinner
                            ? "transparent"
                            : finalist.user.accent_color,
                          border: isWinner
                            ? `1px solid ${finalist.user.accent_color}`
                            : "none",
                          color: isWinner ? finalist.user.accent_color : "black",
                          opacity: settingWinner === finalist.userId ? 0.7 : 1,
                        }}
                      >
                        {settingWinner === finalist.userId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isWinner ? (
                          <>
                            <X size={14} /> Quitar winner
                          </>
                        ) : (
                          <>
                            <Trophy size={14} /> Elegir winner
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agregar manualmente */}
          <div className="pt-6 border-t border-[var(--border)]">
            <div className="section-label mb-4">// o agregá uno manualmente 👀</div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar por usuario o nombre..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHasSearched(false);
                }}
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-bold hover:border-white/20 transition-all disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Buscar
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((profile) => {
                  const isWinner = data.winners?.some(
                    (w) => w.user.id === profile.id
                  );
                  return (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
                    >
                      {profile.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.image}
                          alt={profile.username}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black shrink-0"
                          style={{ backgroundColor: profile.accent_color || "var(--accent)" }}
                        >
                          {(profile.name ?? profile.username)[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p
                          className="font-bold text-sm"
                          style={{ color: profile.accent_color || "white" }}
                        >
                          {profile.name ?? profile.username}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">
                          @{profile.username}
                        </p>
                      </div>
                      <button
                        onClick={() => setWinner(profile.id, data.week)}
                        disabled={settingWinner === profile.id}
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          backgroundColor: isWinner
                            ? "transparent"
                            : profile.accent_color || "var(--accent)",
                          border: isWinner
                            ? `1px solid ${profile.accent_color || "var(--accent)"}`
                            : "none",
                          color: isWinner ? (profile.accent_color || "var(--accent)") : "black",
                          opacity: settingWinner === profile.id ? 0.7 : 1,
                        }}
                      >
                        {settingWinner === profile.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isWinner ? (
                          <>
                            <X size={14} /> Quitar
                          </>
                        ) : (
                          <>
                            <Trophy size={14} /> Elegir
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
            
            {searchResults.length === 0 && hasSearched && !isSearching && (
              <p className="text-xs font-mono text-[var(--text-dim)]">
                No se encontraron resultados para "{searchQuery}"
              </p>
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
