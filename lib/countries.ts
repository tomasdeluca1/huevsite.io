// Country / continent reference for the Explore filter and the profile country
// selector. We store only the ISO-3166-1 alpha-2 code on the profile
// (`profiles.country`); display names come from Intl.DisplayNames (localized
// for free) and flag emojis are derived from the code, so this file only owns
// the code → continent mapping.

export const CONTINENTS = [
  'north-america',
  'south-america',
  'europe',
  'asia',
  'africa',
  'oceania',
] as const;

export type Continent = (typeof CONTINENTS)[number];

// Localized continent labels (the rest of the UI is i18n'd via next-intl, but
// these are tiny and tied to the data, so we keep them here).
export const CONTINENT_LABELS: Record<Continent, { es: string; en: string }> = {
  'north-america': { es: 'Norteamérica', en: 'North America' },
  'south-america': { es: 'Sudamérica', en: 'South America' },
  europe: { es: 'Europa', en: 'Europe' },
  asia: { es: 'Asia', en: 'Asia' },
  africa: { es: 'África', en: 'Africa' },
  oceania: { es: 'Oceanía', en: 'Oceania' },
};

// ISO-3166-1 alpha-2 → continent. Comprehensive enough to cover essentially any
// builder; anything not listed is treated as "unknown" (no continent).
const COUNTRY_CONTINENT: Record<string, Continent> = {
  // North America & Central America & Caribbean
  US: 'north-america', CA: 'north-america', MX: 'north-america', GT: 'north-america',
  CR: 'north-america', PA: 'north-america', DO: 'north-america', CU: 'north-america',
  HN: 'north-america', SV: 'north-america', NI: 'north-america', JM: 'north-america',
  TT: 'north-america', BZ: 'north-america', BS: 'north-america', BB: 'north-america', HT: 'north-america', PR: 'north-america',
  // South America
  AR: 'south-america', BR: 'south-america', CL: 'south-america', CO: 'south-america',
  PE: 'south-america', UY: 'south-america', PY: 'south-america', BO: 'south-america',
  EC: 'south-america', VE: 'south-america', GY: 'south-america', SR: 'south-america',
  // Europe
  GB: 'europe', IE: 'europe', FR: 'europe', DE: 'europe', ES: 'europe', PT: 'europe',
  IT: 'europe', NL: 'europe', BE: 'europe', LU: 'europe', CH: 'europe', AT: 'europe',
  SE: 'europe', NO: 'europe', DK: 'europe', FI: 'europe', IS: 'europe', PL: 'europe',
  CZ: 'europe', SK: 'europe', HU: 'europe', RO: 'europe', BG: 'europe', GR: 'europe',
  HR: 'europe', SI: 'europe', RS: 'europe', UA: 'europe', BY: 'europe', LT: 'europe',
  LV: 'europe', EE: 'europe', RU: 'europe', TR: 'europe', CY: 'europe', MT: 'europe',
  AL: 'europe', BA: 'europe', MK: 'europe', ME: 'europe', MD: 'europe', GE: 'europe', AM: 'europe', AZ: 'europe',
  // Asia
  CN: 'asia', JP: 'asia', KR: 'asia', IN: 'asia', ID: 'asia', PK: 'asia', BD: 'asia',
  VN: 'asia', TH: 'asia', PH: 'asia', MY: 'asia', SG: 'asia', HK: 'asia', TW: 'asia',
  LK: 'asia', NP: 'asia', MM: 'asia', KH: 'asia', LA: 'asia', MN: 'asia', KZ: 'asia',
  UZ: 'asia', IL: 'asia', AE: 'asia', SA: 'asia', QA: 'asia', KW: 'asia', BH: 'asia',
  OM: 'asia', JO: 'asia', LB: 'asia', IQ: 'asia', IR: 'asia', SY: 'asia', YE: 'asia', AF: 'asia',
  // Africa
  ZA: 'africa', NG: 'africa', EG: 'africa', KE: 'africa', GH: 'africa', MA: 'africa',
  TN: 'africa', DZ: 'africa', ET: 'africa', UG: 'africa', TZ: 'africa', RW: 'africa',
  SN: 'africa', CI: 'africa', CM: 'africa', ZW: 'africa', ZM: 'africa', AO: 'africa',
  MZ: 'africa', BW: 'africa', NA: 'africa', LY: 'africa', SD: 'africa', ML: 'africa', MU: 'africa',
  // Oceania
  AU: 'oceania', NZ: 'oceania', FJ: 'oceania', PG: 'oceania', NC: 'oceania', PF: 'oceania',
};

/** All known country codes, sorted by localized display name for the given locale. */
export function countryCodes(): string[] {
  return Object.keys(COUNTRY_CONTINENT);
}

export function continentForCountry(code?: string | null): Continent | null {
  if (!code) return null;
  return COUNTRY_CONTINENT[code.toUpperCase()] ?? null;
}

export function countriesInContinent(continent: string): string[] {
  return Object.entries(COUNTRY_CONTINENT)
    .filter(([, c]) => c === continent)
    .map(([code]) => code);
}

export function isValidCountry(code?: string | null): boolean {
  return !!code && code.toUpperCase() in COUNTRY_CONTINENT;
}

/** Flag emoji from an ISO-3166-1 alpha-2 code (regional indicator symbols). */
export function flagEmoji(code?: string | null): string {
  if (!code || code.length !== 2) return '';
  const A = 0x1f1e6;
  const up = code.toUpperCase();
  return String.fromCodePoint(A + (up.charCodeAt(0) - 65), A + (up.charCodeAt(1) - 65));
}

