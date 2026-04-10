import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Guía: grabá tu historia | Builder de la Semana — huevsite.io",
  description:
    "10 preguntas disparadoras para que grabes tu historia como builder. Una por story de Instagram o TikTok. Sin guion, sin filtro.",
  alternates: {
    canonical: `${SITE_URL}/builder-de-la-semana/guia`,
  },
  openGraph: {
    title: "Grabá tu historia como builder — huevsite.io",
    description:
      "10 preguntas disparadoras. Una por story. Abrite y mostrá quién sos.",
    url: `${SITE_URL}/builder-de-la-semana/guia`,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grabá tu historia como builder",
    description: "10 preguntas disparadoras para Stories y TikTok.",
  },
};

const QUESTIONS = [
  "Contá quién sos en 10 segundos. Sin rol, sin título. Solo quién.",
  "¿Qué hacías antes de empezar a construir cosas?",
  "Tu primer proyecto: no el más lindo. El primero. Contalo.",
  "Mostrá lo que estás construyendo ahora. Explicalo como si se lo contaras a tu vieja.",
  "¿Para quién lo hacés? No digas “la gente”. Nombrá a una persona real.",
  "¿Qué problema te rompió la cabeza y terminó siendo este proyecto?",
  "Mostrá tu herramienta favorita esta semana. 10 segundos. Por qué.",
  "Contá el último momento en que alguien usó algo que hiciste y te escribió. ¿Qué te dijo?",
  "¿Qué está por venir que te tiene obsesionado?",
  "¿Qué le dirías a alguien que quiere empezar a construir en público pero no se anima?",
];

export default function BuilderGuiaPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-display flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <Link href="/" className="text-lg font-black tracking-tighter">
          HUEV<span className="text-[#C8FF00]">SITE</span>.IO
        </Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Guía · Builder de la Semana
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-16 md:py-24 max-w-3xl mx-auto w-full">
        <div className="mb-16 md:mb-20">
          <div className="text-[10px] font-mono text-[#C8FF00] uppercase tracking-widest mb-4">
            // grabá tu historia
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-6">
            10 preguntas.
            <br />
            <span className="text-zinc-500">Una por story.</span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-xl leading-relaxed">
            Leé, respondé a cámara. Vertical, para Instagram y TikTok. Sin guion.
            Si no sabés qué decir, decilo. Eso también cuenta.
          </p>
        </div>

        <ol className="space-y-10 md:space-y-14">
          {QUESTIONS.map((q, i) => (
            <li key={i} className="group">
              <div className="flex items-baseline gap-5 md:gap-7">
                <span className="shrink-0 text-4xl md:text-5xl font-black text-zinc-800 group-hover:text-[#C8FF00] transition-colors tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-xl md:text-3xl font-bold leading-snug tracking-tight text-white">
                  {q}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-24 pt-8 border-t border-white/5">
          <p className="text-zinc-500 text-sm font-mono leading-relaxed">
            Cuando termines, mandánoslas. Las sumamos a tu entrevista para
            convertirlas en un post de blog, carrusel y contenido para redes.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-xs font-mono uppercase tracking-widest text-zinc-600 hover:text-[#C8FF00] transition-colors"
          >
            ← huevsite.io
          </Link>
        </div>
      </main>
    </div>
  );
}
