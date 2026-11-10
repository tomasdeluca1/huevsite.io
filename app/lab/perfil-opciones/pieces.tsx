"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { weekLabel } from "@/lib/launch-week";
import type { ProfileBadge } from "@/lib/profile-types";

export function weekRange(week: string): string {
  const label = weekLabel(week, "es");
  const parts = label.split(" – ");
  const year = week.slice(0, 4);
  if (parts.length === 2) return `${parts[0]} al ${parts[1]} ${year}`;
  return `${label} ${year}`;
}

function soften(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ", ");
}

export function badgeDetail(badge: ProfileBadge, winnerWeek: string | null): string {
  if (badge.key === "builder_of_the_week" && winnerWeek) {
    return `Ganó la semana del ${weekRange(winnerWeek)}.`;
  }
  return soften(badge.description);
}

const ACCENT_KEYS = new Set(["builder_of_the_week", "premium"]);

function IconWell({ badge }: { badge: ProfileBadge }) {
  const accented = ACCENT_KEYS.has(badge.key);
  return (
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] text-[11px] leading-none ${
        accented ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-white/10 text-white/85"
      }`}
      aria-hidden="true"
    >
      {badge.icon}
    </span>
  );
}

export function ElegantBadge({
  badge,
  mode = "pill",
  detail,
  tip = true,
}: {
  badge: ProfileBadge;
  mode?: "icon" | "pill";
  detail?: string;
  tip?: boolean;
}) {
  const accented = ACCENT_KEYS.has(badge.key);
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const text = detail || badge.description;

  function place() {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }

  useEffect(() => {
    if (!pinned) return;
    function onDown(event: PointerEvent) {
      if (ref.current?.contains(event.target as Node)) return;
      setPinned(false);
      setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pinned]);

  const shown = tip && open && pos;

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center rounded-full border bg-white/[0.03] transition-colors hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          accented ? "border-[var(--accent)]/40" : "border-white/10"
        } ${mode === "icon" ? "h-8 w-8 justify-center" : "h-7 gap-1.5 pl-1 pr-2.5"}`}
        aria-label={`${badge.label}. ${text}`}
        onMouseEnter={() => {
          if (!tip) return;
          place();
          setOpen(true);
        }}
        onMouseLeave={() => {
          if (!pinned) setOpen(false);
        }}
        onFocus={() => {
          if (!tip) return;
          place();
          setOpen(true);
        }}
        onBlur={() => {
          if (!pinned) setOpen(false);
        }}
        onClick={() => {
          if (!tip) return;
          place();
          setPinned((value) => {
            const next = !value;
            setOpen(next);
            return next;
          });
        }}
      >
        <IconWell badge={badge} />
        {mode === "pill" && (
          <span className="whitespace-nowrap text-[11px] font-medium tracking-wide text-white/80">
            {badge.shortLabel}
          </span>
        )}
      </button>
      {shown &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[400] w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-[#0E0E0F] px-3 py-2 text-left shadow-2xl"
            style={{ left: pos.x, top: pos.y }}
          >
            <div className="text-[12px] font-bold text-white">{badge.label}</div>
            <p className="mt-0.5 text-[11px] leading-snug text-white/55">{text}</p>
          </div>,
          document.body
        )}
    </>
  );
}

