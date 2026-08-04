'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Select, type SelectOption } from '@/components/ui/Select';
import {
  CONTINENTS,
  CONTINENT_LABELS,
  countriesByContinent,
  flagEmoji,
  type Continent,
} from '@/lib/countries';

/**
 * Picker for an ISO-3166-1 alpha-2 country, grouped by continent and sorted by
 * localized name. Used in the profile edit modal and onboarding so builders can
 * set the country that powers the Explore country/continent filter.
 * Empty value = not set.
 *
 * Built on the design-system <Select> rather than a native <select> so the flags
 * and the huevsite surface styling survive across browsers, and so the ~140
 * options stay navigable via the search filter.
 */
export default function CountrySelect({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value?: string | null;
  onChange: (code: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations('shared.countrySelect');

  const options = useMemo<SelectOption[]>(() => {
    const grouped = countriesByContinent(locale);
    const lang = locale === 'en' ? 'en' : 'es';
    return CONTINENTS.flatMap((cont) =>
      grouped[cont].map((c) => ({
        value: c.code,
        label: c.name,
        icon: flagEmoji(c.code),
        group: CONTINENT_LABELS[cont as Continent][lang],
      }))
    );
  }, [locale]);

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? '—'}
      ariaLabel={placeholder}
      searchable
      searchPlaceholder={t('searchPlaceholder')}
      emptyLabel={t('noResults')}
      className={className}
    />
  );
}
