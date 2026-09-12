import { cookies, headers } from 'next/headers';

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Primer locale soportado del header Accept-Language, respetando los pesos q.
 * Devuelve null si el header no pide ninguno de los que soportamos, para que
 * quien llame decida el default.
 */
export function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if ((LOCALES as readonly string[]).includes(base)) return base as Locale;
  }
  return null;
}

/**
 * Reads the active locale from the NEXT_LOCALE cookie. Without a cookie it
 * honours the visitor's Accept-Language, and only then falls back to 'es'.
 *
 * The Accept-Language step exists for the 2026-09-22 Product Hunt launch:
 * until it was added, every first-time visitor got Spanish regardless of their
 * browser, so a global audience would have landed on a page they couldn't read
 * and had to find the toggle on their own.
 *
 * The cookie always wins, so LocaleToggle keeps working exactly as before.
 * Server-only (uses next/headers).
 */
export async function getLocale(): Promise<Locale> {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  if ((LOCALES as readonly string[]).includes(value ?? '')) {
    return value as Locale;
  }
  return parseAcceptLanguage(headers().get('accept-language')) ?? DEFAULT_LOCALE;
}
