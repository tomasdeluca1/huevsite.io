"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  Twitter,
  Linkedin,
  Instagram,
  LayoutGrid,
  Sparkles,
  Check,
  Link2,
  MessageSquare,
  Video,
  Eye,
  EyeOff,
  RotateCw,
} from "lucide-react";

interface Interview {
  id: string;
  token: string;
  builder_username: string;
  builder_name: string | null;
  status: string;
  blog_post_id: string | null;
  generation_error: string | null;
  builder_approved_at: string | null;
  builder_feedback: string | null;
  generated_blog_markdown: string | null;
  generated_twitter_post: string | null;
  generated_linkedin_post: string | null;
  generated_instagram_caption: string | null;
  generated_instagram_carousel_prompt: string | null;
  generated_instagram_story_prompt: string | null;
  typefully_x_draft_url: string | null;
  typefully_linkedin_draft_url: string | null;
  story_video_path: string | null;
  story_video_uploaded_at: string | null;
  story_video_size_bytes: number | null;
  story_video_mime_type: string | null;
  story_video_is_public: boolean;
}

export default function InterviewEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Editable fields
  const [blogMd, setBlogMd] = useState("");
  const [twitterPost, setTwitterPost] = useState("");
  const [linkedinPost, setLinkedinPost] = useState("");
  const [igCaption, setIgCaption] = useState("");
  const [carouselPrompt, setCarouselPrompt] = useState("");
  const [storyPrompt, setStoryPrompt] = useState("");

  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Video state
  const [videoPlaybackUrl, setVideoPlaybackUrl] = useState<string | null>(null);
  const [videoPlaybackLoading, setVideoPlaybackLoading] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(false);

  const copyReviewLink = async () => {
    if (!interview) return;
    const url = `${window.location.origin}/builder-de-la-semana/review/${interview.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setMsg({ type: "err", text: "No se pudo copiar. URL: " + url });
    }
  };

  const copyBuilderMessage = async () => {
    if (!interview) return;
    const origin = window.location.origin;
    const reviewUrl = `${origin}/builder-de-la-semana/review/${interview.token}`;
    const guiaUrl = `${origin}/builder-de-la-semana/guia`;
    const firstName = (interview.builder_name ?? interview.builder_username).split(" ")[0];

    const text = `Hola ${firstName}! 🧉

Con tus respuestas generamos el blog post y las piezas para X, LinkedIn e Instagram. Revisalo en este link y decinos si está bien para publicar o si querés cambiar algo:

${reviewUrl}

En ese mismo link también podés subir un video tuyo contando tu historia — para eso te dejo esta guía con 10 preguntas disparadoras (una por story, 15 seg, vertical, sin guion):

${guiaUrl}

Grabás, editás todo junto en un video, lo subís en el link de arriba. Lo usamos para tus stories en las redes de huevsite.

Cualquier duda me escribís. ¡Gracias por el tiempo! 🙌`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      setMsg({
        type: "err",
        text: "No se pudo copiar el mensaje. Revisá permisos del navegador.",
      });
    }
  };

  const loadAdminVideoPlayback = async () => {
    if (!interview?.story_video_path) return;
    setVideoPlaybackLoading(true);
    try {
      const res = await fetch(
        `/api/admin/builder-interview/${interview.id}/video/playback-url`
      );
      if (res.ok) {
        const json = await res.json();
        setVideoPlaybackUrl(json.signedUrl);
      } else {
        setVideoPlaybackUrl(null);
      }
    } finally {
      setVideoPlaybackLoading(false);
    }
  };

  const toggleVideoPublic = async () => {
    if (!interview) return;
    setTogglingPublic(true);
    try {
      const res = await fetch(
        `/api/admin/builder-interview/${interview.id}/video/toggle-public`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: !interview.story_video_is_public }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error ?? "Error al cambiar visibilidad." });
        return;
      }
      setInterview({
        ...interview,
        story_video_is_public: json.isPublic,
      });
      setMsg({
        type: "ok",
        text: json.isPublic ? "Video público" : "Video privado",
      });
      setTimeout(() => setMsg(null), 2500);
    } finally {
      setTogglingPublic(false);
    }
  };

  const deleteVideo = async () => {
    if (!interview) return;
    if (!confirm("¿Borrar el video subido por el builder?")) return;
    setDeletingVideo(true);
    try {
      const res = await fetch(
        `/api/admin/builder-interview/${interview.id}/video`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg({ type: "err", text: j.error ?? "Error al borrar." });
        return;
      }
      setInterview({
        ...interview,
        story_video_path: null,
        story_video_uploaded_at: null,
        story_video_size_bytes: null,
        story_video_mime_type: null,
        story_video_is_public: false,
      });
      setVideoPlaybackUrl(null);
      setMsg({ type: "ok", text: "Video borrado" });
      setTimeout(() => setMsg(null), 2500);
    } finally {
      setDeletingVideo(false);
    }
  };

  // Fetch interview — auth is enforced by app/admin/layout.tsx
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/builder-interview/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        if (!res.ok) {
          setMsg({
            type: "err",
            text: `Error al cargar (${res.status}): ${json?.error ?? "sin detalle"}`,
          });
          return;
        }
        setInterview(json);
        setBlogMd(json.generated_blog_markdown ?? "");
        setTwitterPost(json.generated_twitter_post ?? "");
        setLinkedinPost(json.generated_linkedin_post ?? "");
        setIgCaption(json.generated_instagram_caption ?? "");
        setCarouselPrompt(json.generated_instagram_carousel_prompt ?? "");
        setStoryPrompt(json.generated_instagram_story_prompt ?? "");
      } catch (e: unknown) {
        const err = e instanceof Error ? e.message : "Error desconocido";
        setMsg({ type: "err", text: `Error de red: ${err}` });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Load video playback URL when interview has a video
  useEffect(() => {
    if (interview?.story_video_path && !videoPlaybackUrl && !videoPlaybackLoading) {
      loadAdminVideoPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview?.story_video_path]);

  const hasChanges = Boolean(
    interview &&
      (blogMd !== (interview.generated_blog_markdown ?? "") ||
        twitterPost !== (interview.generated_twitter_post ?? "") ||
        linkedinPost !== (interview.generated_linkedin_post ?? "") ||
        igCaption !== (interview.generated_instagram_caption ?? "") ||
        carouselPrompt !== (interview.generated_instagram_carousel_prompt ?? "") ||
        storyPrompt !== (interview.generated_instagram_story_prompt ?? ""))
  );

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/builder-interview/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generated_blog_markdown: blogMd,
          generated_twitter_post: twitterPost,
          generated_linkedin_post: linkedinPost,
          generated_instagram_caption: igCaption,
          generated_instagram_carousel_prompt: carouselPrompt,
          generated_instagram_story_prompt: storyPrompt,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setInterview(json);
        setMsg({ type: "ok", text: "Guardado ✓" });
      } else {
        setMsg({ type: "err", text: json.error ?? "Error al guardar." });
      }
    } catch (e) {
      setMsg({ type: "err", text: "Error de conexión." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3500);
    }
  };

  const approve = async () => {
    if (hasChanges) {
      setMsg({
        type: "err",
        text: "Guardá los cambios antes de publicar.",
      });
      return;
    }
    if (!confirm("¿Publicar este blog post? No se puede deshacer fácil.")) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/builder-interview/${id}/approve`,
        { method: "POST" }
      );
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: "Blog publicado 🎉" });
        // Refetch to reflect new status
        const refetch = await fetch(`/api/admin/builder-interview/${id}`);
        if (refetch.ok) setInterview(await refetch.json());
      } else {
        setMsg({ type: "err", text: json.error ?? "Error al publicar." });
      }
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    if (
      !confirm(
        "¿Volver a generar todo el contenido AI desde las respuestas del builder? Sobrescribe lo que haya ahora."
      )
    )
      return;
    setRegenerating(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/admin/builder-interview/${id}/regenerate`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error ?? "Error al regenerar." });
        return;
      }
      setMsg({ type: "ok", text: "Contenido regenerado ✅" });
      // Reseed both the interview and the editable textareas with fresh content.
      const refetch = await fetch(`/api/admin/builder-interview/${id}`);
      if (refetch.ok) {
        const fresh = await refetch.json();
        setInterview(fresh);
        setBlogMd(fresh.generated_blog_markdown ?? "");
        setTwitterPost(fresh.generated_twitter_post ?? "");
        setLinkedinPost(fresh.generated_linkedin_post ?? "");
        setIgCaption(fresh.generated_instagram_caption ?? "");
        setCarouselPrompt(fresh.generated_instagram_carousel_prompt ?? "");
        setStoryPrompt(fresh.generated_instagram_story_prompt ?? "");
      }
    } catch {
      setMsg({ type: "err", text: "Error de conexión." });
    } finally {
      setRegenerating(false);
    }
  };

  // Copy-to-clipboard for Creatibro prompts
  const [copiedPrompt, setCopiedPrompt] = useState<"carousel" | "story" | null>(null);
  const copyPrompt = async (kind: "carousel" | "story") => {
    const text = kind === "carousel" ? carouselPrompt : storyPrompt;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(kind);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch {
      setMsg({ type: "err", text: "No se pudo copiar." });
    }
  };

  // Render states — auth is enforced by app/admin/layout.tsx
  if (notFound) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-extrabold">Entrevista no encontrada</h1>
          <Link
            href="/admin/interviews"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            ← Volver a interviews
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !interview) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-8">
        <button
          onClick={() => router.push("/admin")}
          className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Volver al admin
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="section-label mb-1">// builder interview</div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              @{interview.builder_username}
            </h1>
            {interview.builder_name && (
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {interview.builder_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono px-2 py-1 rounded-full uppercase tracking-wider ${
                interview.status === "published"
                  ? "bg-green-500/20 text-green-400"
                  : interview.status === "ready"
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {interview.status}
            </span>
          </div>
        </div>
      </header>

      {/* Msg banner */}
      {msg && (
        <div
          className={`mb-4 p-3 rounded-xl border text-sm font-mono flex items-center gap-2 ${
            msg.type === "ok"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Builder review state */}
      {interview.builder_approved_at && (
        <div className="mb-4 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-sm">
          <div className="flex items-center gap-2 font-bold text-green-400 mb-1">
            <CheckCircle2 size={14} />
            Aprobado por el builder
          </div>
          <div className="text-xs text-green-300/70 font-mono">
            {new Date(interview.builder_approved_at).toLocaleString("es-AR")}
          </div>
          {interview.builder_feedback && (
            <div className="mt-3 pt-3 border-t border-green-500/20 text-xs text-green-200/80 whitespace-pre-wrap">
              <span className="font-bold">Con este comentario:</span>
              {"\n"}
              {interview.builder_feedback}
            </div>
          )}
        </div>
      )}
      {!interview.builder_approved_at && interview.builder_feedback && (
        <div className="mb-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-sm">
          <div className="flex items-center gap-2 font-bold text-yellow-400 mb-2">
            <MessageSquare size={14} />
            El builder pidió cambios
          </div>
          <div className="text-xs text-yellow-100/80 whitespace-pre-wrap">
            {interview.builder_feedback}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="sticky top-4 z-20 flex items-center gap-2 p-3 mb-6 bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--border)] rounded-2xl">
        <button
          onClick={save}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {hasChanges ? "Guardar cambios" : "Sin cambios"}
        </button>
        {interview.status === "ready" && (
          <button
            onClick={approve}
            disabled={saving || hasChanges}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-mono text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Check size={14} /> Publicar blog
          </button>
        )}
        {(interview.status === "submitted" ||
          interview.status === "generating" ||
          interview.generation_error) && (
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm font-mono text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Volver a generar el contenido AI desde las respuestas del builder"
          >
            {regenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RotateCw size={14} />
            )}
            {regenerating ? "Generando…" : "Regenerar"}
          </button>
        )}
        <button
          onClick={copyReviewLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-mono text-white hover:bg-white/10 transition-all"
          title="Link para que el builder revise el contenido"
        >
          {copiedLink ? <Check size={14} /> : <Link2 size={14} />}
          {copiedLink ? "Copiado" : "Copiar link de review"}
        </button>
        <button
          onClick={copyBuilderMessage}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-mono text-white hover:bg-white/10 transition-all"
          title="Mensaje completo para mandarle al builder (review + guía de stories)"
        >
          {copiedMessage ? <Check size={14} /> : <MessageSquare size={14} />}
          {copiedMessage ? "Copiado" : "Copiar mensaje"}
        </button>
        {interview.typefully_x_draft_url && (
          <a
            href={interview.typefully_x_draft_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors"
          >
            𝕏 Draft
          </a>
        )}
        {interview.typefully_linkedin_draft_url && (
          <a
            href={interview.typefully_linkedin_draft_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors"
          >
            in Draft
          </a>
        )}
      </div>

      {/* Debug / empty state notice */}
      {!blogMd && !twitterPost && !linkedinPost && !igCaption && !carouselPrompt && !storyPrompt && (
        <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-sm text-yellow-300 font-mono">
          <div className="font-bold mb-1">⚠️ Sin contenido generado</div>
          <div className="text-xs leading-relaxed opacity-80">
            Esta entrevista todavía no tiene contenido AI generado (status: <span className="font-bold">{interview.status}</span>).
            {interview.generation_error && (
              <>
                <br />Error de generación: <span className="text-red-400">{interview.generation_error}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* All sections visible together */}
      <div className="space-y-10">
        {/* Blog */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-[var(--accent)]" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Blog post (markdown)
            </h2>
          </div>
          <textarea
            value={blogMd}
            onChange={(e) => setBlogMd(e.target.value)}
            rows={30}
            className="w-full p-4 bg-black/30 border border-white/10 rounded-2xl text-sm text-white font-mono leading-relaxed resize-y focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            placeholder="# Título del blog..."
          />
          <p className="mt-2 text-[10px] font-mono text-[var(--text-dim)]">
            {blogMd.length} caracteres · Al guardar se sincroniza con el blog_post vinculado.
          </p>
        </section>

        {/* Twitter */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Twitter size={16} className="text-[var(--accent)]" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Tweet / Thread para X
            </h2>
          </div>
          <textarea
            value={twitterPost}
            onChange={(e) => setTwitterPost(e.target.value)}
            rows={12}
            className="w-full p-4 bg-black/30 border border-white/10 rounded-2xl text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            placeholder="Tweet aquí..."
          />
          <p className="mt-2 text-[10px] font-mono text-[var(--text-dim)]">
            {twitterPost.length} caracteres · El draft en Typefully NO se sincroniza automáticamente, editalo ahí también si ya está creado.
          </p>
        </section>

        {/* LinkedIn */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Linkedin size={16} className="text-[var(--accent)]" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Post para LinkedIn
            </h2>
          </div>
          <textarea
            value={linkedinPost}
            onChange={(e) => setLinkedinPost(e.target.value)}
            rows={18}
            className="w-full p-4 bg-black/30 border border-white/10 rounded-2xl text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            placeholder="Post de LinkedIn..."
          />
          <p className="mt-2 text-[10px] font-mono text-[var(--text-dim)]">
            {linkedinPost.length} caracteres · El draft en Typefully NO se sincroniza automáticamente.
          </p>
        </section>

        {/* Instagram caption */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Instagram size={16} className="text-[var(--accent)]" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Caption de Instagram
            </h2>
          </div>
          <textarea
            value={igCaption}
            onChange={(e) => setIgCaption(e.target.value)}
            rows={14}
            className="w-full p-4 bg-black/30 border border-white/10 rounded-2xl text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            placeholder="Caption + hashtags..."
          />
          <p className="mt-2 text-[10px] font-mono text-[var(--text-dim)]">
            {igCaption.length} caracteres
          </p>
        </section>

        {/* Instagram carousel prompt (Creatibro) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} className="text-[var(--accent)]" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Prompt carrusel IG (Creatibro)
              </h2>
            </div>
            <button
              onClick={() => copyPrompt("carousel")}
              disabled={!carouselPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {copiedPrompt === "carousel" ? <Check size={12} /> : <Link2 size={12} />}
              {copiedPrompt === "carousel" ? "Copiado" : "Copiar para Creatibro"}
            </button>
          </div>
          <textarea
            value={carouselPrompt}
            onChange={(e) => setCarouselPrompt(e.target.value)}
            rows={8}
            className="w-full p-4 bg-black/30 border border-white/10 rounded-2xl text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            placeholder="Brief en lenguaje natural para Creatibro..."
          />
          <p className="mt-2 text-[10px] font-mono text-[var(--text-dim)]">
            {carouselPrompt.length} caracteres · Pegalo en creatibro.com con las fotos del builder. En semanas con co-ganadores este prompt presenta a TODOS (se regenera al submitir el último form).
          </p>
        </section>

        {/* Instagram story prompt (Creatibro) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--accent)]" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Prompt story IG (Creatibro)
              </h2>
            </div>
            <button
              onClick={() => copyPrompt("story")}
              disabled={!storyPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {copiedPrompt === "story" ? <Check size={12} /> : <Link2 size={12} />}
              {copiedPrompt === "story" ? "Copiado" : "Copiar para Creatibro"}
            </button>
          </div>
          <textarea
            value={storyPrompt}
            onChange={(e) => setStoryPrompt(e.target.value)}
            rows={5}
            className="w-full p-4 bg-black/30 border border-white/10 rounded-2xl text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            placeholder="Brief corto para Creatibro (1 slide vertical 9:16)..."
          />
          <p className="mt-2 text-[10px] font-mono text-[var(--text-dim)]">
            {storyPrompt.length} caracteres · Story siempre individual de este builder.
          </p>
        </section>

        {/* Story video from builder */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-[var(--accent)]" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Video del builder
              </h2>
            </div>
            {interview.story_video_path && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVideoPublic}
                  disabled={togglingPublic}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                    interview.story_video_is_public
                      ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                      : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                  }`}
                  title={
                    interview.story_video_is_public
                      ? "Video público — clic para hacerlo privado"
                      : "Video privado — clic para hacerlo público"
                  }
                >
                  {togglingPublic ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : interview.story_video_is_public ? (
                    <Eye size={12} />
                  ) : (
                    <EyeOff size={12} />
                  )}
                  {interview.story_video_is_public ? "Público" : "Privado"}
                </button>
                <button
                  onClick={deleteVideo}
                  disabled={deletingVideo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-xs font-mono text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  {deletingVideo ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Borrar
                </button>
              </div>
            )}
          </div>

          {!interview.story_video_path && (
            <div className="p-8 text-center bg-black/30 border border-dashed border-white/10 rounded-2xl">
              <Video size={24} className="mx-auto mb-2 text-[var(--text-dim)]" />
              <div className="text-sm text-[var(--text-muted)] font-mono">
                El builder todavía no subió su video.
              </div>
              <div className="text-[10px] text-[var(--text-dim)] font-mono mt-1">
                Se sube desde el link de review.
              </div>
            </div>
          )}

          {interview.story_video_path && (
            <div>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[9/16] max-w-xs mx-auto">
                {videoPlaybackLoading && !videoPlaybackUrl && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
                  </div>
                )}
                {videoPlaybackUrl && (
                  <video
                    key={videoPlaybackUrl}
                    src={videoPlaybackUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-[var(--text-dim)]">
                {interview.story_video_size_bytes && (
                  <span>
                    {Math.round(interview.story_video_size_bytes / 1024 / 1024)} MB
                  </span>
                )}
                {interview.story_video_mime_type && (
                  <span>{interview.story_video_mime_type}</span>
                )}
                {interview.story_video_uploaded_at && (
                  <span>
                    subido{" "}
                    {new Date(interview.story_video_uploaded_at).toLocaleString("es-AR")}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
