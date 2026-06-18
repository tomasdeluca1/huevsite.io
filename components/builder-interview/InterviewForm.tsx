"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Send,
  Loader2,
  Mic,
  X,
  Pencil,
} from "lucide-react";
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
    fields: [
      { key: "intro_who_are_you", type: "textarea" as const },
      { key: "intro_origin_story", type: "textarea" as const },
      { key: "intro_build_in_public", type: "textarea" as const },
    ],
  },
  {
    id: "projects",
    fields: [
      { key: "projects_main_project", type: "textarea" as const },
      { key: "projects_problem_solved", type: "textarea" as const },
      { key: "projects_stack", type: "textarea" as const },
      { key: "projects_biggest_challenge", type: "textarea" as const },
      { key: "projects_users_traction", type: "textarea" as const },
      { key: "projects_links", type: "textarea" as const },
    ],
  },
  {
    id: "quickfire",
    fields: [
      { key: "quickfire_tool", type: "input" as const },
      { key: "quickfire_inspiration", type: "input" as const },
      { key: "quickfire_advice", type: "textarea" as const },
      { key: "quickfire_whats_next", type: "input" as const },
      { key: "quickfire_where_to_find", type: "input" as const },
    ],
  },
];

export function InterviewForm({
  token,
  builderName,
  builderUsername,
  onComplete,
}: InterviewFormProps) {
  const t = useTranslations("bdls");
  const PREVIEW_INDEX = SECTIONS.length;
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceTip, setShowVoiceTip] = useState(true);

  const isPreview = currentSection === PREVIEW_INDEX;
  const section = isPreview ? null : SECTIONS[currentSection];
  const isLastFormSection = currentSection === SECTIONS.length - 1;
  const isFirst = currentSection === 0;

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const canAdvance = isPreview
    ? SECTIONS.every((s) =>
        s.fields.every((f) => (formData[f.key] ?? "").trim().length > 0)
      )
    : (section?.fields ?? []).every(
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
        throw new Error(json.error || t("form.submitError"));
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
                {t.rich("form.voiceTip", {
                  strong: (chunks) => (
                    <strong className="text-white">{chunks}</strong>
                  ),
                  micIcon: () => (
                    <span className="inline-flex items-center align-middle px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10">
                      <Mic className="w-3 h-3 text-zinc-400" />
                    </span>
                  ),
                })}
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
        {[...SECTIONS, { id: "preview" }].map((s, i) => (
          <div
            key={s.id}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= currentSection ? "bg-[#C8FF00]" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {section ? (
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
                {t(`form.sections.${section.id}.title`)}
              </h2>
              <p className="text-zinc-500 mt-2">{t(`form.sections.${section.id}.subtitle`)}</p>
            </div>

            {/* Fields */}
            <div className="space-y-8">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    {t(`form.fields.${field.key}.label`)}
                  </label>
                  <div className="relative">
                    {field.type === "textarea" ? (
                      <textarea
                        value={formData[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={t(`form.fields.${field.key}.placeholder`)}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#C8FF00]/50 focus:ring-1 focus:ring-[#C8FF00]/20 transition-colors resize-none text-sm leading-relaxed"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={t(`form.fields.${field.key}.placeholder`)}
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
                {t("form.previous")}
              </button>

              <button
                onClick={() => setCurrentSection((s) => s + 1)}
                disabled={!canAdvance}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-[#C8FF00] text-black hover:bg-[#d4ff33] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLastFormSection ? t("form.reviewBeforeSend") : t("form.next")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Preview header */}
            <div className="mb-10">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#C8FF00] mb-2">
                {t("form.preview.eyebrow")}
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                {t("form.preview.title")}
              </h2>
              <p className="text-zinc-500 mt-2">
                {t("form.preview.subtitle")}
              </p>
            </div>

            {/* All sections, all fields, editable inline */}
            <div className="space-y-12">
              {SECTIONS.map((s, sIndex) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                        {sIndex + 1} / {SECTIONS.length}
                      </p>
                      <h3 className="text-lg font-extrabold tracking-tight text-white">
                        {t(`form.sections.${s.id}.title`)}
                      </h3>
                    </div>
                    <button
                      onClick={() => setCurrentSection(sIndex)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      {t("form.preview.goToSection")}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {s.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-bold text-zinc-300 mb-2">
                          {t(`form.fields.${field.key}.label`)}
                        </label>
                        <div className="relative">
                          {field.type === "textarea" ? (
                            <textarea
                              value={formData[field.key] ?? ""}
                              onChange={(e) => updateField(field.key, e.target.value)}
                              placeholder={t(`form.fields.${field.key}.placeholder`)}
                              rows={4}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#C8FF00]/50 focus:ring-1 focus:ring-[#C8FF00]/20 transition-colors resize-none text-sm leading-relaxed"
                            />
                          ) : (
                            <input
                              type="text"
                              value={formData[field.key] ?? ""}
                              onChange={(e) => updateField(field.key, e.target.value)}
                              placeholder={t(`form.fields.${field.key}.placeholder`)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#C8FF00]/50 focus:ring-1 focus:ring-[#C8FF00]/20 transition-colors text-sm"
                            />
                          )}
                          <div className="absolute top-3 right-3">
                            <VoiceRecorder
                              onTranscription={(text) => {
                                const current = formData[field.key] ?? "";
                                updateField(
                                  field.key,
                                  current ? `${current} ${text}` : text
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm mt-6">{error}</p>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-12">
              <button
                onClick={() => setCurrentSection(SECTIONS.length - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("form.previous")}
              </button>

              <button
                onClick={handleSubmit}
                disabled={!canAdvance || submitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-[#C8FF00] text-black hover:bg-[#d4ff33] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("form.generating")}
                  </>
                ) : (
                  <>
                    {t("form.submit")}
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            {!canAdvance && (
              <p className="mt-3 text-[10px] font-mono text-zinc-600 text-right">
                {t("form.incompleteFields")}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
