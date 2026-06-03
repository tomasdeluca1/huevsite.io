"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X, Copy, Check, QrCode, Share2, Mail, MessageCircle,
  Send, Linkedin, Twitter, Download,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Full URL to share. If omitted, falls back to window.location.href. */
  url?: string;
  username: string;
  displayName?: string;
  accentColor?: string;
  /** Custom message for social intents. */
  message?: string;
  /** If true, fire confetti when the modal opens (e.g. just published). */
  celebrate?: boolean;
}

type ShareTarget = {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  className: string;
};

export function ShareProfileModal({
  isOpen,
  onClose,
  url,
  username,
  displayName,
  accentColor = "var(--accent)",
  message,
  celebrate = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => setMounted(true), []);

  // Resolve the share URL on the client so custom domains work automatically.
  const shareUrl = useMemo(() => {
    if (url) return url;
    if (typeof window !== "undefined") return window.location.href;
    return `https://huevsite.io/${username}`;
  }, [url, username]);

  const shareText = useMemo(
    () => message || `Mirá el huevsite de ${displayName || "@" + username} 🚀`,
    [message, displayName, username]
  );

  // Fire confetti on open when celebrating.
  useEffect(() => {
    if (!isOpen || !celebrate) return;
    let cancelled = false;
    import("canvas-confetti")
      .then((mod) => {
        if (cancelled) return;
        const confetti = mod.default;
        confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, disableForReducedMotion: true });
        setTimeout(() => {
          if (!cancelled) confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 }, disableForReducedMotion: true });
        }, 250);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, celebrate]);

  // Lock scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset transient state on close.
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setShowQr(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Fallback for older browsers / insecure contexts.
      const el = document.createElement("textarea");
      el.value = shareUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch { /* noop */ }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({ title: `${displayName || username} en huevsite.io`, text: shareText, url: shareUrl });
    } catch {
      /* user cancelled */
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && !!(navigator as any).share;

  // The modal is the single source of the URL: strip any copy a caller may
  // have embedded in `message`, so platforms that take the URL separately
  // (X, Telegram, LinkedIn) and those that inline it (WhatsApp, email) never
  // end up with the link twice.
  const baseText = shareText.replace(shareUrl, "").replace(/\n{2,}/g, "\n").trim();
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(baseText);
  const encodedTextWithUrl = encodeURIComponent(baseText ? `${baseText}\n${shareUrl}` : shareUrl);

  const targets: ShareTarget[] = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <MessageCircle size={18} />,
      href: `https://wa.me/?text=${encodedTextWithUrl}`,
      className: "hover:border-[#25D366]/50 hover:text-[#25D366]",
    },
    {
      key: "twitter",
      label: "X / Twitter",
      icon: <Twitter size={18} />,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      className: "hover:border-white/40 hover:text-white",
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: <Send size={18} />,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      className: "hover:border-[#2AABEE]/50 hover:text-[#2AABEE]",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: <Linkedin size={18} />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className: "hover:border-[#0A66C2]/60 hover:text-[#4593e0]",
    },
    {
      key: "email",
      label: "Email",
      icon: <Mail size={18} />,
      href: `mailto:?subject=${encodeURIComponent(`${displayName || username} en huevsite.io`)}&body=${encodedTextWithUrl}`,
      className: "hover:border-white/40 hover:text-white",
    },
  ];

  const prettyUrl = shareUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&qzone=1&data=${encodedUrl}`;

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border-bright)] rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
          style={{ ["--accent" as any]: accentColor }}
        >
          {/* Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent)]/10 blur-[60px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />

          <div className="p-7 sm:p-8 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-[var(--surface2)] transition-all text-[var(--text-muted)] hover:text-white"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-black/40 border-2"
              style={{ borderColor: accentColor }}
            >
              <Share2 size={26} style={{ color: accentColor }} />
            </div>

            <div className="section-label mb-2">// compartí tu huevsite</div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-1.5">
              {celebrate ? "¡Tu huevsite está vivo! 🎉" : "Compartí tu perfil"}
            </h3>
            <p className="text-[var(--text-dim)] text-sm leading-relaxed mb-6">
              {celebrate
                ? "Mostrale al mundo lo que estás buildeando. Cada vez que compartís, más gente descubre tu board."
                : "Difundí tu link, sumá visitas y subí en el ranking de builders."}
            </p>

            {/* URL + copy */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 flex items-center gap-2 min-w-0 bg-black/30 border border-[var(--border)] rounded-2xl px-4 py-3">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}80` }}
                />
                <span className="font-mono text-sm text-white/80 truncate">{prettyUrl}</span>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-black transition-all active:scale-95"
                style={{ backgroundColor: accentColor }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar"}</span>
              </button>
            </div>

            {/* Native share (mobile) */}
            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 py-3.5 mb-4 rounded-2xl border border-[var(--border-bright)] text-sm font-bold text-white hover:bg-white/5 transition-all"
              >
                <Share2 size={16} /> Compartir…
              </button>
            )}

            {/* Social targets */}
            <div className="grid grid-cols-5 gap-2 mb-5">
              {targets.map((t) => (
                <a
                  key={t.key}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t.label}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[var(--text-muted)] transition-all active:scale-95 ${t.className}`}
                >
                  {t.icon}
                  <span className="text-[8px] font-black uppercase tracking-wider">{t.label.split(" ")[0]}</span>
                </a>
              ))}
            </div>

            {/* QR toggle */}
            <button
              onClick={() => setShowQr((v) => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white border border-dashed border-[var(--border-bright)] transition-all"
            >
              <QrCode size={15} /> {showQr ? "Ocultar QR" : "Mostrar código QR"}
            </button>

            <AnimatePresence>
              {showQr && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col items-center pt-5">
                    <div className="bg-white p-3 rounded-3xl shadow-lg">
                      {/* QR as progressive enhancement; modal works even if it fails to load */}
                      <img
                        src={qrSrc}
                        alt={`Código QR de ${prettyUrl}`}
                        width={200}
                        height={200}
                        className="w-[200px] h-[200px] rounded-xl"
                        loading="lazy"
                      />
                    </div>
                    <a
                      href={qrSrc}
                      download={`huevsite-${username}-qr.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      <Download size={13} /> Descargar QR
                    </a>
                    <p className="mt-2 text-[10px] text-[var(--text-dim)] text-center max-w-[240px] leading-relaxed">
                      Perfecto para charlas, eventos o tu tarjeta. Lo escanean y caen directo a tu board.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
