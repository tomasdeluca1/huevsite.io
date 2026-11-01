"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function GrantFounderForm() {
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const submit = async () => {
    const cleaned = username.trim().replace(/^@+/, "");
    if (!cleaned) {
      setMsg({ type: "err", text: "Escribí un username." });
      return;
    }
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/grant-founder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleaned }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "No se pudo otorgar Founder.");
      }
      const remaining =
        typeof json.seats?.remaining === "number" && json.seats.remaining >= 0
          ? ` Quedan ${json.seats.remaining} de ${json.seats.cap}.`
          : "";
      setMsg({
        type: "ok",
        text: json.already
          ? `@${json.username} ya era Founder. El cupo no cambia.${remaining}`
          : `@${json.username} ahora es Founder: Pro de por vida, y ocupa un lugar del cupo.${remaining}`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo otorgar Founder.";
      setMsg({ type: "err", text: message });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="mt-12 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="section-label mb-2">// founder de regalo</div>
      <h2 className="text-lg font-black tracking-tight text-white">Otorgar Founder</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
        Activa Pro de por vida para un username. Cuenta como lugar ocupado del cupo.
        Si ya era Founder, no se vuelve a contar.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="@username"
          aria-label="Username"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[var(--accent)]/50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Otorgando
            </span>
          ) : (
            "Otorgar Founder"
          )}
        </button>
      </div>
      {msg && (
        <p className={`mt-3 text-sm ${msg.type === "ok" ? "text-[var(--accent)]" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
