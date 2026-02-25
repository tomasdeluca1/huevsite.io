"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2, FileText } from "lucide-react";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  accept?: string;
}

export function FileUpload({ value, onChange, label, folder = "general", accept = "application/pdf" }: Props) {
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("assets")
        .getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
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
              <FileText size={24} className="text-[var(--accent)] shrink-0" />
              <span className="font-mono text-sm truncate">{getFileName(value)}</span>
            </div>
            <div className="flex gap-2 shrink-0">
               <button
                 onClick={() => window.open(value, "_blank")}
                 className="p-2 rounded-xl bg-black/40 text-white hover:scale-110 active:scale-95 transition-all shadow-lg"
                 title="Ver archivo"
               >
                 Abrir
               </button>
               <button
                 onClick={removeFile}
                 className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white active:scale-95 transition-all shadow-lg"
                 title="Eliminar archivo"
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
                <span className="text-[10px] font-mono text-[var(--accent)] uppercase animate-pulse">subiendo...</span>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-black/40 border border-[var(--border-bright)] group-hover:scale-110 group-hover:border-[var(--accent)] transition-all">
                  <Upload size={28} className="text-[var(--text-muted)] group-hover:text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold tracking-tight">Seleccionar archivo</p>
                  <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">PDF hasta 5MB</p>
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
    </div>
  );
}