export function BadgeRow({
  badges,
  winnerWeek,
  mode = "pill",
  nowrap = false,
}: {
  badges: ProfileBadge[];
  winnerWeek: string | null;
  mode?: "icon" | "pill";
  nowrap?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${nowrap ? "flex-nowrap" : "flex-wrap"}`}>
      {badges.map((badge) => (
        <ElegantBadge
          key={badge.key}
          badge={badge}
          mode={mode}
          detail={badgeDetail(badge, winnerWeek)}
        />
      ))}
    </div>
  );
}

export function StatsLine({
  followers,
  following,
  nominations,
  score,
}: {
  followers: number;
  following: number;
  nominations: number;
  score: number;
}) {
  const items = [
    { n: followers, label: "seguidores", accent: false },
    { n: following, label: "siguiendo", accent: false },
    { n: nominations, label: "nominaciones", accent: false },
    { n: score, label: "score", accent: true },
  ];
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] leading-none text-white/45">
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-2.5 whitespace-nowrap">
          {index > 0 && <span aria-hidden="true" className="text-white/20">·</span>}
          <span>
            <span className={item.accent ? "font-bold text-[var(--accent)]" : "font-bold text-white"}>
              {item.n}
            </span>{" "}
            {item.label}
          </span>
        </span>
      ))}
    </p>
  );
}

export function BdlsMark({
  week,
  notaHref,
  compact = false,
}: {
  week: string;
  notaHref: string | null;
  compact?: boolean;
}) {
  const href = notaHref || "/builders-de-la-semana";
  const label = notaHref ? "Ver la nota" : "Historial";
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/badge/laurel-dark.png"
        alt=""
        className={compact ? "h-6 w-auto shrink-0" : "h-8 w-auto shrink-0"}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
            Builder de la Semana
          </div>
          <a href={href} className="text-[11px] font-bold text-white/55 transition-colors hover:text-white">
            {label}
          </a>
        </div>
        <div className="truncate font-mono text-[10px] text-white/45">{weekRange(week)}</div>
      </div>
    </div>
  );
}

export function LogrosBody({
  badges,
  winnerWeek,
  notaHref,
  followers,
  following,
  nominations,
  score,
  onClose,
}: {
  badges: ProfileBadge[];
  winnerWeek: string | null;
  notaHref: string | null;
  followers: number;
  following: number;
  nominations: number;
  score: number;
  onClose?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-tight text-white">Logros</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/70 hover:text-white"
            aria-label="Cerrar logros"
          >
            ×
          </button>
        )}
      </div>
      <div className="mt-4">
        <StatsLine followers={followers} following={following} nominations={nominations} score={score} />
      </div>
      {winnerWeek && (
        <div className="mt-4 rounded-xl border border-white/10 px-3 py-2.5">
          <BdlsMark week={winnerWeek} notaHref={notaHref} compact />
        </div>
      )}
      <ul className="mt-4 space-y-2.5">
        {badges.map((badge) => (
          <li key={badge.key} className="flex items-start gap-2.5">
            <ElegantBadge badge={badge} mode="icon" tip={false} />
            <div className="min-w-0 pt-0.5">
              <div className="text-[13px] font-bold text-white">{badge.label}</div>
              <p className="text-[12px] leading-snug text-white/50">{badgeDetail(badge, winnerWeek)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type MountKind = "under-name" | "seal";

function createSlot(kind: MountKind): HTMLElement | null {
  if (kind === "under-name") {
    const hero = document.querySelector(".block-hero");
    const row = hero?.querySelector(":scope > div > .flex.flex-row");
    if (!row) return null;
    const slot = document.createElement("div");
    slot.dataset.labSlot = "under-name";
    slot.className = "mt-3 min-w-0";
    row.insertAdjacentElement("afterend", slot);
    return slot;
  }

  const avatar = document.querySelector(".hero-avatar");
  const host = avatar?.parentElement;
  if (!host) return null;
  const slot = document.createElement("div");
  slot.dataset.labSlot = "seal";
  slot.className = "absolute left-0 top-0 z-30";
  host.appendChild(slot);
  return slot;
}

export function MountIn({
  kind,
  children,
  fallback,
}: {
  kind: MountKind;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [missed, setMissed] = useState(false);

  useLayoutEffect(() => {
    let node: HTMLElement | null = null;
    let cancelled = false;

    const tryMount = () => {
      if (cancelled || node) return true;
      const next = createSlot(kind);
      if (!next) return false;
      node = next;
      setSlot(next);
      return true;
    };

    if (tryMount()) {
      return () => {
        cancelled = true;
        node?.remove();
      };
    }

    const observer = new MutationObserver(() => {
      if (tryMount()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setTimeout(() => {
      observer.disconnect();
      if (!node) setMissed(true);
    }, 1800);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timer);
      node?.remove();
    };
  }, [kind]);

  if (slot) return createPortal(children, slot);
  if (missed && fallback) return <>{fallback}</>;
  return null;
}

export function useCloseOnEscape(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);
}
