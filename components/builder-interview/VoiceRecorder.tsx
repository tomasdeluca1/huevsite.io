"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const t = useTranslations("bdls");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribe(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch {
      // User denied mic or not available
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { text } = await res.json();
        if (text) onTranscription(text);
      }
    } finally {
      setTranscribing(false);
    }
  };

  if (transcribing) {
    return (
      <button
        type="button"
        disabled
        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-500"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={recording ? stopRecording : startRecording}
      className={`p-2.5 rounded-xl border transition-all ${
        recording
          ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
          : "bg-white/5 border-white/10 text-zinc-500 hover:text-[#C8FF00] hover:border-[#C8FF00]/30"
      }`}
      title={recording ? t("voiceRecorder.stop") : t("voiceRecorder.record")}
    >
      {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
