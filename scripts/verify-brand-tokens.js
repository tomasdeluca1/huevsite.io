// Comprobaciones de la tabla de marca (lib/brand.ts). El CSS del producto y el
// código tienen que decir lo mismo: el CSS no puede importar TS, así que la
// única forma de que no se separen es este script.
// Sin test runner: imprime y sale con código != 0 si algo falla.
// Uso: npx tsx scripts/verify-brand-tokens.js
const fs = require('fs');
const path = require('path');
const { BRAND } = require('../lib/brand');
const { getContrastColor } = require('../lib/profile-types');

let failed = 0;
function eq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    esperado: ${JSON.stringify(expected)}\n    obtenido: ${JSON.stringify(actual)}`}`);
}

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const css = read('app/globals.css');
const root = (css.match(/^:root\s*\{([\s\S]*?)^\}/m) || [])[1] || '';
const cssVar = (name) => {
  const m = root.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : undefined;
};

// --- el CSS espeja la tabla ---
const ESPEJO = [
  ['bg', 'bg'], ['surface', 'surface'], ['surface2', 'surface2'],
  ['border', 'border'], ['border-bright', 'borderBright'],
  ['accent', 'accent'], ['accent-dim', 'accentDim'], ['accent-mid', 'accentMid'],
  ['slate', 'slate'],
  ['text', 'text'], ['text-strong', 'textStrong'], ['text-dim', 'textDim'], ['text-muted', 'textMuted'],
  ['red', 'red'], ['blue', 'blue'], ['purple', 'purple'], ['orange', 'orange'],
];
for (const [cssName, key] of ESPEJO) {
  eq(`--${cssName} espeja BRAND.color.${key}`, cssVar(cssName), BRAND.color[key]);
}

// --- la escala tipográfica está completa y es la misma ---
for (const step of Object.keys(BRAND.type)) {
  eq(`--fs-${step} espeja BRAND.type.${step}`, cssVar(`fs-${step}`), BRAND.type[step]);
}
eq('el corte del mono existe en la escala', Object.keys(BRAND.type).includes(BRAND.monoMaxStep), true);

// --- cero glow: el token se fue y nadie lo usa ---
eq('--glow ya no se define', /--glow\b/.test(root), false);
eq('nadie usa var(--glow)', /var\(--glow\)/.test(css), false);

// --- la rampa de grises: los perfiles publicados no pueden cambiar de aspecto ---
const lum = (hex) => parseInt(hex.slice(1, 3), 16);
const RAMPA = ['bg', 'surface', 'surface2', 'border', 'borderBright'];
const valores = RAMPA.map((k) => lum(BRAND.color[k]));
eq('la rampa sube parejo (9, 9, 9, 16)', valores.slice(1).map((v, i) => v - valores[i]), [9, 9, 9, 16]);
// Lo que hay hoy en producción. Ningún gris puede moverse más de 3 puntos:
// la marca se oscurece, pero nadie se despierta con su página distinta.
const HOY = { bg: '#080808', surface: '#111111', surface2: '#1a1a1a', border: '#222222', borderBright: '#333333' };
eq('ningún gris se mueve más de 3 puntos',
  RAMPA.filter((k) => Math.abs(lum(BRAND.color[k]) - lum(HOY[k])) > 3), []);

// --- el negro viejo no sobrevive en ningún estilo ---
// Se miran solo archivos de UI: un #080808 dentro de contenido (un post del
// blog, datos de un usuario) sería legítimo y no es asunto de este script.
function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out);
    else if (/\.(tsx|ts|css)$/.test(e.name)) out.push(rel);
  }
  return out;
}
const ui = [...walk('app'), ...walk('components')];
eq('sin #080808 en la UI', ui.filter((f) => /#080808/i.test(read(f))), []);
eq('sin rgba(8, 8, 8, …) en la UI', ui.filter((f) => /rgba\(\s*8\s*,\s*8\s*,\s*8/i.test(read(f))), []);
const manifest = read('app/manifest.ts');
eq('el manifest no tiene el negro a mano', /#000000/.test(manifest), false);
eq('el manifest sale de la tabla', /BRAND\.color\.bg/.test(manifest), true);

// --- el acento del usuario sigue mandando adentro de su perfil ---
for (const page of ['app/[username]/page.tsx', 'app/[username]/[slug]/page.tsx']) {
  eq(`${page} inyecta --accent por usuario`, /--accent:\s*\$\{/.test(read(page)), true);
}

// --- las imágenes OG salen de la misma tabla ---
const ogKit = read('lib/og/shared.tsx');
eq('el kit OG importa BRAND', /from ["']@\/lib\/brand["']/.test(ogKit), true);
eq('el kit OG no tiene hex propios', ogKit.match(/#[0-9a-fA-F]{6}/g) || [], []);
const ogBlog = read('app/blog/[slug]/opengraph-image.tsx');
eq('la OG del blog importa BRAND', /from ["']@\/lib\/brand["']/.test(ogBlog), true);
eq('la OG del blog no repite el acento ni el negro', ogBlog.match(/#(C8FF00|050505|0c0c0c)/gi) || [], []);
// El kit corre en edge y arrastra a brand.ts: tiene que ser solo constantes.
eq('brand.ts no importa nada', /^\s*(import|require)\b/m.test(read('lib/brand.ts')), false);

// --- texto negro sobre el lima: de esto depende cada botón de acento ---
eq('negro sobre el acento', getContrastColor(BRAND.color.accent), '#000000');

if (failed) {
  console.error(`\n${failed} comprobación(es) fallaron`);
  process.exit(1);
}
console.log('\nOK');
