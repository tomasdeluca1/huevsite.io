'use client';

import { useLocale } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { setLocale } from '@/lib/locale-actions';
import type { Locale } from '@/lib/locale';

// Defined locally (not imported from lib/locale) so this client component never
// pulls in lib/locale's `next/headers` dependency, which is server-only.
const SWITCHABLE: Locale[] = ['es', 'en'];

/**
 * ES | EN language switch. Clicking writes the NEXT_LOCALE cookie via the
 * setLocale server action, which revalidates the root layout so the whole app
 * re-renders in the chosen language. The URL never changes.
 *
 * Animation: a sliding accent pill follows the active locale, and while the
 * server re-renders (the `pending` window) we add `.lang-switching` to <html>
 * so globals.css softly dims/blurs the page — the text swap feels like a smooth
 * refresh rather than a hard content jump.
 */
export default function LocaleToggle({ className = '' }: { className?: string }) {
  const active = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  // Drive the global page fade from the transition's pending state.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('lang-switching', pending);
    return () => root.classList.remove('lang-switching');
  }, [pending]);

  const choose = (l: Locale) => {
    if (l === active || pending) return;
    startTransition(() => {
      setLocale(l);
    });
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className={`relative inline-grid grid-cols-2 items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-[11px] font-mono leading-none ${
        pending ? 'opacity-70' : ''
      } ${className}`}
    >
      {/* Sliding pill behind the active option */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent-dim)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: active === 'en' ? 'translateX(100%)' : 'translateX(0)' }}
      />
      {SWITCHABLE.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          disabled={pending}
          aria-pressed={active === l}
          className={`relative z-10 rounded-full px-2.5 py-1 text-center uppercase tracking-wide transition-colors duration-200 ${
            active === l ? 'font-bold text-black' : 'text-current/60 hover:text-current'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
