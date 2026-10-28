// Lectura tolerante de <meta> y <link> de un HTML crudo, para autocompletar
// proyectos desde una URL. Reemplaza los pares de regex del endpoint, que
// dependían del orden de los atributos y de las comillas dobles.

const NAMED_ENTITIES: Record<string, string> = {
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

// "&amp;" va resuelto en el mismo paso que el resto, no antes: si no, "&amp;lt;"
// se decodificaba dos veces y terminaba como "<".
export function decodeHtml(s: string): string {
  return s
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, ent: string) => {
      if (ent[0] === "#") {
        const code = ent[1].toLowerCase() === "x" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
        try {
          return Number.isFinite(code) ? String.fromCodePoint(code) : m;
        } catch {
          return m;
        }
      }
      const lower = ent.toLowerCase();
      if (lower === "amp") return "&";
      return NAMED_ENTITIES[lower] ?? m;
    })
    .trim();
}

// Una etiqueta completa respetando las comillas: un ">" dentro de un valor
// entre comillas (p. ej. en un content) no la corta.
const TAG_RE = (name: string) => new RegExp(`<${name}\\b((?:"[^"]*"|'[^']*'|[^'">])*)>`, "gi");

// name=valor con comillas dobles, simples o sin comillas. Sin valor => "".
const ATTR_RE = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/g;

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of Array.from(raw.matchAll(ATTR_RE))) {
    const name = m[1].toLowerCase();
    if (!(name in attrs)) attrs[name] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

function tagsOf(html: string, name: string): Record<string, string>[] {
  return Array.from(html.matchAll(TAG_RE(name)), (m) => parseAttrs(m[1]));
}

/**
 * Devuelve el `content` del primer <meta> cuya property/name/itemprop coincida
 * con alguna de `keys`. `keys` va en orden de preferencia: la primera clave que
 * exista gana, aunque aparezca después en el documento que otra.
 */
export function pickMetaContent(html: string, keys: string[]): string {
  const metas = tagsOf(html, "meta");
  for (const key of keys) {
    const want = key.toLowerCase();
    for (const attrs of metas) {
      // Cada atributo se prueba por separado: <meta name="x" property="og:image"> existe en la práctica.
      const ids = [attrs.property, attrs.name, attrs.itemprop].map((v) => (v ?? "").toLowerCase().trim());
      if (!ids.includes(want)) continue;
      const content = attrs.content ? decodeHtml(attrs.content) : "";
      if (content) return content;
    }
  }
  return "";
}

/**
 * `href` del primer <link> cuyo rel contenga alguna de las palabras en `rels`,
 * respetando el orden de preferencia (p. ej. ["apple-touch-icon", "icon"]).
 */
export function pickLinkHref(html: string, rels: string[]): string {
  const links = tagsOf(html, "link");
  for (const rel of rels) {
    for (const attrs of links) {
      const tokens = (attrs.rel ?? "").toLowerCase().split(/\s+/);
      if (!tokens.some((tok) => tok.includes(rel))) continue;
      const href = attrs.href ? decodeHtml(attrs.href) : "";
      if (href) return href;
    }
  }
  return "";
}

/** Contenido de <title>, como último recurso para el título. */
export function pickTitleTag(html: string): string {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? decodeHtml(m[1]) : "";
}

/**
 * Resuelve una URL de asset (relativa, absoluta o protocol-relative) contra
 * `baseUrl`, que debe ser la URL FINAL tras los redirects. Devuelve "" si no
 * da una URL http(s) válida.
 */
export function resolveAssetUrl(raw: string, baseUrl: string): string {
  const value = (raw || "").trim();
  if (!value || /\s/.test(value)) return "";
  try {
    const u = new URL(value, baseUrl);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}
