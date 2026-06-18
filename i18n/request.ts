import { getRequestConfig } from 'next-intl/server';
import { getLocale } from '@/lib/locale';

/**
 * next-intl request config in cookie / no-routing mode: the active locale comes
 * from the NEXT_LOCALE cookie (not the URL), so the root catch-all /[username]
 * stays untouched. The matching message bundle is loaded per request.
 */
export default getRequestConfig(async () => {
  const locale = await getLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
