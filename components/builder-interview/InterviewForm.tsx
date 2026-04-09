"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Send, Loader2, Mic, X } from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";

interface InterviewFormProps {
  token: string;
  builderName: string;
  builderUsername: string;
  onComplete: () => void;
}

const SECTIONS = [
  {
    id: "intro",
    title: "Contanos sobre vos",
    subtitle: "Quién sos, de dónde venís y por qué buildeás en público.",
    fields: [
      {
        key: "intro_who_are_you",
        label: "¿Quién sos? Contanos en unas líneas.",
        placeholder: "Soy diseñador, dev, maker... lo que se te ocurra. Contá lo que quieras.",
        type: "textarea" as const,
      },
      {
        key: "intro_origin_story",
        label: "¿Cómo arrancaste a buildear cosas por tu cuenta?",
        placeholder: "Tu origin story. ¿Qué te motivó? ¿Cuándo fue el click?",
        type: "textarea" as const,
      },
      {
        key: "intro_build_in_public",
        label: "¿Qué significa build in public para vos?",
        placeholder: "¿Cómo lo practicás? ¿Por qué te parece importante?",
        type: "textarea" as const,
      },
    ],
  },
  {
    id: "projects",
    title: "Mostrame lo que construiste",
    subtitle: "Tu proyecto principal, el stack, los desafíos y la tracción.",
    fields: [
      {
        key: "projects_main_project",
        label: "¿En qué proyecto estás laburando ahora?",
        placeholder: "Contalo como si se lo explicaras a un amigo.",
        type: "textarea" as const,
      },
      {
        key: "projects_problem_solved",
        label: "¿Qué problema real resuelve?",
        placeholder: "¿Cómo se te ocurrió? ¿A quién le sirve?",
        type: "textarea" as const,
      },
      {
        key: "projects_stack",
        label: "¿Qué stack usás y por qué?",
        placeholder: "Lenguajes, frameworks, servicios... y por qué elegiste esas herramientas.",
        type: "textarea" as const,
      },
      {
        key: "projects_biggest_challenge",
        label: "¿Cuál fue el momento más difícil del proyecto?",
        placeholder: "Un bug, una decisión complicada, un momento donde quisiste tirar todo...",
        type: "textarea" as const,
      },
      {
        key: "projects_users_traction",
        label: "¿Tenés usuarios reales? ¿Cómo conseguiste los primeros?",
        placeholder: "Números, anécdotas, lo que tengas.",
        type: "textarea" as const,
      },
      {
        key: "projects_links",
        label: "Links a tus proyectos (URLs)",
        placeholder: "https://miproyecto.com, https://github.com/...",
        type: "textarea" as const,
      },
    ],
  },
  {
    id: "quickfire",
    title: "Ping pong rápido",
    subtitle: "Respuestas cortas. Lo primero que se te venga a la cabeza.",
    fields: [
      {
        key: "quickfire_tool",
        label: "Una herramienta que no podrías dejar de usar",
        placeholder: "Esa herramienta que si te la sacan llorás.",
        type: "input" as const,
      },
      {
        key: "quickfire_inspiration",
        label: "Un builder o creador que te inspire",
        placeholder: "¿Quién te parece que la tiene clara?",
        type: "input" as const,
      },
      {
        key: "quickfire_advice",
        label: "Un consejo para alguien que recién arranca a buildear",
        placeholder: "Lo que te hubiera gustado saber al principio.",
        type: "textarea" as const,
      },
      {
        key: "quickfire_whats_next",
        label: "¿Qué viene después? Tu próximo milestone.",
        placeholder: "¿Qué estás por lanzar, mejorar o experimentar?",
        type: "input" as const,
      },
      {
        key: "quickfire_where_to_find",
        label: "¿Dónde te pueden encontrar?",
        placeholder: "Twitter, LinkedIn, web, lo que uses.",
        type: "input" as const,
      },
    ],
  },
];

export function InterviewForm({
  token,
  builderName,
  builderUsername,
  onComplete,
}: InterviewFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceTip, setShowVoiceTip] = useState(true);

  const section = SECTIONS[currentSection];
  const isLast = currentSection === SECTIONS.length - 1;
  const isFirst = currentSection === 0;

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const canAdvance = section.fields.every(
    (f) => (formData[f.key] ?? "").trim().length > 0
  );

  const handleSubmit = async () => {
    if (!canAdvance) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/builder-interview/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al enviar.");
      }

      onComplete();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Voice tip banner */}
      <AnimatePresence>
        {showVoiceTip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 flex items-start gap-3 p-4 rounded-2xl bg-[#C8FF00]/5 border border-[#C8FF00]/15"
          >
            <Mic className="w-5 h-5 text-[#C8FF00] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-zinc-300">
                <strong className="text-white">Tip:</strong> Podés grabar tus respuestas con el micrófono{" "}
                <span className="inline-flex items-center align-middle px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10">
                  <Mic className="w-3 h-3 text-zinc-400" />
                </span>{" "}
                en cada campo. Es más rápido y natural que escribir.
              </p>
            </div>
            <button
              onClick={() => setShowVoiceTip(false)}
              className="shrink-0 p-1 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="flex gap-2 mb-12">
        {SECTIONS.map((s, i) => (
          <div
            key={s.id}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= currentSection ? "bg-[#C8FF00]" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Section header */}
          <div className="mb-10">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#C8FF00] mb-2">
              {currentSection + 1} / {SECTIONS.length}
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {section.title}
            </h2>
            <p className="text-zinc-500 mt-2">{section.subtitle}</p>
          </div>

          {/* Fields */}
          <div className="space-y-8">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-bold text-zinc-300 mb-2">
                  {field.label}
                </label>
                <div className="relative">
                  {field.type === "textarea" ? (
                    <textarea
                      value={formData[field.key] ?? ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#C8FF00]/50 focus:ring-1 focus:ring-[#C8FF00]/20 transition-colors resize-none text-sm leading-relaxed"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.key] ?? ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#C8FF00]/50 focus:ring-1 focus:ring-[#C8FF00]/20 transition-colors text-sm"
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <VoiceRecorder
                      onTranscription={(text) => {
                        const current = formData[field.key] ?? "";
                        updateField(field.key, current ? `${current} ${text}` : text);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12">
            <button
              onClick={() => setCurrentSection((s) => s - 1)}
              disabled={isFirst}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors ${
                isFirst
                  ? "opacity-0 pointer-events-none"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={!canAdvance || submitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-[#C8FF00] text-black hover:bg-[#d4ff33] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando contenido...
                  </>
                ) : (
                  <>
                    Enviar respuestas
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentSection((s) => s + 1)}
                disabled={!canAdvance}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-[#C8FF00] text-black hover:bg-[#d4ff33] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
