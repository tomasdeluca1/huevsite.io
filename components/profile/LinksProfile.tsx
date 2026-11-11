"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Globe, Link2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildLinksLayout, type LayoutBlock } from "@/lib/link-layout";
import { avatarFocusStyle } from "@/lib/avatar-focus";
import type { LinkBoxStyle } from "@/lib/profile-layout";
import { getContrastColor } from "@/lib/profile-types";
import { trackClick } from "@/components/analytics/AnalyticsTracker";

interface SubSiteLink {
  id: string;
  slug: string;
  title: string;
}

interface Props {
  blocks: LayoutBlock[];
  globalStyle?: unknown;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  accentColor: string;
  borderRadius?: string;
  userId?: string;
  preview?: boolean;
  showEcosystem?: boolean;
  subSites?: SubSiteLink[];
}

function SocialGlyph({ platform }: { platform: string }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true as const };
  if (platform === "twitter") {
    return (
      <svg {...common}>
        <path d="M14.7 10.3 22.4 1.5h-1.8l-6.7 7.6L8.2 1.5H1.6l8.1 11.5L1.6 22.5h1.8l7.1-8.1 5.7 8.1h6.6l-8.1-12.2Zm-2.5 2.8-.8-1.1L4.2 3h2.8l5.2 7.3.8 1.1 6.8 9.5h-2.8l-5.2-7.8Z" />
      </svg>
    );
  }
  if (platform === "github") {
    return (
      <svg {...common}>
        <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.9 9.6.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.4 9.4 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.3 6.9-5.1 6.9-9.6C22 6.6 17.5 2 12 2Z" />
      </svg>
    );
  }
  if (platform === "linkedin") {
    return (
      <svg {...common}>
        <path d="M4.7 3.3A2.2 2.2 0 1 0 4.7 7.7 2.2 2.2 0 0 0 4.7 3.3ZM3 9h3.4v12H3V9Zm6.2 0H12.5v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.1 2.3 4.1 5.3V21H16.6v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21H9.2V9Z" />
      </svg>
    );
  }
  if (platform === "instagram") {
    return (
      <svg {...common}>
        <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2ZM17.4 6.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" />
        <path d="M12 2.2c2.4 0 2.7 0 3.6.1.9 0 1.5.2 2 .4.6.2 1.1.5 1.6 1 .5.5.8 1 1 1.6.2.5.4 1.1.4 2 .1.9.1 1.2.1 3.6s0 2.7-.1 3.6c0 .9-.2 1.5-.4 2-.2.6-.5 1.1-1 1.6-.5.5-1 .8-1.6 1-.5.2-1.1.4-2 .4-.9.1-1.2.1-3.6.1s-2.7 0-3.6-.1c-.9 0-1.5-.2-2-.4-.6-.2-1.1-.5-1.6-1-.5-.5-.8-1-1-1.6-.2-.5-.4-1.1-.4-2C2.2 14.7 2.2 14.4 2.2 12s0-2.7.1-3.6c0-.9.2-1.5.4-2 .2-.6.5-1.1 1-1.6.5-.5 1-.8 1.6-1 .5-.2 1.1-.4 2-.4.9-.1 1.2-.1 3.6-.1Zm0 1.8c-2.3 0-2.6 0-3.5.1-.8 0-1.2.2-1.5.3-.4.1-.6.3-.9.6-.3.3-.5.5-.6.9-.1.3-.3.7-.3 1.5-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c0 .8.2 1.2.3 1.5.1.4.3.6.6.9.3.3.5.5.9.6.3.1.7.3 1.5.3.9.1 1.2.1 3.5.1s2.6 0 3.5-.1c.8 0 1.2-.2 1.5-.3.4-.1.6-.3.9-.6.3-.3.5-.5.6-.9.1-.3.3-.7.3-1.5.1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c0-.8-.2-1.2-.3-1.5-.1-.4-.3-.6-.6-.9-.3-.3-.5-.5-.9-.6-.3-.1-.7-.3-1.5-.3-.9-.1-1.2-.1-3.5-.1Z" />
      </svg>
    );
  }
  if (platform === "youtube") {
    return (
      <svg {...common}>
        <path d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM9.8 15.5v-6.6l6 3.3-6 3.3Z" />
      </svg>
    );
  }
  if (platform === "tiktok") {
    return (
      <svg {...common}>
        <path d="M14.5 3c.4 2.4 1.8 4.1 4.1 4.4v2.4c-1.4 0-2.7-.4-3.9-1.2v6.5c0 3.4-2.6 5.9-6 5.9S2.7 18.5 2.7 15.1c0-3.3 2.5-5.8 5.8-5.9v2.6c-1.8.1-3.2 1.6-3.2 3.3 0 1.8 1.5 3.3 3.4 3.3s3.3-1.5 3.3-3.4V3h2.5Z" />
      </svg>
    );
  }
  if (platform === "twitch") {
    return (
      <svg {...common}>
        <path d="M4 3 2.5 7.2V20h4.6V22H10l2-2h3.6L21 14.6V3H4Zm15.2 10.8-2.8 2.8h-4.2l-2 2v-2H6.6V4.8h12.6v9Z" />
        <path d="M14.2 7.2h1.6v5.2h-1.6V7.2Zm-4.2 0H11.6v5.2H10V7.2Z" />
      </svg>
    );
  }
  if (platform === "discord") {
    return (
      <svg {...common}>
        <path d="M18.6 5.2A14 14 0 0 0 15.2 4l-.4.7a12.6 12.6 0 0 1 3.2 1.2 13 13 0 0 0-12 0A12 12 0 0 1 9.2 4.7L8.8 4a14 14 0 0 0-3.4 1.2C2.6 8.6 1.9 12 2.1 15.3A14.2 14.2 0 0 0 7 17.6l.8-1.1a9.2 9.2 0 0 1-1.4-.7l.3-.2c2.7 1.2 5.6 1.2 8.3 0l.3.2c-.4.3-.9.5-1.4.7l.8 1.1a14.2 14.2 0 0 0 4.9-2.3c.4-3.8-.6-7.1-2-10.1ZM9.3 13.7c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7Zm5.4 0c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7Z" />
      </svg>
    );
  }
  if (platform === "telegram") return <Send size={20} aria-hidden />;
  if (platform === "farcaster") {
    return (
      <svg {...common}>
        <path d="M6 5h12v2.2h-.6c-.2 2.4-1.2 4.6-2.8 6.2 1.2.4 2.2 1.2 2.8 2.2.4.2.8.8.8 1.4 0 .8-.6 1.4-1.4 1.4h-1.2c-.4 1.2-1.4 2-2.6 2.2V21h-2v-1.4C8.6 19.2 7.6 18.4 7.2 17.2H6c-.8 0-1.4-.6-1.4-1.4 0-.6.4-1.2.8-1.4.6-1 1.6-1.8 2.8-2.2-1.6-1.6-2.6-3.8-2.8-6.2H5.2V5H6Z" />
      </svg>
    );
  }
  return <Globe size={20} aria-hidden />;
}

