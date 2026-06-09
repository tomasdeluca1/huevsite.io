"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Star, Loader2 } from "lucide-react";

interface Row {
  id: string;
  quote: string;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  created_at: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

export default function AdminTestimonialsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials");
      const json = await res.json();
      if (Array.isArray(json.testimonials)) setRows(json.testimonials);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: updated.status, featured: updated.featured } : r
          )
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const pending = rows.filter((r) => r.status === "pending");
  const rest = rows.filter((r) => r.status !== "pending");

  const StatusChip = ({ r }: { r: Row }) => {
    const map = {
      pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      approved: "bg-green-500/10 text-green-400 border-green-500/20",
      rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    } as const;
    return (
      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[r.status]}`}>
        {r.status === "pending" ? "Pendiente" : r.status === "approved" ? "Aprobado" : "Rechazado"}
      </span>
    );
  };

  const Card = ({ r }: { r: Row }) => (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-start gap-3">
        {r.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.avatarUrl} alt={r.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
            {r.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">{r.name}</span>
            {r.username && (
              <Link href={`/${r.username}`} target="_blank" className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent)]">
                @{r.username}
              </Link>
            )}
            <StatusChip r={r} />
            {r.featured && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20 uppercase tracking-wider">
                ⭐ Destacado
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-dim)] mt-2 leading-relaxed whitespace-pre-wrap">“{r.quote}”</p>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {r.status !== "approved" && (
              <button
                onClick={() => patch(r.id, { status: "approved" })}
                disabled={busyId === r.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-xs font-mono text-green-400 hover:bg-green-500/20 disabled:opacity-40 transition-colors"
              >
                <Check size={12} /> Aprobar
              </button>
            )}
            {r.status !== "rejected" && (
              <button
                onClick={() => patch(r.id, { status: "rejected" })}
                disabled={busyId === r.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
              >
                <X size={12} /> Rechazar
              </button>
            )}
            {r.status === "approved" && (
              <button
                onClick={() => patch(r.id, { featured: !r.featured })}
                disabled={busyId === r.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors disabled:opacity-40 ${
                  r.featured
                    ? "bg-[var(--accent)]/15 border-[var(--accent)]/40 text-[var(--accent)]"
                    : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-white"
                }`}
              >
                <Star size={12} /> {r.featured ? "Quitar de la home" : "Destacar en la home"}
              </button>
            )}
            {busyId === r.id && <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <header className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors mb-4">
          <ArrowLeft size={14} /> Volver al admin
        </Link>
        <div className="section-label mb-1">// testimonios</div>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Testimonios</h1>
          <button onClick={load} className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
            Actualizar
          </button>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Aprobá y marcá ⭐ los que querés mostrar en la home. Solo los <strong>aprobados + destacados</strong> aparecen.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[var(--accent)]" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-[var(--text-muted)] text-sm text-center py-12">No hay testimonios todavía.</p>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-amber-300/70 uppercase tracking-wider">Pendientes ({pending.length})</div>
              {pending.map((r) => (
                <Card key={r.id} r={r} />
              ))}
            </div>
          )}
          {rest.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">Moderados</div>
              {rest.map((r) => (
                <Card key={r.id} r={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
