'use client';

import { useLocale } from 'next-intl';
import {
  CONTINENTS,
  CONTINENT_LABELS,
  countriesByContinent,
  flagEmoji,
  type Continent,
} from '@/lib/countries';

/**
 * Native <select> for picking an ISO-3166-1 alpha-2 country, grouped by
 * continent (optgroups) and sorted by localized name. Used in the profile edit
 * modal and onboarding so builders can set the country that powers the Explore
 * country/continent filter. Empty value = not set.
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
  const grouped = countriesByContinent(locale);

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">{placeholder ?? '—'}</option>
      {CONTINENTS.map((cont) => (
        <optgroup key={cont} label={CONTINENT_LABELS[cont as Continent][locale === 'en' ? 'en' : 'es']}>
          {grouped[cont].map((c) => (
            <option key={c.code} value={c.code}>
              {flagEmoji(c.code)} {c.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