function HardShell({
  accent,
  radius,
  children,
  className = "",
}: {
  accent: string;
  radius: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-2 border-black text-left ${className}`}
      style={{
        borderRadius: radius,
        boxShadow: "4px 4px 0 #f4f4f5",
        background: accent,
      }}
    >
      {children}
    </div>
  );
}

export function LinksProfile({
  blocks,
  globalStyle = "pill",
  username,
  displayName,
  avatarUrl,
  bio,
  accentColor,
  borderRadius = "1.5rem",
  userId,
  preview = false,
  showEcosystem = false,
  subSites = [],
}: Props) {
  const t = useTranslations("profileLinks");
  const { buttons, socials } = buildLinksLayout(blocks, globalStyle);
  // El encuadre de la foto vive en el hero; la vista links usa el mismo.
  const heroFocus = (blocks.find((b) => b.type === "hero" && b.visible !== false) as { avatarFocus?: unknown } | undefined)?.avatarFocus;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const ink = getContrastColor(accentColor);
  const pillRadius = "999px";

  const onActivate = (blockId: string) => {
    if (preview || !userId) return;
    trackClick(userId, blockId);
  };

  const share = async () => {
    if (preview) return;
    const url = typeof window !== "undefined" ? window.location.href : `https://huevsite.io/${username}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: displayName || username });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  const renderButton = (button: (typeof buttons)[number]) => {
    const style: LinkBoxStyle = button.style;
    const href = button.href;
    const click = () => onActivate(button.blockId);
    const interactive = !preview && !!href;

    if (style === "expandable") {
      const expanded = !!open[button.key];
      return (
        <div key={button.key} className="w-full">
          <HardShell accent={accentColor} radius={pillRadius} className="flex min-h-14 items-stretch overflow-hidden">
            {interactive ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={click}
                className="flex min-h-14 flex-1 items-center justify-center px-4 text-center text-base font-black"
                style={{ color: ink }}
              >
                {button.title}
              </a>
            ) : (
              <span className="flex min-h-14 flex-1 items-center justify-center px-4 text-center text-base font-black" style={{ color: ink }}>
                {button.title}
              </span>
            )}
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={expanded ? t("collapse") : t("expand")}
              onClick={() => setOpen((prev) => ({ ...prev, [button.key]: !expanded }))}
              className="grid min-h-14 w-14 shrink-0 place-items-center border-l-2 border-black"
              style={{ color: ink }}
            >
              <ChevronDown size={18} className={expanded ? "rotate-180" : ""} />
            </button>
          </HardShell>
          {expanded && (
            <p className="px-4 pt-3 text-center text-sm leading-relaxed text-white/75">
              {button.description || t("noDetail")}
            </p>
          )}
        </div>
      );
    }

    if (style === "compact") {
      const inner = (
        <span className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-left">
          <Link2 size={16} className="shrink-0 text-white/50" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{button.title}</span>
        </span>
      );
      return interactive ? (
        <a key={button.key} href={href} target="_blank" rel="noopener noreferrer" onClick={click} className="block w-full">
          {inner}
        </a>
      ) : (
        <div key={button.key} className="w-full">{inner}</div>
      );
    }

    if (style === "card" || style === "featured") {
      const featured = style === "featured";
      const inner = (
        <HardShell accent="#141416" radius={borderRadius} className={`w-full overflow-hidden !bg-[#141416] ${featured ? "min-h-[148px]" : ""}`}>
          {button.imageUrl && (
            <img
              src={button.imageUrl}
              alt=""
              className={`w-full object-cover ${featured ? "h-36" : "h-24"}`}
            />
          )}
          <span className="block px-4 py-3">
            <span className="block text-base font-black text-white">{button.title}</span>
            {button.description && (
              <span className="mt-1 block text-sm leading-snug text-white/65">{button.description}</span>
            )}
          </span>
        </HardShell>
      );
      return interactive ? (
        <a key={button.key} href={href} target="_blank" rel="noopener noreferrer" onClick={click} className="block w-full">
          {inner}
        </a>
      ) : (
        <div key={button.key} className="w-full">{inner}</div>
      );
    }

    const inner = (
      <HardShell accent={accentColor} radius={pillRadius} className="flex min-h-14 w-full items-center gap-3 px-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-black">
          <Link2 size={16} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-center text-base font-black" style={{ color: ink }}>
          {button.title}
        </span>
        <span className="w-9 shrink-0" aria-hidden />
      </HardShell>
    );
    return interactive ? (
      <a key={button.key} href={href} target="_blank" rel="noopener noreferrer" onClick={click} className="block w-full">
        {inner}
      </a>
    ) : (
      <div key={button.key} className="w-full">{inner}</div>
    );
  };

  return (
    <section className="mx-auto w-full max-w-[440px] px-1 pb-8 pt-2 text-center">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={share}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white text-black"
          aria-label={copied ? t("copied") : t("share")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
            <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
          </svg>
        </button>
      </div>

      <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-white/80 bg-white/10">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" style={avatarFocusStyle(heroFocus)} />
        ) : (
          <span className="grid h-full w-full place-items-center text-2xl font-black text-white">
            {(displayName || username || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-black tracking-tight text-white">@{username}</h1>
      {bio && <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed text-white/75">{bio}</p>}

      {socials.length > 0 && (
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {socials.map((social) => {
            const className = "grid h-12 w-12 place-items-center rounded-2xl border-2 border-black bg-[#141416] text-white shadow-[3px_3px_0_#f4f4f5]";
            return (
              <li key={social.key}>
                {preview ? (
                  <span className={className} aria-label={social.label} role="img">
                    <SocialGlyph platform={social.platform} />
                  </span>
                ) : (
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={className}
                    onClick={() => onActivate(social.blockId)}
                  >
                    <SocialGlyph platform={social.platform} />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {buttons.map(renderButton)}
      </div>

      {showEcosystem && subSites.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{t("also")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {subSites.map((site) => (
              <a
                key={site.id}
                href={preview ? undefined : `/${username}/${site.slug}`}
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-3 text-sm font-bold text-white/80"
              >
                {site.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
