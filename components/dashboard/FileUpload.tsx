"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2, FileText, AlertTriangle } from "lucide-react";
import { uploadAsset } from "@/lib/upload-asset";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  accept?: string;
}

export function FileUpload({ 
  value, 
  onChange, 
  label, 
  folder = "general", 
  accept = "application/pdf,image/*,video/*"
}: Props) {
  const t = useTranslations("dashboard");
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const publicUrl = await uploadAsset(supabase, file, folder);
      onChange(publicUrl);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setError(err?.message || t("fileUpload.uploadError"));
    } finally {
      setIsUploading(false);
      // Permite reintentar el MISMO archivo
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = () => {
    onChange("");
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  return (
    <div className="space-y-2">
      {label && <div className="section-label !text-[9px] px-1">// {label.toLowerCase()}</div>}
      
      <div className="relative group">
        {value ? (
          <div className="relative p-6 rounded-[1.5rem] border border-[var(--border-bright)] bg-[var(--surface2)] shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {value.match(/\.(mp4|webm|ogg)$/i) ? (
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <Upload size={20} className="text-red-400" />
                </div>
              ) : value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={value} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="Preview" />
              ) : (
                <FileText size={24} className="text-[var(--accent)] shrink-0" />
              )}
              <span className="font-mono text-sm truncate">{getFileName(value)}</span>
            </div>
            <div className="flex gap-2 shrink-0">
               <button
                 onClick={() => window.open(value, "_blank")}
                 className="p-2 rounded-xl bg-black/40 text-white hover:scale-110 active:scale-95 transition-all shadow-lg"
                 title={t("fileUpload.viewFile")}
               >
                 {t("fileUpload.open")}
               </button>
               <button
                 onClick={removeFile}
                 className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white active:scale-95 transition-all shadow-lg"
                 title={t("fileUpload.removeFile")}
               >
                 <X size={18} />
               </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            type="button"
            className="w-full py-8 flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border-2 border-dashed border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--accent)] hover:bg-black/40 transition-all group"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
                <span className="text-[10px] font-mono text-[var(--accent)] uppercase animate-pulse">{t("fileUpload.uploading")}</span>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-black/40 border border-[var(--border-bright)] group-hover:scale-110 group-hover:border-[var(--accent)] transition-all">
                  <Upload size={28} className="text-[var(--text-muted)] group-hover:text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold tracking-tight">{t("fileUpload.choose")}</p>
                  <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">
                    {accept.includes('pdf') ? 'PDF' : ''}
                    {accept.includes('image') ? t("fileUpload.typeImage") : ''}
                    {accept.includes('video') ? t("fileUpload.typeVideo") : ''} {t("fileUpload.maxSize")}
                  </p>
                </div>
              </>
            )}
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept={accept}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
