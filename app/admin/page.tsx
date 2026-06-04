"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mic,
  MessageSquare,
  Trophy,
  Share2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Eye,
  CheckCircle2,
  Video,
  Archive,
  Bug,
  Lightbulb,
  Music,
} from "lucide-react";

interface InterviewRow {
  id: string;
  builder_username: string;
  builder_name: string | null;
  status: string;
  submitted_at: string | null;
  builder_approved_at: string | null;
  builder_feedback: string | null;
  story_video_path: string | null;
  story_video_is_public: boolean;
}

interface Feedback {
  id: string;
  user_email: string;
  content: string;
  category: string;
  status: string;
  created_at: string;
}

interface NominatedUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  accent_color: string;
}

interface ShowcaseData {
  week: string;
  winners: Array<{ week: string; user: NominatedUser }>;
  finalists: Array<{ userId: string; count: number; user: NominatedUser }>;
}

export default function AdminDashboard() {
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showcase, setShowcase] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [interviewsRes, feedbackRes, showcaseRes] = await Promise.all([
          fetch("/api/admin/builder-interview/list"),
          fetch("/api/feedback"),
          fetch("/api/social/showcase"),
        ]);

        const iv = await interviewsRes.json().catch(() => []);
        const fb = await feedbackRes.json().catch(() => []);
        const sc = await showcaseRes.json().catch(() => null);

        setInterviews(Array.isArray(iv) ? iv : []);
        setFeedbacks(Array.isArray(fb) ? fb : []);
        setShowcase(sc);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derived lists
  const interviewsReady = interviews.filter((i) => i.status === "ready");
  const interviewsInProgress = interviews.filter(
    (i) => i.status === "submitted" || i.status === "generating"
  );
  const pendingFeedback = feedbacks.filter((f) => f.status !== "completed");
  const needsWinnerPick =
    !!showcase &&
    (showcase.winners?.length ?? 0) === 0 &&
    (showcase.finalists?.length ?? 0) > 0;

  const nothingPending =
    interviewsReady.length === 0 &&
    interviewsInProgress.length === 0 &&
    pendingFeedback.length === 0 &&
    !needsWinnerPick;

  return (
    <div>
      <header className="mb-10">
        <div className="section-label mb-1">// panel admin</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Buenas, tomi 🧉
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Todo lo que requiere tu atención, junto.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
        </div>
      ) : nothingPending ? (
        <div className="p-12 text-center bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl">
          <div className="text-5xl mb-4">🧉</div>
          <h2 className="text-xl font-bold mb-2">Todo en orden</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
            Sin interviews para publicar, sin feedback pendiente, sin winner
            por elegir. Buen momento para construir algo nuevo.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Interviews listas para publicar */}
          {interviewsReady.length > 0 && (
            <Section
              icon={<Mic size={14} />}
              title="Interviews listas para publicar"
              count={interviewsReady.length}
              viewAllHref="/admin/interviews"
            >
              <div className="space-y-3">
                {interviewsReady.map((iv) => (
                  <Link
                    key={iv.id}
                    href={`/admin/interviews/${iv.id}`}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-colors"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">
                          {iv.builder_name}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          @{iv.builder_username}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-[var(--text-dim)]">
                        {iv.submitted_at && (
                          <span>
                            respondió{" "}
                            {new Date(iv.submitted_at).toLocaleDateString(
                              "es-AR",
                              { day: "numeric", month: "short" }
                            )}
                          </span>
                        )}
                        {iv.builder_approved_at && (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle2 size={10} /> aprobada
                          </span>
                        )}
                        {!iv.builder_approved_at && iv.builder_feedback && (
                          <span className="text-yellow-400">✎ pidió cambios</span>
                        )}
                        {iv.story_video_path && (
                          <span className="flex items-center gap-1 text-[var(--accent)]">
                            <Video size={10} /> video
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                      <Eye size={12} />
                      <span className="hidden sm:inline">Revisar</span>
                      <ArrowRight
                        size={12}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Interviews en proceso */}
          {interviewsInProgress.length > 0 && (
            <Section
              icon={<Mic size={14} />}
              title="Interviews en proceso"
              count={interviewsInProgress.length}
              viewAllHref="/admin/interviews"
              muted
            >
              <div className="space-y-2">
                {interviewsInProgress.map((iv) => (
                  <div
                    key={iv.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {iv.builder_name}{" "}
                        <span className="text-[var(--text-muted)] font-mono text-xs">
                          @{iv.builder_username}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                      generando
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Feedback pendiente */}
          {pendingFeedback.length > 0 && (
            <Section
              icon={<MessageSquare size={14} />}
              title="Feedback pendiente"
              count={pendingFeedback.length}
              viewAllHref="/admin/feedback"
            >
              <div className="space-y-3">
                {pendingFeedback.slice(0, 5).map((fb) => (
                  <Link
                    key={fb.id}
                    href="/admin/feedback"
                    className="group block p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-[11px] font-mono font-bold text-white/50 truncate">
                        {fb.user_email}
                      </span>
                      <CategoryBadge category={fb.category} />
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                      {fb.content}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[var(--text-dim)]">
                        {new Date(fb.created_at).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                        ir a gestionar →
                      </span>
                    </div>
                  </Link>
                ))}
                {pendingFeedback.length > 5 && (
                  <Link
                    href="/admin/feedback"
                    className="block text-center text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] py-2 transition-colors"
                  >
                    + {pendingFeedback.length - 5} más →
                  </Link>
                )}
              </div>
            </Section>
          )}

          {/* Showcase — elegir winner */}
          {needsWinnerPick && showcase && (
            <Section
              icon={<Trophy size={14} />}
              title={`Elegí winner · semana ${showcase.week}`}
              count={showcase.finalists.length}
              viewAllHref="/admin/showcase"
            >
              <div className="flex flex-wrap gap-3">
                {showcase.finalists.slice(0, 6).map((f) => (
                  <div
                    key={f.userId}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
                  >
                    {f.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.user.image}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-xs"
                        style={{ backgroundColor: f.user.accent_color }}
                      >
                        {(f.user.name ?? f.user.username)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: f.user.accent_color }}
                      >
                        {f.user.name ?? f.user.username}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-dim)]">
                        {f.count} nom.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Quick nav footer */}
      <div className="mt-12 pt-8 border-t border-[var(--border)]">
        <div className="section-label mb-4">// accesos rápidos</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink
            href="/admin/twitter"
            icon={<Share2 size={16} />}
            label="Publicar en X"
            hint="Rankings y reportes"
          />
          <QuickLink
            href="/admin/showcase"
            icon={<Trophy size={16} />}
            label="Showcase"
            hint="Winners de la semana"
          />
          <QuickLink
            href="/admin/jingles"
            icon={<Music size={16} />}
            label="Jingles"
            hint="Votación del jingle"
          />
          <QuickLink
            href="/admin/danger"
            icon={<AlertTriangle size={16} />}
            label="Danger zone"
            hint="Borrar cuenta"
            danger
          />
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  count,
  viewAllHref,
  muted,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  viewAllHref: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={
              muted ? "text-[var(--text-muted)]" : "text-[var(--accent)]"
            }
          >
            {icon}
          </span>
          <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)]">
            {title}
          </h2>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              muted
                ? "bg-white/5 text-[var(--text-muted)] border-white/10"
                : "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20"
            }`}
          >
            {count}
          </span>
        </div>
        <Link
          href={viewAllHref}
          className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ver todo →
        </Link>
      </div>
      {children}
    </section>
  );
}

function CategoryBadge({ category }: { category: string }) {
  if (category === "bug") {
    return (
      <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter bg-red-500/20 text-red-400">
        <Bug size={9} /> bug
      </span>
    );
  }
  if (category === "idea") {
    return (
      <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter bg-blue-500/20 text-blue-400">
        <Lightbulb size={9} /> idea
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter bg-white/10 text-white/50">
      <Archive size={9} /> {category}
    </span>
  );
}

function QuickLink({
  href,
  icon,
  label,
  hint,
  danger,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-3 p-4 rounded-xl border transition-colors
        ${
          danger
            ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
            : "bg-[var(--surface)] border-[var(--border)] hover:border-white/20"
        }
      `}
    >
      <div
        className={`flex items-center justify-center w-9 h-9 rounded-lg ${
          danger
            ? "bg-red-500/10 text-red-400"
            : "bg-[var(--accent)]/10 text-[var(--accent)]"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-bold ${danger ? "text-red-300" : "text-white"}`}
        >
          {label}
        </div>
        <div className="text-[11px] font-mono text-[var(--text-dim)] truncate">
          {hint}
        </div>
      </div>
      <ArrowRight
        size={14}
        className="text-[var(--text-dim)] group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0"
      />
    </Link>
  );
}
