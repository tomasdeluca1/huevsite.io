"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, CheckCircle2 } from "lucide-react";

export default function AdminLandingPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/site-settings");
        const json = await res.json();
        if (json.settings) {
          setVideoUrl(json.settings.founder_video_url || "");
          setQuote(json.settings.founder_quote || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { founder_video_url: videoUrl.trim(), founder_quote: quote.trim() },
        }),
      });
      setMsg(res.ok ? "Guardado ✓ — se ve en la home." : "Error al guardar.");
    } catch {
      setMsg("Error de conexión.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3500);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors mb-4">
          <ArrowLeft size={14} /> Volver al admin
        </Link>
        <div className="section-label mb-1">// contenido del landing</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Landing</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Lo que cargás acá se ve en la sección del founder de la home.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
      ) : (
        <div className="max-w-xl space-y-6">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Video del founder</label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.loom.com/share/… (o YouTube, o un .mp4)"
              className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent)]/50"
            />
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Pegá el link de Loom o YouTube (o una URL directa a un .mp4). Si lo dejás vacío, la home muestra la nota de texto.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">Quote del founder (opcional)</label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={3}
              placeholder="Soy Tomas. Armé huevsite para…"
              className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-sm text-white resize-y focus:outline-none focus:border-[var(--accent)]/50"
            />
            <p className="mt-2 text-xs text-[var(--text-muted)]">Si lo dejás vacío, usa el texto por defecto.</p>
          </div>

          <button onClick={save} disabled={saving} className="btn btn-accent inline-flex items-center gap-2 !py-3 !px-6 disabled:opacity-40">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
          </button>

          {msg && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle2 size={14} /> {msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
