"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Send,
  Eye,
  Check,
  CheckCircle2,
} from "lucide-react";

interface InterviewRow {
  id: string;
  builder_username: string;
  builder_name: string | null;
  builder_email?: string | null;
  status: string;
  invited_at: string | null;
  submitted_at: string | null;
  typefully_x_draft_url: string | null;
  typefully_linkedin_draft_url: string | null;
  generation_error: string | null;
  builder_approved_at: string | null;
  builder_feedback: string | null;
  story_video_path: string | null;
  story_video_is_public: boolean;
}

interface BuilderSearchResult {
  username: string;
  name: string | null;
  image: string | null;
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteQuery, setInviteQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BuilderSearchResult[]>([]);
  const [searchingBuilders, setSearchingBuilders] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [invitingBuilder, setInvitingBuilder] = useState(false);

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/builder-interview/list");
      const json = await res.json();
      if (Array.isArray(json)) setInterviews(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const searchBuilders = async (q: string) => {
    setInviteQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchingBuilders(true);
    try {
      const res = await fetch(
        `/api/admin/builder-interview/search?q=${encodeURIComponent(q)}`
      );
      const json = await res.json();
      if (Array.isArray(json)) {
        setSearchResults(json);
        setShowDropdown(json.length > 0);
      }
    } finally {
      setSearchingBuilders(false);
    }
  };

  const handleInviteBuilder = async (username: string) => {
    setInvitingBuilder(true);
    setMsg(null);
    setShowDropdown(false);
    setInviteQuery("");
    try {
      const res = await fetch("/api/admin/builder-interview/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: `Invitación enviada a @${username} ✉️` });
        fetchInterviews();
      } else {
        setMsg({ type: "err", text: json.error || "Error al invitar." });
      }
    } catch {
      setMsg({ type: "err", text: "Error de conexión." });
    } finally {
      setInvitingBuilder(false);
    }
  };

  const handleApproveInterview = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(
        `/api/admin/builder-interview/${id}/approve`,
        { method: "POST" }
      );
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: "Blog publicado 🎉" });
        fetchInterviews();
      } else {
        setMsg({ type: "err", text: json.error || "Error al publicar." });
      }
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <div className="section-label mb-1">// builder de la semana</div>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Interviews
          </h1>
          <button
            onClick={fetchInterviews}
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            Actualizar
          </button>
        </div>
      </header>

      {/* Invite builder */}
      <div className="relative mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={inviteQuery}
            onChange={(e) => searchBuilders(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Buscar builder por nombre o username..."
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50"
          />
          {searchingBuilders && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
            </div>
          )}

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#111] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl">
              {searchResults.map((builder) => (
                <button
                  key={builder.username}
                  onClick={() => handleInviteBuilder(builder.username)}
                  disabled={invitingBuilder}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-[var(--border)] last:border-0"
                >
                  {builder.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={builder.image}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] text-xs font-bold">
                      {(builder.name || builder.username)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {builder.name || builder.username}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">
                      @{builder.username}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold uppercase shrink-0">
                    <Send size={10} />
                    Invitar
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {invitingBuilder && (
          <div className="flex items-center gap-2 mt-3 text-sm text-[var(--text-muted)]">
            <Loader2 size={14} className="animate-spin" />
            Enviando invitación...
          </div>
        )}
      </div>

      {msg && (
        <div
          className={`text-sm font-mono mb-4 ${
            msg.type === "ok" ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 size={20} className="animate-spin text-[var(--accent)] mx-auto" />
        </div>
      ) : interviews.length === 0 ? (
        <p className="text-[var(--text-muted)] text-sm text-center py-12">
          No hay entrevistas todavía.
        </p>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => {
            const isPendiente = iv.status === "invited";
            const isEnProceso =
              iv.status === "submitted" || iv.status === "generating";
            const isFinalizado =
              iv.status === "ready" || iv.status === "published";
            const isExpired = iv.status === "expired";
            const isExpanded = expandedId === iv.id;

            return (
              <div
                key={iv.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"
              >
                <div
                  className={`p-5 flex items-center justify-between ${
                    isFinalizado
                      ? "cursor-pointer hover:bg-white/[0.02] transition-colors"
                      : ""
                  }`}
                  onClick={() =>
                    isFinalizado && setExpandedId(isExpanded ? null : iv.id)
                  }
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isFinalizado
                          ? iv.status === "published"
                            ? "bg-green-400"
                            : "bg-[var(--accent)]"
                          : isEnProceso
                          ? "bg-amber-400 animate-pulse"
                          : isExpired
                          ? "bg-red-400"
                          : "bg-white/20"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {iv.builder_name}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono shrink-0">
                          @{iv.builder_username}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {iv.invited_at &&
                          `Invitado ${new Date(iv.invited_at).toLocaleDateString(
                            "es-AR",
                            { day: "numeric", month: "short" }
                          )}`}
                        {iv.submitted_at &&
                          ` · Respondió ${new Date(
                            iv.submitted_at
                          ).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                          })}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider ${
                        iv.status === "published"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : iv.status === "ready"
                          ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                          : isEnProceso
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : isExpired
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-white/5 text-[var(--text-muted)] border border-white/10"
                      }`}
                    >
                      {isPendiente && "Pendiente"}
                      {isEnProceso && "En proceso"}
                      {iv.status === "ready" && "Finalizado"}
                      {iv.status === "published" && "Publicado"}
                      {isExpired && "Expirado"}
                    </span>

                    {iv.builder_approved_at && (
                      <span
                        className="text-[10px] font-mono px-2 py-1 rounded-full uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20"
                        title={`Aprobado ${new Date(
                          iv.builder_approved_at
                        ).toLocaleDateString("es-AR")}`}
                      >
                        ✓ Aprobado
                      </span>
                    )}
                    {!iv.builder_approved_at && iv.builder_feedback && (
                      <span
                        className="text-[10px] font-mono px-2 py-1 rounded-full uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        title="El builder pidió cambios"
                      >
                        ✎ Cambios
                      </span>
                    )}
                    {iv.story_video_path && (
                      <span
                        className="text-[10px] font-mono px-2 py-1 rounded-full uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                        title={
                          iv.story_video_is_public
                            ? "Video subido · público"
                            : "Video subido · privado"
                        }
                      >
                        🎥 {iv.story_video_is_public ? "público" : "video"}
                      </span>
                    )}

                    {iv.generation_error && (
                      <span className="text-[10px] text-red-400 font-mono">
                        ⚠️ error
                      </span>
                    )}

                    {isFinalizado && (
                      <svg
                        className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {isFinalizado && isExpanded && (
                  <div className="border-t border-[var(--border)] px-5 pb-5">
                    <div className="flex items-center gap-2 py-4 flex-wrap">
                      {iv.typefully_x_draft_url && (
                        <a
                          href={iv.typefully_x_draft_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                        >
                          𝕏 Ver draft
                        </a>
                      )}
                      {iv.typefully_linkedin_draft_url && (
                        <a
                          href={iv.typefully_linkedin_draft_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                        >
                          in Ver draft
                        </a>
                      )}
                      <Link
                        href={`/admin/interviews/${iv.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Eye size={12} /> Editar / Preview
                      </Link>
                      {iv.status === "ready" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveInterview(iv.id);
                          }}
                          disabled={approvingId === iv.id}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-bold hover:bg-[var(--accent)]/90 disabled:opacity-40 transition-all ml-auto"
                        >
                          {approvingId === iv.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          Publicar blog
                        </button>
                      )}
                      {iv.status === "published" && (
                        <span className="flex items-center gap-1.5 text-xs text-green-400 font-mono ml-auto">
                          <CheckCircle2 size={12} /> Blog publicado
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
