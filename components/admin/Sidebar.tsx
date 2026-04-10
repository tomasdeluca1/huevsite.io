"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Mic,
  MessageSquare,
  Trophy,
  Share2,
  AlertTriangle,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/interviews", label: "Interviews", icon: Mic },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/showcase", label: "Showcase", icon: Trophy },
  { href: "/admin/twitter", label: "Twitter", icon: Share2 },
  { href: "/admin/danger", label: "Danger", icon: AlertTriangle },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Exact match for dashboard, prefix match for everything else
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile toggle button — only visible below md */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white shadow-lg"
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Overlay for mobile drawer */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={-1}
          aria-label="Cerrar menú"
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-[#0a0a0a] border-r border-[var(--border)] transition-transform duration-200 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="shrink-0 px-6 pt-8 pb-6">
          <Link
            href="/"
            className="inline-block text-lg font-black tracking-tighter text-white"
          >
            HUEV<span className="text-[var(--accent)]">SITE</span>.IO
          </Link>
          <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest mt-1.5">
            admin panel
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
            // secciones
          </div>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span className="flex-1">{label}</span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-[var(--border)]">
          <Link
            href="/"
            className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
          >
            <ExternalLink size={11} />
            volver al sitio
          </Link>
        </div>
      </aside>
    </>
  );
}
