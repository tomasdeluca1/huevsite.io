"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Loader2, Save } from "lucide-react";

interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
}

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [adding, setAdding] = useState(false);
  // local edits keyed by id
  const [edits, setEdits] = useState<Record<string, { question: string; answer: string }>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/faqs");
      const json = await res.json();
      if (Array.isArray(json.faqs)) setFaqs(json.faqs);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setFaqs((prev) => prev.map((f) => (f.id === id ? updated : f)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = (f: Faq) => {
    const e = edits[f.id];
    if (!e) return;
    patch(f.id, { question: e.question, answer: e.answer }).then(() =>
      setEdits((prev) => { const n = { ...prev }; delete n[f.id]; return n; })
    );
  };

  const remove = async (id: string) => {
    if (!confirm("¿Borrar esta pregunta?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
      if (res.ok) setFaqs((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const a = faqs[index];
    const b = faqs[index + dir];
    if (!a || !b) return;
    setBusyId(a.id);
    try {
      await Promise.all([
        fetch(`/api/admin/faqs/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: b.sort_order }) }),
        fetch(`/api/admin/faqs/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: a.sort_order }) }),
      ]);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const add = async () => {
    if (!newQ.trim() || !newA.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQ, answer: newA }),
      });
      if (res.ok) {
        const created = await res.json();
        setFaqs((prev) => [...prev, created]);
        setNewQ(""); setNewA("");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors mb-4">
          <ArrowLeft size={14} /> Volver al admin
        </Link>
        <div className="section-label mb-1">// faq del landing</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">FAQ</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Lo que editás acá se ve en la home (acordeón cerca del pricing) y en el FAQ schema de SEO.
        </p>
      </header>

      {/* Add new */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-8">
        <div className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider mb-3">Agregar pregunta</div>
        <input
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          placeholder="¿Pregunta?"
          className="w-full p-3 mb-2 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent)]/50"
        />
        <textarea
          value={newA}
          onChange={(e) => setNewA(e.target.value)}
          rows={3}
          placeholder="Respuesta…"
          className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-sm text-white resize-y focus:outline-none focus:border-[var(--accent)]/50"
        />
        <button
          onClick={add}
          disabled={adding || !newQ.trim() || !newA.trim()}
          className="btn btn-accent mt-3 !py-2.5 !px-5 inline-flex items-center gap-2 disabled:opacity-40"
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
      ) : faqs.length === 0 ? (
        <p className="text-[var(--text-muted)] text-sm text-center py-12">No hay preguntas todavía.</p>
      ) : (
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const e = edits[f.id] ?? { question: f.question, answer: f.answer };
            const dirty = e.question !== f.question || e.answer !== f.answer;
            return (
              <div key={f.id} className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 ${!f.published ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0 || busyId === f.id} className="text-[var(--text-muted)] hover:text-white disabled:opacity-20"><ChevronUp size={16} /></button>
                    <button onClick={() => move(i, 1)} disabled={i === faqs.length - 1 || busyId === f.id} className="text-[var(--text-muted)] hover:text-white disabled:opacity-20"><ChevronDown size={16} /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      value={e.question}
                      onChange={(ev) => setEdits((prev) => ({ ...prev, [f.id]: { ...e, question: ev.target.value } }))}
                      className="w-full p-2 mb-2 bg-black/20 border border-white/5 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-[var(--accent)]/40"
                    />
                    <textarea
                      value={e.answer}
                      onChange={(ev) => setEdits((prev) => ({ ...prev, [f.id]: { ...e, answer: ev.target.value } }))}
                      rows={2}
                      className="w-full p-2 bg-black/20 border border-white/5 rounded-lg text-sm text-[var(--text-dim)] resize-y focus:outline-none focus:border-[var(--accent)]/40"
                    />
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {dirty && (
                        <button onClick={() => saveEdit(f)} disabled={busyId === f.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-bold hover:opacity-90 disabled:opacity-40">
                          <Save size={12} /> Guardar
                        </button>
                      )}
                      <button onClick={() => patch(f.id, { published: !f.published })} disabled={busyId === f.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white disabled:opacity-40">
                        {f.published ? <><Eye size={12} /> Publicada</> : <><EyeOff size={12} /> Oculta</>}
                      </button>
                      <button onClick={() => remove(f.id)} disabled={busyId === f.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 hover:bg-red-500/20 disabled:opacity-40 ml-auto">
                        <Trash2 size={12} /> Borrar
                      </button>
                      {busyId === f.id && <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
