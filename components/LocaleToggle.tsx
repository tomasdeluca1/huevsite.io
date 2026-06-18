'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { setLocale } from '@/lib/locale-actions';
import type { Locale } from '@/lib/locale';

/**
 * ES | EN language switch. Clicking writes the NEXT_LOCALE cookie via the
 * setLocale server action, which revalidates the root layout so the whole app
 * re-renders in the chosen language. The URL never changes.
 */
export default function LocaleToggle({ className = '' }: { className?: string }) {
  const active = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  const choose = (l: Locale) => {
    if (l === active || pending) return;
    startTransition(() => {
      setLocale(l);
    });
  };

  return (
    <div
      className={`inline-flex items-center gap-0.5 text-xs font-mono ${className}`}
      aria-label="Language"
    >
      {(['es', 'en'] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          disabled={pending}
          aria-pressed={active === l}
          className={`px-1.5 py-0.5 rounded uppercase transition-colors ${
            active === l
              ? 'text-black bg-[var(--accent)]'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
