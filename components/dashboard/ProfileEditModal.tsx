"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Camera, Loader2, X, Link2, User, AlertTriangle } from "lucide-react";
import CountrySelect from "@/components/CountrySelect";
import { createClient } from "@/lib/supabase/client";
import { uploadAsset } from "@/lib/upload-asset";
import { getContrastColor } from "@/lib/profile-types";

export interface ProfileEditData {
    username: string;
    display_name: string;
    email: string;
    tagline: string;
    avatarUrl: string;
    githubHandle: string;
    country: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accentColor: string;
    selectedSubSiteId: string | null;
    profileUsername: string;
    data: ProfileEditData;
    setData: React.Dispatch<React.SetStateAction<ProfileEditData>>;
    /** Persists the changes. Returns true on success (modal closes), false on error (stays open). */
    onSave: () => Promise<boolean>;
}

const LABEL = "text-[10px] uppercase font-mono tracking-widest text-white/40 px-1 font-bold";
const INPUT =
    "w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none text-sm focus:border-[var(--accent)] transition-all";

export function ProfileEditModal({
    isOpen,
    onClose,
    accentColor,
    selectedSubSiteId,
    profileUsername,
    data,
    setData,
    onSave,
}: Props) {
    const t = useTranslations("dashboard");
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isSubSite = !!selectedSubSiteId;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        setUploadError(null);
        try {
            const url = await uploadAsset(supabase, file, "avatars");
            setData((p) => ({ ...p, avatarUrl: url }));
        } catch (err: any) {
            setUploadError(err?.message || t("imageUpload.uploadError"));
        } finally {
            setIsUploading(false);
            // Permite reintentar el MISMO archivo (onChange no dispara si no cambia el value).
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const ok = await onSave();
        setIsSaving(false);
        if (ok) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="relative w-full max-w-md bg-[var(--surface)] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-[510] flex flex-col max-h-[90dvh]"
                    >
                        {/* Header (fixed) */}
                        <div className="shrink-0 flex items-start justify-between px-8 pt-8 pb-5 border-b border-white/5">
                            <div>
                                <div className="section-label mb-1.5">
                                    // {t("page.identity")} {isSubSite ? t("page.subSiteParenthetical") : ""}
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter">
                                    {isSubSite ? t("page.editSubSite") : t("page.editProfile")}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 -mr-1 -mt-1 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                aria-label={t("page.cancel")}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body (scrollable) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-6">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                                        {data.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={32} className="text-white/20" />
                                        )}
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <Loader2
                                                    size={24}
                                                    className="animate-spin"
                                                    style={{ color: accentColor }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        title={t("page.photoLabel")}
                                        className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--surface)] hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                        style={{ backgroundColor: accentColor, color: getContrastColor(accentColor) }}
                                    >
                                        <Camera size={16} />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput((v) => !v)}
                                    className="text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5"
                                >
                                    <Link2 size={11} /> {t("page.photoUrlToggle")}
                                </button>

                                {showUrlInput && (
                                    <input
                                        value={data.avatarUrl}
                                        onChange={(e) => setData((p) => ({ ...p, avatarUrl: e.target.value }))}
                                        placeholder="https://..."
                                        className={`${INPUT} !p-3 text-xs text-white/60 font-mono`}
                                    />
                                )}

                                {uploadError && (
                                    <div className="flex items-start gap-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 w-full">
                                        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                                        <span>{uploadError}</span>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            {/* URL (username / slug) */}
                            <div className="space-y-2">
                                <label className={LABEL}>
                                    {isSubSite ? t("page.subSiteUrl") : t("page.profileUrl")}
                                </label>
                                <div className="flex items-center gap-2 p-4 rounded-2xl bg-black/40 border border-white/10 focus-within:border-[var(--accent)] transition-all font-mono">
                                    <span className="text-xs text-white/20 shrink-0">
                                        huevsite.io/{isSubSite ? `${profileUsername}/` : ""}
                                    </span>
                                    <input
                                        value={data.username}
                                        onChange={(e) =>
                                            setData((p) => ({ ...p, username: e.target.value.toLowerCase() }))
                                        }
                                        className="bg-transparent border-none outline-none text-sm font-black text-[var(--accent)] flex-1 min-w-0 p-0"
                                    />
                                </div>
                            </div>

                            {/* Name */}
                            <div className="space-y-2">
                                <label className={LABEL}>{t("page.name")}</label>
                                <input
                                    value={data.display_name}
                                    onChange={(e) => setData((p) => ({ ...p, display_name: e.target.value }))}
                                    className={`${INPUT} font-black text-white`}
                                />
                            </div>

                            {/* Tagline / Description */}
                            <div className="space-y-2">
                                <label className={LABEL}>
                                    {isSubSite ? t("page.description") : t("page.tagline")}
                                </label>
                                <input
                                    value={data.tagline}
                                    onChange={(e) => setData((p) => ({ ...p, tagline: e.target.value }))}
                                    className={`${INPUT} text-white/60`}
                                />
                            </div>

                            {/* Country (profile only) */}
                            {!isSubSite && (
                                <div className="space-y-2">
                                    <label className={LABEL}>{t("page.countryLabel")}</label>
                                    <CountrySelect
                                        value={data.country}
                                        onChange={(c) => setData((p) => ({ ...p, country: c }))}
                                        placeholder={t("page.countryPlaceholder")}
                                        className={`${INPUT} text-white/60 appearance-none cursor-pointer`}
                                    />
                                </div>
                            )}

                            {/* Email (profile only) */}
                            {!isSubSite && (
                                <div className="space-y-2">
                                    <label className={LABEL}>{t("page.emailLabel")}</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))}
                                        placeholder={t("page.emailPlaceholder")}
                                        className={`${INPUT} text-white/60 font-mono`}
                                    />
                                    <p className="text-[10px] text-white/25 px-1">{t("page.emailHelper")}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer (fixed) */}
                        <div className="shrink-0 flex gap-4 px-8 py-5 border-t border-white/5 bg-black/20">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 text-sm font-bold text-white/30 hover:text-white transition-colors"
                            >
                                {t("page.cancel")}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="flex-[2] py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
                                style={{ backgroundColor: accentColor, color: getContrastColor(accentColor) }}
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : t("page.save")}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
