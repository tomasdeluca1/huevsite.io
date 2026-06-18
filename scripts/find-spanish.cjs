// Flags likely-Spanish user-visible strings NOT behind t(): JSX text nodes and
// literal placeholder/title/alt/aria-label attributes containing Spanish
// stopwords. Skips comments, imports, t()/useTranslations lines, and out-of-scope dirs.
const fs = require('fs');
const cp = require('child_process');

const SPANISH = /\b(qué|cómo|cuándo|dónde|está|estás|están|tenés|podés|querés|vos|acá|ahora|hacé|hacés|elegí|escribí|mirá|sumá|dejá|armá|creá|seguí|compartí|tené|poné|cargá|guardá|probá|sos|según|también|gratis|guardar|cerrar|cancelar|eliminar|borrar|buscar|ordenar|seguir|siguiendo|compartir|enviar|volver|siguiente|anterior|para|porque|tu perfil|tus|una|tablero|bloque|bloques|perfil|usuario|contraseña|correo|nombre de usuario|iniciá|ingresá|registrate|cuenta|ajustes|configuración|nuevo|nueva|crear|editar|agregar|añadir|quitar|mostrar|ocultar|cargando|cerrá|abrí|elegir|escribe|escribí|recomendado|descripción|título|ejemplo|aviso|atención)\b/i;

const files = cp.execSync(
  `find app components -name "*.tsx" | grep -vE "app/admin/|components/admin/|app/\\[username\\]|components/profile/|components/emails/|opengraph-image|twitter-image|/api/"`,
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

const hits = [];
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let inBlockComment = false;
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (inBlockComment) { if (trimmed.includes('*/')) inBlockComment = false; return; }
    if (trimmed.startsWith('/*')) { if (!trimmed.includes('*/')) inBlockComment = true; return; }
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    if (/^import\s/.test(trimmed)) return;
    // candidate user-visible literal contexts
    const jsxText = [...line.matchAll(/>\s*([^<>{}][^<>]*?)\s*</g)].map(m => m[1]);
    const attrs = [...line.matchAll(/(?:placeholder|title|alt|aria-label)\s*=\s*"([^"]+)"/g)].map(m => m[1]);
    for (const s of [...jsxText, ...attrs]) {
      if (SPANISH.test(s) && !/^\s*\{/.test(s)) {
        hits.push(`${f}:${i + 1}: ${s.slice(0, 90)}`);
      }
    }
  });
}
console.log(`scanned ${files.length} in-scope files`);
console.log(`flagged ${hits.length} likely-Spanish strings:\n`);
console.log(hits.join('\n'));
