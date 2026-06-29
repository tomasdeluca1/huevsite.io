"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Rocket, Compass, Trophy } from "lucide-react";

const TABS = [
  { href: "/feed", key: "navBuildersHunt", icon: Rocket },
  { href: "/explore", key: "navExplore", icon: Compass },
  { href: "/leaderboard", key: "navRanking", icon: Trophy },
] as const;

/** Shared sub-nav across the discovery family (/feed, /explore, /leaderboard). */
export function DiscoveryNav() {
  const t = useTranslations("discovery");
  const pathname = usePathname() || "";

  return (
    <nav className="mb-8 flex justify-center">
      <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        {TABS.map(({ href, key, icon: Icon }) => {
          const active = href === "/feed" ? pathname === "/feed" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                active ? "bg-[var(--accent)] text-black" : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              <Icon size={14} /> {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
