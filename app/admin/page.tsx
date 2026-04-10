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
} from "lucide-react";

type Stats = {
  interviewsPending: number;
  interviewsReady: number;
  interviewsApproved: number;
  interviewsWithVideo: number;
  interviewsTotal: number;
  feedbackPending: number;
  showcaseFinalists: number;
  showcaseWinners: number;
};

const EMPTY_STATS: Stats = {
  interviewsPending: 0,
  interviewsReady: 0,
  interviewsApproved: 0,
  interviewsWithVideo: 0,
  interviewsTotal: 0,
  feedbackPending: 0,
  showcaseFinalists: 0,
  showcaseWinners: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
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

        const interviews = await interviewsRes.json().catch(() => []);
        const feedbacks = await feedbackRes.json().catch(() => []);
        const showcase = await showcaseRes.json().catch(() => ({}));

        const ivArr = Array.isArray(interviews) ? interviews : [];
        const fbArr = Array.isArray(feedbacks) ? feedbacks : [];

        setStats({
          interviewsTotal: ivArr.length,
          interviewsPending: ivArr.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (iv: any) => iv.status === "invited"
          ).length,
          interviewsReady: ivArr.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (iv: any) => iv.status === "ready"
          ).length,
          interviewsApproved: ivArr.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (iv: any) => !!iv.builder_approved_at
          ).length,
          interviewsWithVideo: ivArr.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (iv: any) => !!iv.story_video_path
          ).length,
          feedbackPending: fbArr.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (fb: any) => fb.status !== "completed"
          ).length,
          showcaseFinalists: showcase?.finalists?.length ?? 0,
          showcaseWinners: showcase?.winners?.length ?? 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <header className="mb-10">
        <div className="section-label mb-1">// panel admin</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Buenas, tomi 🧉
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Resumen rápido de lo que necesita tu atención.
        </p>
      </header>

      {/* Attention-required cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <AttentionCard
          href="/admin/interviews"
          icon={<Mic size={18} />}
          label="Interviews a publicar"
          value={stats.interviewsReady}
          subtitle={`${stats.interviewsApproved} aprobadas · ${stats.interviewsWithVideo} con video`}
          loading={loading}
          highlight={stats.interviewsReady > 0}
        />
        <AttentionCard
          href="/admin/feedback"
          icon={<MessageSquare size={18} />}
          label="Feedback pendiente"
          value={stats.feedbackPending}
          subtitle="Usuarios esperando respuesta"
          loading={loading}
          highlight={stats.feedbackPending > 0}
        />
        <AttentionCard
          href="/admin/showcase"
          icon={<Trophy size={18} />}
          label="Finalistas esta semana"
          value={stats.showcaseFinalists}
          subtitle={`${stats.showcaseWinners} winner${
            stats.showcaseWinners === 1 ? "" : "s"
          } elegido${stats.showcaseWinners === 1 ? "" : "s"}`}
          loading={loading}
          highlight={stats.showcaseFinalists > 0 && stats.showcaseWinners === 0}
        />
        <AttentionCard
          href="/admin/interviews"
          icon={<Mic size={18} />}
          label="Total de interviews"
          value={stats.interviewsTotal}
          subtitle={`${stats.interviewsPending} sin responder`}
          loading={loading}
          highlight={false}
        />
      </div>

      {/* Quick nav cards */}
      <div className="section-label mb-4">// ir a</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickLink
          href="/admin/twitter"
          icon={<Share2 size={16} />}
          label="Publicar en X"
          hint="Rankings y reportes semanales"
        />
        <QuickLink
          href="/admin/showcase"
          icon={<Trophy size={16} />}
          label="Elegir winner"
          hint="Finalistas y winners de la semana"
        />
        <QuickLink
          href="/admin/danger"
          icon={<AlertTriangle size={16} />}
          label="Borrar cuenta"
          hint="Zona de peligro"
          danger
        />
      </div>
    </div>
  );
}

function AttentionCard({
  href,
  icon,
  label,
  value,
  subtitle,
  loading,
  highlight,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
  loading: boolean;
  highlight: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        group relative p-5 rounded-2xl border transition-all
        ${
          highlight
            ? "bg-[var(--accent)]/5 border-[var(--accent)]/20 hover:bg-[var(--accent)]/10"
            : "bg-[var(--surface)] border-[var(--border)] hover:border-white/20"
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`flex items-center gap-2 text-xs font-mono uppercase tracking-widest ${
            highlight ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          {icon}
          {label}
        </div>
        <ArrowRight
          size={14}
          className="text-[var(--text-dim)] group-hover:text-white group-hover:translate-x-0.5 transition-all"
        />
      </div>
      {loading ? (
        <Loader2 size={22} className="animate-spin text-[var(--text-dim)]" />
      ) : (
        <div className="text-4xl font-black text-white tabular-nums">
          {value}
        </div>
      )}
      <div className="text-[11px] font-mono text-[var(--text-dim)] mt-2">
        {subtitle}
      </div>
    </Link>
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
        group flex items-center gap-4 p-4 rounded-xl border transition-colors
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
        className="text-[var(--text-dim)] group-hover:text-white group-hover:translate-x-0.5 transition-all"
      />
    </Link>
  );
}
