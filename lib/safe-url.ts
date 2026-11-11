// Guardas de URL para todo lo que llega del usuario y termina en un href o en un redirect.
// React 18 no bloquea `javascript:` en href, así que el filtro tiene que estar acá.

// El navegador ignora tabs y saltos de línea dentro del scheme y los espacios/controles
// del principio, así que se sacan antes de mirar ("java\nscript:" corre igual).
function stripIgnored(value: string): string {
  return value.replace(/[\t\n\r]/g, "").replace(/^[\u0000- ]+/, "");
}

const SCRIPT_SCHEME = /^(javascript|vbscript|livescript):/i;
const NON_LINK_SCHEME = /^(javascript|vbscript|livescript|data|file|blob|filesystem|about):/i;

/** true si el valor ejecuta código al usarse como URL. */
export function isScriptUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const cleaned = stripIgnored(value);
  return SCRIPT_SCHEME.test(cleaned) || /^data:(text\/html|application\/xhtml)/i.test(cleaned);
}

/** Valor seguro para un href. Lo que no es un link navegable vuelve como `fallback`. */
export function safeHref(value: unknown, fallback = "#"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return NON_LINK_SCHEME.test(stripIgnored(trimmed)) ? fallback : trimmed;
}

/**
 * Path interno para volver o redirigir: tiene que empezar con una sola "/" y no puede
 * cambiar de origen. Corta "//evil.com", "/\evil.com", "@evil.com" y "javascript:".
 */
export function safeInternalPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (value.length > 2000) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = "https://huevsite.invalid";
    const parsed = new URL(value, base);
    if (parsed.origin !== base) return fallback;
  } catch {
    return fallback;
  }
  return value;
}

// Claves de texto libre: ahí "JavaScript: The Good Parts" es un título válido y se
// renderiza como texto, nunca como link.
const PROSE_KEYS = new Set([
  "title",
  "description",
  "name",
  "tagline",
  "bio",
  "note",
  "text",
  "content",
  "label",
  "metrics",
  "quote",
  "role",
  "company",
  "subtitle",
  "caption",
  "body",
  "message",
  "headline",
  "summary",
]);

/**
 * Limpia el JSON de un bloque: cualquier string que ejecutaría código como URL queda vacío,
 * salvo en las claves de texto libre. Se usa al guardar y al leer para el perfil público.
 */
export function sanitizeBlockData<T>(value: T, key?: string, depth = 0): T {
  if (depth > 12) return value;
  if (typeof value === "string") {
    if (key && PROSE_KEYS.has(key)) return value;
    return (isScriptUrl(value) ? "" : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? sanitizeBlockData(item, key, depth + 1) : sanitizeBlockData(item, undefined, depth + 1)
    ) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
      out[childKey] = sanitizeBlockData(child, childKey, depth + 1);
    }
    return out as T;
  }
  return value;
}