/** Localized country display name (falls back to the code). */
export function countryName(code: string, locale: string): string {
  try {
    const dn = new Intl.DisplayNames([locale === 'en' ? 'en' : 'es'], { type: 'region' });
    return dn.of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

// Common builder cities → country, for best-effort backfill from free-text
// `location`. Lowercased, accent-stripped keys.
const CITY_COUNTRY: Record<string, string> = {
  'buenos aires': 'AR', caba: 'AR', cordoba: 'AR', rosario: 'AR', mendoza: 'AR', 'la plata': 'AR',
  'mar del plata': 'AR', tucuman: 'AR', salta: 'AR', neuquen: 'AR', bariloche: 'AR', 'san luis': 'AR',
  'santa fe': 'AR', parana: 'AR', corrientes: 'AR', misiones: 'AR',
  'sao paulo': 'BR', 'rio de janeiro': 'BR', florianopolis: 'BR', curitiba: 'BR', 'belo horizonte': 'BR',
  'mexico city': 'MX', cdmx: 'MX', guadalajara: 'MX', monterrey: 'MX',
  santiago: 'CL', bogota: 'CO', medellin: 'CO', lima: 'PE', montevideo: 'UY', quito: 'EC',
  caracas: 'VE', asuncion: 'PY', 'la paz': 'BO',
  'new york': 'US', nyc: 'US', 'san francisco': 'US', 'bay area': 'US', 'silicon valley': 'US',
  'los angeles': 'US', seattle: 'US', austin: 'US', boston: 'US', miami: 'US', chicago: 'US', denver: 'US',
  toronto: 'CA', vancouver: 'CA', montreal: 'CA',
  london: 'GB', manchester: 'GB', madrid: 'ES', barcelona: 'ES', valencia: 'ES',
  paris: 'FR', berlin: 'DE', munich: 'DE', hamburg: 'DE', amsterdam: 'NL', lisbon: 'PT', lisboa: 'PT',
  porto: 'PT', dublin: 'IE', milan: 'IT', milano: 'IT', rome: 'IT', roma: 'IT', stockholm: 'SE',
  warsaw: 'PL', warszawa: 'PL', zurich: 'CH', vienna: 'AT', copenhagen: 'DK', helsinki: 'FI', oslo: 'NO',
  bangalore: 'IN', bengaluru: 'IN', mumbai: 'IN', delhi: 'IN', 'new delhi': 'IN', hyderabad: 'IN',
  pune: 'IN', chennai: 'IN',
  singapore: 'SG', tokyo: 'JP', seoul: 'KR', 'hong kong': 'HK', shanghai: 'CN', beijing: 'CN',
  shenzhen: 'CN', bangkok: 'TH', jakarta: 'ID', manila: 'PH', 'ho chi minh': 'VN', hanoi: 'VN',
  'kuala lumpur': 'MY', dubai: 'AE', 'tel aviv': 'IL', istanbul: 'TR',
  lagos: 'NG', nairobi: 'KE', cairo: 'EG', 'cape town': 'ZA', johannesburg: 'ZA', accra: 'GH',
  casablanca: 'MA', sydney: 'AU', melbourne: 'AU', brisbane: 'AU', auckland: 'NZ',
};

function stripAccents(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// reverse of flagEmoji: two regional-indicator codepoints → ISO code.
function flagToCode(s: string): string | null {
  const cps = Array.from(s).map((ch) => ch.codePointAt(0) || 0);
  for (let i = 0; i < cps.length - 1; i++) {
    const a = cps[i];
    const b = cps[i + 1];
    if (a >= 0x1f1e6 && a <= 0x1f1ff && b >= 0x1f1e6 && b <= 0x1f1ff) {
      return String.fromCharCode(65 + (a - 0x1f1e6)) + String.fromCharCode(65 + (b - 0x1f1e6));
    }
  }
  return null;
}

let NAME_TO_CODE: Record<string, string> | null = null;
function nameToCode(): Record<string, string> {
  if (NAME_TO_CODE) return NAME_TO_CODE;
  const m: Record<string, string> = {};
  for (const code of Object.keys(COUNTRY_CONTINENT)) {
    for (const loc of ['en', 'es']) {
      const n = stripAccents(countryName(code, loc));
      if (n && n !== code.toLowerCase()) m[n] = code;
    }
  }
  NAME_TO_CODE = m;
  return m;
}

/**
 * Best-effort country code from a free-text location ("Buenos Aires", "🇦🇷",
 * "Berlin, Remote"). Returns null when nothing matches (e.g. "Remote"). Used to
 * backfill existing profiles that predate the structured country field.
 */
export function guessCountryFromLocation(location?: string | null): string | null {
  if (!location) return null;
  const flag = flagToCode(location);
  if (flag && isValidCountry(flag)) return flag;
  const norm = stripAccents(location);
  if (!norm) return null;
  const nm = nameToCode();
  if (nm[norm]) return nm[norm];
  for (const [name, code] of Object.entries(nm)) {
    if (name.length >= 4 && norm.includes(name)) return code;
  }
  for (const [city, code] of Object.entries(CITY_COUNTRY)) {
    if (norm.includes(city)) return code;
  }
  return null;
}

/** Country codes grouped by continent, each list sorted by localized name. */
export function countriesByContinent(locale: string): Record<Continent, { code: string; name: string }[]> {
  const out = {} as Record<Continent, { code: string; name: string }[]>;
  for (const cont of CONTINENTS) out[cont] = [];
  for (const code of Object.keys(COUNTRY_CONTINENT)) {
    out[COUNTRY_CONTINENT[code]].push({ code, name: countryName(code, locale) });
  }
  for (const cont of CONTINENTS) out[cont].sort((a, b) => a.name.localeCompare(b.name, locale));
  return out;
}
