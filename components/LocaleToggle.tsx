'use client';

import { useLocale } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { Globe } from 'lucide-react';
import { setLocale } from '@/lib/locale-actions';
import type { Locale } from '@/lib/locale';

// Defined locally (not imported from lib/locale) so this client component never
// pulls in lib/locale's `next/headers` dependency, which is server-only.
const SWITCHABLE: Locale[] = ['es', 'en'];

/**
 * Compact ES · EN language switch (globe + two letters, active in accent).
 * Clicking writes the NEXT_LOCALE cookie via the setLocale server action, which
 * revalidates the root layout so the whole app re-renders in the chosen
 * language. While the server re-renders (the `pending` window) we add
 * `.lang-switching` to <html> so globals.css softly fades the page — the swap
 * feels like a smooth refresh. The URL never changes.
 */
export default function LocaleToggle({ className = '' }: { className?: string }) {
  const active = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

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
      className={`inline-flex items-center gap-1.5 select-none ${pending ? 'opacity-60' : ''} ${className}`}
    >
      <Globe size={13} className="text-[var(--text-muted)] shrink-0" aria-hidden />
      <div className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold leading-none">
        {SWITCHABLE.map((l, i) => (
          <span key={l} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => choose(l)}
              disabled={pending}
              aria-pressed={active === l}
              className={`uppercase tracking-wide transition-colors duration-200 ${
                active === l
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {l}
            </button>
            {i === 0 && <span className="text-white/20" aria-hidden>/</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
