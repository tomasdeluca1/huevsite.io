import { cookies } from 'next/headers';

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Reads the active locale from the NEXT_LOCALE cookie. Falls back to the
 * default ('es') when the cookie is missing or holds an unknown value.
 * Server-only (uses next/headers).
 */
export async function getLocale(): Promise<Locale> {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(value ?? '')
    ? (value as Locale)
    : DEFAULT_LOCALE;
}
