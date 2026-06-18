"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import LocaleToggle from "@/components/LocaleToggle";
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
  Sparkles,
  Check,
  MessageSquare,
  Video,
  Upload,
  Trash2,
} from "lucide-react";

interface VideoInfo {
  uploadedAt: string | null;
  sizeBytes: number | null;
  mimeType: string | null;
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
    instagramCarouselPrompt: string | null;
    instagramStoryPrompt: string | null;
  };
  video: VideoInfo | null;
}

const ALLOWED_VIDEO_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
];
const MAX_VIDEO_BYTES = 524_288_000; // 500 MB

type VideoUploadState =
  | { type: "idle" }
  | { type: "uploading"; progress: number }
  | { type: "error"; message: string };

type PageState =
  | { type: "loading" }
  | { type: "ready"; data: ReviewData }
  | { type: "not_ready"; status: string }
  | { type: "not_found" }
  | { type: "error"; message: string };

export default function BuilderReviewPage() {
  const t = useTranslations("bdls");
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

  // Video state
  const [videoUpload, setVideoUpload] = useState<VideoUploadState>({ type: "idle" });
  const [videoPlaybackUrl, setVideoPlaybackUrl] = useState<string | null>(null);
  const [videoPlaybackLoading, setVideoPlaybackLoading] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(false);

  const refreshInterview = async () => {
    try {
      const res = await fetch(`/api/builder-interview/${token}/review`);
      if (res.ok) {
        const json = await res.json();
        setState({ type: "ready", data: json });
      }
    } catch {
      // non-blocking
    }
  };

  const loadVideoPlayback = async () => {
    setVideoPlaybackLoading(true);
    try {
      const res = await fetch(
        `/api/builder-interview/${token}/video/playback-url`
      );
      if (res.ok) {
        const json = await res.json();
        setVideoPlaybackUrl(json.signedUrl);
      } else {
        setVideoPlaybackUrl(null);
      }
    } catch {
      setVideoPlaybackUrl(null);
    } finally {
      setVideoPlaybackLoading(false);
    }
  };

  const uploadVideo = async (file: File) => {
    // Client-side validation
    if (!ALLOWED_VIDEO_MIME.includes(file.type)) {
      setVideoUpload({
        type: "error",
        message: t("review.video.errorBadFormat"),
      });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setVideoUpload({
        type: "error",
        message: t("review.video.errorTooLarge"),
      });
      return;
    }

    setVideoUpload({ type: "uploading", progress: 0 });

    try {
      // Step 1: get signed upload URL
      const urlRes = await fetch(
        `/api/builder-interview/${token}/video/upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        }
      );

      if (!urlRes.ok) {
        const j = await urlRes.json().catch(() => ({}));
        throw new Error(j.error ?? t("review.video.errorPrepareUpload"));
      }

      const { path, signedUrl } = await urlRes.json();

      // Step 2: upload via XHR (to get progress events)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setVideoUpload({ type: "uploading", progress });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(t("review.video.errorUploadFailed", { status: xhr.status })));
        };
        xhr.onerror = () => reject(new Error(t("review.video.errorNetwork")));
        xhr.send(file);
      });

      // Step 3: mark as complete server-side
      const completeRes = await fetch(
        `/api/builder-interview/${token}/video/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        }
      );

      if (!completeRes.ok) {
        const j = await completeRes.json().catch(() => ({}));
        throw new Error(j.error ?? t("review.video.errorSaveFailed"));
      }

      setVideoUpload({ type: "idle" });
      setVideoPlaybackUrl(null);
      await refreshInterview();
    } catch (e) {
      const message = e instanceof Error ? e.message : t("review.video.errorUnknown");
      setVideoUpload({ type: "error", message });
    }
  };

  const deleteVideo = async () => {
    if (!confirm(t("review.video.deleteConfirm"))) return;
    setDeletingVideo(true);
    try {
      const res = await fetch(`/api/builder-interview/${token}/video`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setVideoUpload({
          type: "error",
          message: j.error ?? t("review.video.errorDeleteFailed"),
        });
        return;
      }
      setVideoPlaybackUrl(null);
      setVideoUpload({ type: "idle" });
      await refreshInterview();
    } finally {
      setDeletingVideo(false);
    }
  };

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
            message: json.error ?? t("review.genericError"),
          });
          return;
        }
        setState({ type: "ready", data: json });
        if (json.previousFeedback) setFeedback(json.previousFeedback);
      } catch {
        setState({ type: "error", message: t("review.connectionError") });
      }
    }
    load();
  }, [token, t]);

  // Load signed playback URL whenever a video exists and we don't have one yet
  useEffect(() => {
    if (
      state.type === "ready" &&
      state.data.video &&
      !videoPlaybackUrl &&
      !videoPlaybackLoading
    ) {
      loadVideoPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
          message: json.error ?? t("review.errorSaveAnswer"),
        });
        return;
      }
      setResult({ type: approved ? "approved" : "feedback_sent" });
    } catch {
      setResult({ type: "error", message: t("review.connectionError") });
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
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
            {t("review.headerLabel")}
          </span>
          <LocaleToggle />
        </div>
      </header>

      <main className="flex-1 px-6 py-16 md:py-20 max-w-3xl mx-auto w-full">
        {state.type === "loading" && (
          <div className="text-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-[#C8FF00] mx-auto mb-4" />
            <p className="text-zinc-500 text-sm font-mono">{t("review.loading")}</p>
          </div>
        )}

        {state.type === "not_found" && (
          <div className="text-center py-32">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold mb-2">{t("review.notFoundTitle")}</h1>
            <p className="text-zinc-500 text-sm">
              {t("review.notFoundBody")}
            </p>
          </div>
        )}

        {state.type === "not_ready" && (
          <div className="text-center py-32">
            <Loader2 className="w-8 h-8 text-[#C8FF00] mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold mb-2">{t("review.notReadyTitle")}</h1>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              {t("review.notReadyBody")}
              {state.status !== "unknown" && (
                <span className="block mt-2 font-mono text-xs text-zinc-700">
                  {t("review.statusLabel", { status: state.status })}
                </span>
              )}
            </p>
          </div>
        )}

        {state.type === "error" && (
          <div className="text-center py-32">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold mb-2">{t("review.errorTitle")}</h1>
            <p className="text-zinc-500 text-sm">{state.message}</p>
          </div>
        )}

        {state.type === "ready" && (
          <>
            {/* Intro */}
            <div className="mb-12 md:mb-16">
              <div className="text-[10px] font-mono text-[#C8FF00] uppercase tracking-widest mb-3">
                {t("review.introEyebrow")}
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-4">
                {t("review.greeting", { name: state.data.builderName.split(" ")[0] })}
              </h1>
              <p className="text-zinc-400 text-base md:text-lg max-w-xl leading-relaxed">
                {t("review.introBody")}
              </p>
              {state.data.approvedAt && (
                <div className="mt-6 inline-flex items-center gap-2 text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2">
                  <CheckCircle2 size={14} />
                  {t("review.approvedOn", {
                    date: new Date(state.data.approvedAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                    }),
                  })}
                </div>
              )}
            </div>

            {/* Sections */}
            <div className="space-y-16">
              {/* Blog */}
              {state.data.content.blogMarkdown && (
                <Section icon={<FileText size={16} />} label={t("review.sections.blog")}>
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-zinc-300 prose-p:leading-relaxed prose-a:text-[#C8FF00] prose-strong:text-white prose-blockquote:border-[#C8FF00] prose-blockquote:text-zinc-400 prose-code:text-[#C8FF00] prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {state.data.content.blogMarkdown}
                    </ReactMarkdown>
                  </div>
                </Section>
              )}

              {/* Twitter */}
              {state.data.content.twitterPost && (
                <Section icon={<Twitter size={16} />} label={t("review.sections.twitter")}>
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {state.data.content.twitterPost}
                  </div>
                </Section>
              )}

              {/* LinkedIn */}
              {state.data.content.linkedinPost && (
                <Section icon={<Linkedin size={16} />} label={t("review.sections.linkedin")}>
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {state.data.content.linkedinPost}
                  </div>
                </Section>
              )}

              {/* Instagram caption */}
              {state.data.content.instagramCaption && (
                <Section icon={<Instagram size={16} />} label={t("review.sections.instagramCaption")}>
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {state.data.content.instagramCaption}
                  </div>
                </Section>
              )}

              {/* Instagram carousel prompt (for Creatibro) */}
              {state.data.content.instagramCarouselPrompt && (
                <Section
                  icon={<LayoutGrid size={16} />}
                  label={t("review.sections.instagramCarousel")}
                >
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {state.data.content.instagramCarouselPrompt}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500 font-mono">
                    {t("review.sections.instagramCarouselHint")}
                  </p>
                </Section>
              )}

              {/* Instagram story prompt (for Creatibro) */}
              {state.data.content.instagramStoryPrompt && (
                <Section
                  icon={<Sparkles size={16} />}
                  label={t("review.sections.instagramStory")}
                >
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {state.data.content.instagramStoryPrompt}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500 font-mono">
                    {t("review.sections.instagramStoryHint")}
                  </p>
                </Section>
              )}
            </div>

            {/* Story video */}
            <div className="mt-20 pt-12 border-t border-white/10">
              <div className="text-[10px] font-mono text-[#C8FF00] uppercase tracking-widest mb-3">
                {t("review.video.eyebrow")}
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                {t("review.video.title")}
              </h2>
              <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mb-8">
                {t.rich("review.video.body", {
                  guide: (chunks) => (
                    <Link
                      href="/builder-de-la-semana/guia"
                      target="_blank"
                      className="text-[#C8FF00] underline underline-offset-4 hover:opacity-80"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>

              {/* Existing video player */}
              {state.data.video && (
                <div className="mb-6">
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[9/16] max-w-sm mx-auto">
                    {videoPlaybackLoading && !videoPlaybackUrl && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-[#C8FF00]" />
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
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-zinc-500">
                    {state.data.video.sizeBytes && (
                      <span>
                        {t("review.video.sizeMb", {
                          mb: Math.round(state.data.video.sizeBytes / 1024 / 1024),
                        })}
                      </span>
                    )}
                    {state.data.video.uploadedAt && (
                      <span>
                        {t("review.video.uploadedOn", {
                          date: new Date(state.data.video.uploadedAt).toLocaleDateString(
                            "es-AR",
                            { day: "2-digit", month: "short" }
                          ),
                        })}
                      </span>
                    )}
                    <button
                      onClick={deleteVideo}
                      disabled={deletingVideo || videoUpload.type === "uploading"}
                      className="flex items-center gap-1.5 text-red-400/70 hover:text-red-400 disabled:opacity-40 transition-colors"
                    >
                      {deletingVideo ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      {t("review.video.delete")}
                    </button>
                  </div>
                </div>
              )}

              {/* Upload UI */}
              <div className="relative">
                <label
                  htmlFor="story-video-input"
                  className={`block p-8 rounded-2xl border-2 border-dashed text-center transition-colors cursor-pointer ${
                    videoUpload.type === "uploading"
                      ? "border-[#C8FF00]/40 bg-[#C8FF00]/5 cursor-wait"
                      : "border-white/15 hover:border-[#C8FF00]/50 hover:bg-white/[0.02]"
                  }`}
                >
                  {videoUpload.type === "idle" && (
                    <>
                      <Upload className="w-6 h-6 mx-auto mb-3 text-[#C8FF00]" />
                      <div className="text-sm font-bold text-white mb-1">
                        {state.data.video ? t("review.video.replace") : t("review.video.choose")}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">
                        {t("review.video.chooseHint")}
                      </div>
                    </>
                  )}
                  {videoUpload.type === "uploading" && (
                    <>
                      <Video className="w-6 h-6 mx-auto mb-3 text-[#C8FF00] animate-pulse" />
                      <div className="text-sm font-bold text-white mb-3">
                        {t("review.video.uploading")}
                      </div>
                      <div className="w-full max-w-xs mx-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#C8FF00] transition-all"
                          style={{ width: `${videoUpload.progress}%` }}
                        />
                      </div>
                      <div className="mt-2 text-[11px] font-mono text-zinc-500">
                        {videoUpload.progress}%
                      </div>
                    </>
                  )}
                  {videoUpload.type === "error" && (
                    <>
                      <AlertCircle className="w-6 h-6 mx-auto mb-3 text-red-400" />
                      <div className="text-sm font-bold text-red-300 mb-1">
                        {t("review.video.uploadErrorTitle")}
                      </div>
                      <div className="text-[11px] font-mono text-red-300/70 mb-3">
                        {videoUpload.message}
                      </div>
                      <div className="text-xs text-white/70">
                        {t("review.video.retry")}
                      </div>
                    </>
                  )}
                </label>
                <input
                  id="story-video-input"
                  type="file"
                  accept={ALLOWED_VIDEO_MIME.join(",")}
                  className="sr-only"
                  disabled={videoUpload.type === "uploading" || deletingVideo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadVideo(file);
                    // reset input so the same file can be re-picked after error
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            {/* Review actions */}
            <div className="mt-20 pt-12 border-t border-white/10">
              <div className="text-[10px] font-mono text-[#C8FF00] uppercase tracking-widest mb-3">
                {t("review.actions.eyebrow")}
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-6">
                {t("review.actions.title")}
              </h2>

              {result?.type === "approved" && (
                <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-300 mb-8">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 size={18} />
                    {t("review.actions.approvedTitle")}
                  </div>
                  <p className="text-sm text-green-300/80">
                    {t("review.actions.approvedBody")}
                  </p>
                </div>
              )}

              {result?.type === "feedback_sent" && (
                <div className="p-6 rounded-2xl bg-[#C8FF00]/10 border border-[#C8FF00]/30 text-[#C8FF00] mb-8">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <MessageSquare size={18} />
                    {t("review.actions.feedbackSentTitle")}
                  </div>
                  <p className="text-sm opacity-80">
                    {t("review.actions.feedbackSentBody")}
                  </p>
                </div>
              )}

              {result?.type === "error" && (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 mb-8">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertCircle size={18} />
                    {t("review.actions.errorTitle")}
                  </div>
                  <p className="text-sm text-red-300/80">{result.message}</p>
                </div>
              )}

              {!result && (
                <>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
                    {t("review.actions.feedbackLabel")}
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    placeholder={t("review.actions.feedbackPlaceholder")}
                    className="w-full p-4 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-[#C8FF00]/50 transition-colors"
                  />
                  <p className="mt-2 text-[10px] font-mono text-zinc-600">
                    {t("review.actions.charCount", { count: feedback.length })}
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
                      {t("review.actions.approveButton")}
                    </button>
                    <button
                      onClick={() => submitReview(false)}
                      disabled={submitting || feedback.trim().length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <MessageSquare size={16} />
                      {t("review.actions.requestChangesButton")}
                    </button>
                  </div>
                  {feedback.trim().length === 0 && (
                    <p className="mt-3 text-[10px] font-mono text-zinc-600 text-center sm:text-left">
                      {t("review.actions.requestChangesHint")}
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
