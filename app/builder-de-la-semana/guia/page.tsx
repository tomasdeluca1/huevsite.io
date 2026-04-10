import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Guía: grabá tu historia | Builder de la Semana — huevsite.io",
  description:
    "10 preguntas para grabar tu historia como builder. Una por story. 15 segundos cada una.",
  alternates: {
    canonical: `${SITE_URL}/builder-de-la-semana/guia`,
  },
  openGraph: {
    title: "Grabá tu historia como builder — huevsite.io",
    description: "10 preguntas. 15 segundos cada una. Una por story.",
    url: `${SITE_URL}/builder-de-la-semana/guia`,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grabá tu historia como builder",
    description: "10 preguntas. 15 segundos cada una.",
  },
};

const QUESTIONS = [
  "¿Quién sos? Sin títulos.",
  "¿Qué hacías antes de construir?",
  "Tu primer proyecto. No el mejor. El primero.",
  "Mostrá lo que hacés ahora.",
  "¿Para quién lo hacés? Nombre real.",
  "¿Qué problema te obsesionó?",
  "Tu herramienta favorita esta semana.",
  "El último mensaje que te hizo sonreír.",
  "¿Qué se viene?",
  "Un consejo para el que no se anima.",
];

export default function BuilderGuiaPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-display flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm font-black tracking-tighter">
          HUEV<span className="text-[#C8FF00]">SITE</span>.IO
        </Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">
          guía
        </span>
      </header>

      <main className="flex-1 px-6 py-20 md:py-28 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.95] mb-4">
          10 preguntas.
        </h1>
        <p className="text-zinc-500 text-sm md:text-base mb-20">
          Una por story. 15 segundos cada una. Sin guion.
        </p>

        <ol className="space-y-8">
          {QUESTIONS.map((q, i) => (
            <li key={i} className="flex items-baseline gap-4">
              <span className="shrink-0 text-xs font-mono text-zinc-700 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-base md:text-lg text-white leading-snug">
                {q}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-24 text-xs font-mono text-zinc-700 leading-relaxed">
          Editá todo en un video. Subilo en tu link de revisión.
        </p>
      </main>
    </div>
  );
}
