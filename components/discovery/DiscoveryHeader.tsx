"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Rocket, Compass, Trophy } from "lucide-react";
import LocaleToggle from "@/components/LocaleToggle";

const TABS = [
  { href: "/feed", key: "navBuildersHunt", icon: Rocket },
  { href: "/explore", key: "navExplore", icon: Compass },
  { href: "/leaderboard", key: "navRanking", icon: Trophy },
] as const;

/**
 * Unified top bar for the discovery family (/feed, /explore, /leaderboard):
 * logo (left) · section tabs (center) · locale + My huevsite (right).
 * Replaces each page's own nav + the old standalone DiscoveryNav.
 * `maxWidthClass` should match the page's content container so the bar and the
 * content share the same left gutter.
 */
// Uniform side gutter for ALL product headers — matches the discovery content
// container so every page's header lines up the same way.
const SHELL = "max-w-[1440px] mx-auto w-full px-6 md:px-10";

export function DiscoveryHeader({
  currentUserId,
  username,
}: {
  currentUserId?: string | null;
  username?: string | null;
}) {
  const t = useTranslations("discovery");
  const tn = useTranslations("nav");
  const pathname = usePathname() || "";

  // Context-aware right CTA: logged-out → build; on dashboard → view profile;
  // elsewhere (logged-in) → dashboard.
  const onDashboard = pathname.startsWith("/dashboard");
  const cta = !currentUserId
    ? { href: "/login", label: tn("buildCta") }
    : onDashboard && username
    ? { href: `/${username}`, label: tn("myProfile") }
    : { href: "/dashboard", label: tn("dashboard") };

  const tabs = (mobile: boolean) => (
    <nav
      className={`items-center rounded-2xl border border-white/10 bg-white/[0.03] p-1 ${
        mobile ? "grid grid-cols-3 w-full gap-1" : "flex gap-1"
      }`}
    >
      {TABS.map(({ href, key, icon: Icon }) => {
        const active = href === "/feed" ? pathname === "/feed" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl py-2 font-black uppercase transition-all ${
              mobile ? "px-2 text-[10px] tracking-wide" : "px-4 text-[11px] tracking-widest"
            } ${active ? "bg-[var(--accent)] text-black" : "text-[var(--text-muted)] hover:text-white"}`}
          >
            <Icon size={14} className="shrink-0" /> <span className="truncate">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="border-b border-[var(--border)]">
      <div className={`${SHELL} flex items-center justify-between gap-4 py-5`}>
        <Link href="/" className="logo text-xl shrink-0">
          huev<span>site</span>.io
        </Link>
        <div className="hidden md:block">{tabs(false)}</div>
        <div className="flex items-center gap-2 shrink-0">
          <LocaleToggle />
          <Link
            href={cta.href}
            className="btn btn-accent !text-[10px] !py-2 !px-4 !rounded-xl"
          >
            {cta.label}
          </Link>
        </div>
      </div>
      {/* Mobile: tabs on their own full-width row */}
      <div className={`md:hidden ${SHELL} pb-3`}>{tabs(true)}</div>
    </header>
  );
}
