import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { JINGLE_OPTIONS, JingleChoice } from "@/lib/jingles";
import { Music } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminJinglesPage() {
  const svc = createServiceRoleClient();

  const counts: Record<JingleChoice, number> = { monumental: 0, del_otro_lado: 0 };
  let tableReady = true;

  const { data, error } = await svc.from("jingle_votes").select("choice");
  if (error) {
    tableReady = false;
  } else {
    for (const row of (data || []) as { choice: JingleChoice }[]) {
      if (row.choice in counts) counts[row.choice] += 1;
    }
  }

  const total = counts.monumental + counts.del_otro_lado;
  const leader =
    total === 0
      ? null
      : counts.monumental === counts.del_otro_lado
      ? "tie"
      : counts.monumental > counts.del_otro_lado
      ? "monumental"
      : "del_otro_lado";

  return (
    <div>
      <header className="mb-10">
        <div className="section-label mb-1">// votación de jingles</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
          <Music size={26} className="text-[var(--accent)]" /> Jingle de huevsite
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          {total} {total === 1 ? "voto" : "votos"} en total
          {leader === "tie" && total > 0 ? " · empate técnico" : ""}.
        </p>
      </header>

      {!tableReady && (
        <div className="mb-8 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          La tabla <code className="font-mono">jingle_votes</code> todavía no existe. Aplicá la migración{" "}
          <code className="font-mono">20260604000000_jingle_votes.sql</code> en Supabase para empezar a registrar votos.
        </div>
      )}

      <div className="space-y-5">
        {JINGLE_OPTIONS.map((opt) => {
          const count = counts[opt.key];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isLeader = leader === opt.key;
          return (
            <div
              key={opt.key}
              className={`p-5 rounded-3xl border transition-colors ${
                isLeader ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.05]" : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {opt.label}
                    {isLeader && <span className="ml-2 text-[var(--accent)]">· liderando</span>}
                  </span>
                  <div className="text-lg font-black text-white truncate">{opt.title}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-[950] tracking-tighter text-white leading-none">{count}</div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">{pct}%</div>
                </div>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isLeader ? "var(--accent)" : "rgba(255,255,255,0.25)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-[11px] font-mono text-[var(--text-dim)]">
        1 voto por usuario logueado · se puede cambiar el voto.
      </p>
    </div>
  );
}
