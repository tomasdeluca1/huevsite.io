"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
}

export function ImageUpload({ value, onChange, label, folder = "general" }: Props) {
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
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      {label && <div className="section-label !text-[9px] px-1">// {label.toLowerCase()}</div>}
      
      <div className="relative group">
        {value ? (
          <div className="relative aspect-video rounded-[1.5rem] overflow-hidden border border-[var(--border-bright)] bg-[var(--surface2)] shadow-xl">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-white text-black hover:scale-110 active:scale-95 transition-all shadow-lg"
                title="Cambiar imagen"
              >
                <ImageIcon size={20} />
              </button>
              <button
                onClick={removeImage}
                className="p-3 rounded-xl bg-red-500 text-white hover:scale-110 active:scale-95 transition-all shadow-lg"
                title="Eliminar imagen"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            type="button"
            className="w-full aspect-video flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border-2 border-dashed border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--accent)] hover:bg-black/40 transition-all group"
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
                  <p className="text-sm font-bold tracking-tight">Elegir archivo</p>
                  <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">PNG, JPG hasta 5MB</p>
                </div>
              </>
            )}
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
