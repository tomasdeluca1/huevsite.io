"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Twitter, Linkedin, Check } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const t = useTranslations("blogUi");
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-[var(--text-muted)] mr-2">{t("shareLabel")}</span>
      
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface2)] text-[var(--text-dim)] hover:text-white border border-[var(--border)] transition-all hover:scale-105"
        aria-label={t("shareOnTwitter")}
      >
        <Twitter className="w-4 h-4" />
      </a>
      
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface2)] text-[var(--text-dim)] hover:text-white border border-[var(--border)] transition-all hover:scale-105"
        aria-label={t("shareOnLinkedin")}
      >
        <Linkedin className="w-4 h-4" />
      </a>
      
      <button
        onClick={handleCopy}
        className={`p-2.5 rounded-full border transition-all hover:scale-105 flex items-center justify-center ${
          copied 
            ? "bg-[var(--accent)]/10 border-[var(--accent)]/50 text-[var(--accent)]" 
            : "bg-[var(--surface)] hover:bg-[var(--surface2)] text-[var(--text-dim)] hover:text-white border-[var(--border)]"
        }`}
        aria-label={t("copyLink")}
        title={t("copyLink")}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
