"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Twitter,
  Linkedin,
  Instagram,
  LayoutGrid,
  Check,
  MessageSquare,
} from "lucide-react";

interface CarouselSlide {
  heading?: string;
  body?: string;
  footer?: string;
}

interface ReviewData {
  id: string;
  builderName: string;
  builderUsername: string;
  status: string;
  approvedAt: string | null;
  previousFeedback: string | null;
  content: {
    blogMarkdown: string | null;
    twitterPost: string | null;
    linkedinPost: string | null;
    instagramCaption: string | null;
    instagramCarousel: CarouselSlide[];
  };
}

type PageState =
  | { type: "loading" }
  | { type: "ready"; data: ReviewData }
  | { type: "not_ready"; status: string }
  | { type: "not_found" }
  | { type: "error"; message: string };

export default function BuilderReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>({ type: "loading" });

  // Action state
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { type: "approved" }
    | { type: "feedback_sent" }
    | { type: "error"; message: string }
    | null
  >(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/builder-interview/${token}/review`);
        if (res.status === 404) {
          setState({ type: "not_found" });
          return;
        }
        const json = await res.json();
        if (res.status === 409) {
          setState({ type: "not_ready", status: json.status ?? "unknown" });
          return;
        }
        if (!res.ok) {
          setState({
            type: "error",
            message: json.error ?? "Algo salió mal.",
          });
          return;
        }
        setState({ type: "ready", data: json });
        if (json.previousFeedback) setFeedback(json.previousFeedback);
      } catch {
        setState({ type: "error", message: "Error de conexión." });
      }
    }
    load();
  }, [token]);

  const submitReview = async (approved: boolean) => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/builder-interview/${token}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          feedback: feedback.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResult({
          type: "error",
          message: json.error ?? "No pudimos guardar tu respuesta.",
        });
        return;
      }
      setResult({ type: approved ? "approved" : "feedback_sent" });
    } catch {
      setResult({ type: "error", message: "Error de conexión." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-display flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <Link href="/" className="text-lg font-black tracking-tighter">
          HUEV<span className="text-[#C8FF00]">SITE</span>.IO
        </Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Revisión · Builder de la Semana
        </span>
      </header>

      <main className="flex-1 px-6 py-16 md:py-20 max-w-3xl mx-auto w-full">
        {state.type === "loading" && (
          <div className="text-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-[#C8FF00] mx-auto mb-4" />
            <p className="text-zinc-500 text-sm font-mono">Cargando tu contenido...</p>
          </div>
        )}

        {state.type === "not_found" && (
          <div className="text-center py-32">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold mb-2">Link inválido</h1>
            <p className="text-zinc-500 text-sm">
              No encontramos ninguna entrevista con este link.
            </p>
          </div>
        )}

        {state.type === "not_ready" && (
          <div className="text-center py-32">
            <Loader2 className="w-8 h-8 text-[#C8FF00] mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold mb-2">Todavía no está listo</h1>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Estamos generando tu contenido. Volvé a abrir este link en unos minutos.
              {state.status !== "unknown" && (
                <span className="block mt-2 font-mono text-xs text-zinc-700">
                  (status: {state.status})
                </span>
              )}
            </p>
          </div>
        )}

        {state.type === "error" && (
          <div className="text-center py-32">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold mb-2">Algo salió mal</h1>
            <p className="text-zinc-500 text-sm">{state.message}</p>
          </div>
        )}

        {state.type === "ready" && (
          <>
            {/* Intro */}
            <div className="mb-12 md:mb-16">
              <div className="text-[10px] font-mono text-[#C8FF00] uppercase tracking-widest mb-3">
                // revisá y aprobá
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-4">
                Hola, {state.data.builderName.split(" ")[0]}.
              </h1>
              <p className="text-zinc-400 text-base md:text-lg max-w-xl leading-relaxed">
                Esto es lo que generamos con tus respuestas. Leelo con calma y decinos si
                está bien para publicar o si querés cambiar algo.
              </p>
              {state.data.approvedAt && (
                <div className="mt-6 inline-flex items-center gap-2 text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2">
                  <CheckCircle2 size={14} />
                  Aprobado el{" "}
                  {new Date(state.data.approvedAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "long",
                  })}
                </div>
              )}
            </div>

            {/* Sections */}
            <div className="space-y-16">
              {/* Blog */}
              {state.data.content.blogMarkdown && (
                <Section icon={<FileText size={16} />} label="Blog post">
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-zinc-300 prose-p:leading-relaxed prose-a:text-[#C8FF00] prose-strong:text-white prose-blockquote:border-[#C8FF00] prose-blockquote:text-zinc-400 prose-code:text-[#C8FF00] prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {state.data.content.blogMarkdown}
                    </ReactMarkdown>
                  </div>
                </Section>
              )}

              {/* Twitter */}
              {state.data.content.twitterPost && (
                <Section icon={<Twitter size={16} />} label="Tweet / Thread para X">
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {state.data.content.twitterPost}
                  </div>
                </Section>
              )}

              {/* LinkedIn */}
              {state.data.content.linkedinPost && (
                <Section icon={<Linkedin size={16} />} label="Post para LinkedIn">
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {state.data.content.linkedinPost}
                  </div>
                </Section>
              )}

              {/* Instagram caption */}
              {state.data.content.instagramCaption && (
                <Section icon={<Instagram size={16} />} label="Caption de Instagram">
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {state.data.content.instagramCaption}
                  </div>
                </Section>
              )}

              {/* Instagram carousel */}
              {state.data.content.instagramCarousel.length > 0 && (
                <Section
                  icon={<LayoutGrid size={16} />}
                  label={`Carrusel de Instagram · ${state.data.content.instagramCarousel.length} slides`}
                >
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x">
                    {state.data.content.instagramCarousel.map((slide, i) => (
                      <div
                        key={i}
                        className="shrink-0 w-[260px] aspect-square rounded-2xl border border-white/10 p-6 flex flex-col justify-between snap-center"
                        style={{
                          background:
                            i === 0
                              ? "linear-gradient(135deg, #0a0a0a 0%, #1a1a0a 100%)"
                              : "#0a0a0a",
                        }}
                      >
                        <div>
                          <div className="text-[10px] font-mono text-[#C8FF00]/60 uppercase tracking-widest mb-3">
                            {i + 1} / {state.data.content.instagramCarousel.length}
                          </div>
                          <div className="text-base font-extrabold text-white leading-tight mb-3">
                            {slide.heading}
                          </div>
                          <div className="text-xs text-zinc-400 leading-relaxed">
                            {slide.body}
                          </div>
                        </div>
                        {slide.footer && (
                          <div className="text-[10px] text-[#C8FF00] font-mono mt-auto pt-3">
                            {slide.footer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            {/* Review actions */}
            <div className="mt-20 pt-12 border-t border-white/10">
              <div className="text-[10px] font-mono text-[#C8FF00] uppercase tracking-widest mb-3">
                // tu respuesta
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-6">
                ¿Está todo bien así?
              </h2>

              {result?.type === "approved" && (
                <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-300 mb-8">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 size={18} />
                    Aprobado
                  </div>
                  <p className="text-sm text-green-300/80">
                    Listo. Lo publicamos nosotros y te avisamos cuando esté en vivo. Gracias por tu tiempo 🧉
                  </p>
                </div>
              )}

              {result?.type === "feedback_sent" && (
                <div className="p-6 rounded-2xl bg-[#C8FF00]/10 border border-[#C8FF00]/30 text-[#C8FF00] mb-8">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <MessageSquare size={18} />
                    Feedback enviado
                  </div>
                  <p className="text-sm opacity-80">
                    Recibimos tus comentarios. Los vamos a revisar y te volvemos a pasar el contenido actualizado.
                  </p>
                </div>
              )}

              {result?.type === "error" && (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 mb-8">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertCircle size={18} />
                    Error
                  </div>
                  <p className="text-sm text-red-300/80">{result.message}</p>
                </div>
              )}

              {!result && (
                <>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
                    Comentarios (opcional si aprobás, requerido si pedís cambios)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    placeholder="Ej: En el tweet falta mencionar bondi.azanello.com. El blog está buenísimo. En LinkedIn cambiaría 'todoterreno' por 'generalista'..."
                    className="w-full p-4 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-[#C8FF00]/50 transition-colors"
                  />
                  <p className="mt-2 text-[10px] font-mono text-zinc-600">
                    {feedback.length} caracteres
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
                    <button
                      onClick={() => submitReview(true)}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#C8FF00] text-black font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Está todo bien, publicá
                    </button>
                    <button
                      onClick={() => submitReview(false)}
                      disabled={submitting || feedback.trim().length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <MessageSquare size={16} />
                      Pedir cambios
                    </button>
                  </div>
                  {feedback.trim().length === 0 && (
                    <p className="mt-3 text-[10px] font-mono text-zinc-600 text-center sm:text-left">
                      Si querés pedir cambios, escribí primero qué cambiar.
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#C8FF00]">{icon}</span>
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          {label}
        </h2>
      </div>
      {children}
    </section>
  );
}
