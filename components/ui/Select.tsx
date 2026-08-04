"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  /** Leading glyph rendered before the label (flag emoji, icon char…). */
  icon?: string;
  /** Heading the option is filed under. Adjacent options sharing it render together. */
  group?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | null;
  onChange: (value: string) => void;
  /** Shown on the trigger when nothing is selected. */
  placeholder?: string;
  /** Renders a text filter above the list. Worth it past ~15 options. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Shown inside the panel when the filter matches nothing. */
  emptyLabel?: string;
  /** Classes for the trigger button — layout classes are applied first so these win. */
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

interface PanelRect {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/**
 * Design-system select: a button trigger plus a portalled listbox panel, with
 * optional text filter and full keyboard support. Replaces native <select> so
 * options can carry flags/icons and match the huevsite surface language.
 *
 * The panel is portalled to <body> on purpose — `.huevsite-block` and
 * `.onboard-ui` both set `overflow: hidden`, which would clip an in-flow panel.
 */
export function Select({
  options,
  value,
  onChange,
  placeholder = "—",
  searchable = false,
  searchPlaceholder,
  emptyLabel = "—",
  className = "",
  disabled = false,
  ariaLabel,
}: SelectProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [rect, setRect] = useState<PanelRect | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = useCallback((i: number) => `${baseId}-opt-${i}`, [baseId]);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter(
      (o) => normalize(o.label).includes(q) || o.value.toLowerCase().startsWith(q)
    );
  }, [options, query]);

  // Group only *adjacent* options: the caller controls order, so this keeps the
  // rendered sequence identical to `options` instead of silently re-sorting.
  const groups = useMemo(() => {
    const out: { name?: string; items: { option: SelectOption; index: number }[] }[] = [];
    filtered.forEach((option, index) => {
      const last = out[out.length - 1];
      if (last && last.name === option.group) last.items.push({ option, index });
      else out.push({ name: option.group, items: [{ option, index }] });
    });
    return out;
  }, [filtered]);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 12;
    const spaceBelow = window.innerHeight - r.bottom - gap - viewportPadding;
    const spaceAbove = r.top - gap - viewportPadding;
    const flip = spaceBelow < 220 && spaceAbove > spaceBelow;
    setRect({
      left: r.left,
      width: r.width,
      top: flip ? undefined : r.bottom + gap,
      bottom: flip ? window.innerHeight - r.top + gap : undefined,
      maxHeight: Math.max(160, Math.min(340, flip ? spaceAbove : spaceBelow)),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      if (searchable) searchRef.current?.focus();
      else listRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, searchable]);

  // Keep the active row valid when the filter shrinks the list.
  useEffect(() => {
    setActiveIndex((i) => (i < filtered.length ? i : 0));
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, optionId]);

  const closePanel = useCallback((refocus = true) => {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openPanel = useCallback(() => {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === value);
    setQuery("");
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }, [disabled, options, value]);

  const commit = useCallback(
    (next: string) => {
      onChange(next);
      closePanel();
    },
    [onChange, closePanel]
  );

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(Math.max(filtered.length - 1, 0));
        break;
      case "Enter": {
        e.preventDefault();
        const option = filtered[activeIndex];
        if (option) commit(option.value);
        break;
      }
      case "Escape":
        e.preventDefault();
        closePanel();
        break;
      case "Tab":
        closePanel();
        break;
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (open) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPanel();
    }
  };

  const activeDescendant = filtered.length ? optionId(activeIndex) : undefined;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? closePanel(false) : openPanel())}
        onKeyDown={onTriggerKeyDown}
        className={`flex items-center justify-between gap-3 text-left disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span className={`truncate ${selected ? "" : "text-white/40"}`}>
          {selected ? (
            <>
              {selected.icon ? <span className="mr-2">{selected.icon}</span> : null}
              {selected.label}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && rect && (
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: rect.top !== undefined ? -6 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: rect.top !== undefined ? -4 : 4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  left: rect.left,
                  width: rect.width,
                  top: rect.top,
                  bottom: rect.bottom,
                }}
                className="fixed z-[150] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#09090b]/95 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                {searchable && (
                  <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-3">
                    <Search size={14} aria-hidden="true" className="shrink-0 text-white/30" />
                    <input
                      ref={searchRef}
                      type="text"
                      role="combobox"
                      aria-expanded="true"
                      aria-controls={listboxId}
                      aria-activedescendant={activeDescendant}
                      aria-autocomplete="list"
                      aria-label={searchPlaceholder ?? ariaLabel}
                      value={query}
                      placeholder={searchPlaceholder}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setActiveIndex(0);
                      }}
                      onKeyDown={onListKeyDown}
                      className="w-full bg-transparent text-sm text-white/80 outline-none placeholder:text-white/30"
                    />
                  </div>
                )}

                <div
                  ref={listRef}
                  id={listboxId}
                  role="listbox"
                  tabIndex={searchable ? -1 : 0}
                  aria-label={ariaLabel}
                  aria-activedescendant={searchable ? undefined : activeDescendant}
                  onKeyDown={searchable ? undefined : onListKeyDown}
                  style={{ maxHeight: rect.maxHeight }}
                  className="overflow-y-auto overscroll-contain p-1.5 outline-none"
                >
                  {filtered.length === 0 && (
                    <div className="px-3 py-6 text-center text-xs text-white/40">{emptyLabel}</div>
                  )}

                  {groups.map((group, gi) => (
                    <div key={`${group.name ?? "ungrouped"}-${gi}`}>
                      {group.name && (
                        <div className="px-3 pb-1 pt-3 font-mono text-[9px] font-bold uppercase tracking-widest text-white/35">
                          {group.name}
                        </div>
                      )}
                      {group.items.map(({ option, index }) => {
                        const isActive = index === activeIndex;
                        const isSelected = option.value === value;
                        return (
                          <div
                            key={option.value}
                            id={optionId(index)}
                            role="option"
                            aria-selected={isSelected}
                            onPointerEnter={() => setActiveIndex(index)}
                            onClick={() => commit(option.value)}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                              isActive ? "bg-[var(--accent-dim)] text-white" : "text-white/70"
                            }`}
                          >
                            {option.icon ? (
                              <span aria-hidden="true" className="shrink-0">
                                {option.icon}
                              </span>
                            ) : null}
                            <span className="truncate">{option.label}</span>
                            {isSelected && (
                              <Check
                                size={14}
                                aria-hidden="true"
                                className="ml-auto shrink-0 text-[var(--accent)]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

export default Select;
