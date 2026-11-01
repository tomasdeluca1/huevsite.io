// Comprobaciones de los archivos de marca: el logo y los íconos tienen que
// estar en el verde de la tabla, ser del tamaño que dicen ser, y lo que
// declaran el manifest y el layout tiene que existir y medir eso.
// Sin test runner: imprime y sale con código != 0 si algo falla.
// Uso: npx tsx scripts/verify-brand-assets.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { BRAND } = require('../lib/brand');

let failed = 0;
function eq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    esperado: ${JSON.stringify(expected)}\n    obtenido: ${JSON.stringify(actual)}`}`);
}
const abs = (p) => path.join(__dirname, '..', p);
const hex = (r, g, b) => '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');

/** El verde que más aparece en la imagen, para saber en qué verde está. */
async function verdeDominante(file) {
  if (!fs.existsSync(abs(file))) return 'no existe';
  const { data, info } = await sharp(abs(file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cuenta = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 250 || !(g > b + 40 && g >= r && r > b)) continue;
    const k = hex(r, g, b);
    cuenta.set(k, (cuenta.get(k) || 0) + 1);
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** true si dos hex están a `tol` o menos en cada canal. */
function cerca(a, b, tol) {
  if (typeof a !== 'string' || !a.startsWith('#')) return a;
  const ch = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  return ch(a).every((v, i) => Math.abs(v - ch(b)[i]) <= tol);
}

async function medidas(file) {
  if (!fs.existsSync(abs(file))) return 'no existe';
  const m = await sharp(abs(file)).metadata();
  return [m.width, m.height];
}

/** Color de la esquina: el fondo sobre el que se compuso el ícono. */
async function esquina(file) {
  if (!fs.existsSync(abs(file))) return 'no existe';
  const { data } = await sharp(abs(file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return hex(data[0], data[1], data[2]);
}

(async () => {
  const acento = BRAND.color.accent.toLowerCase();

  eq('el lockup está en el verde de la tabla', await verdeDominante('public/logo-huevsite.png'), acento);
  const lockup = await sharp(abs('public/logo-huevsite.png')).metadata();
  eq('el lockup conserva el alfa (va sobre fondos oscuros)', lockup.hasAlpha, true);

  for (const [file, size] of [['public/icons/icon-192.png', 192], ['public/icons/icon-512.png', 512], ['app/icon.png', 512], ['public/icons/icon-32.png', 32]]) {
    eq(`${file} es cuadrado de ${size}`, await medidas(file), [size, size]);
    eq(`${file} va sobre el negro de marca`, await esquina(file), BRAND.color.bg.toLowerCase());
    // Redimensionar remuestrea: el verde pleno de un ícono chico cae a dos o
    // tres puntos del de la tabla. La tolerancia sigue atrapando el verde
    // viejo del logo (#B5EE0F), que está a diecinueve.
    eq(`${file} está en el verde de la tabla (±6)`, cerca(await verdeDominante(file), acento, 6), true);
  }

  // Lo que se declara tiene que existir y medir eso. El manifest y el layout
  // mentían: declaraban 192x192 y 512x512 sobre archivos de 180x192 y 480x512.
  for (const src of ['app/manifest.ts', 'app/layout.tsx']) {
    const txt = fs.readFileSync(abs(src), 'utf8');
    const pares = [...txt.matchAll(/(?:src|url):\s*["']([^"']+\.(?:png|jpe?g|ico))["'],\s*\n?\s*sizes:\s*["']([^"']+)["']/g)];
    const malas = [];
    for (const [, url, sizes] of pares) {
      const file = url.startsWith('/icons/') || url === '/favicon.ico' ? `public${url}` : `app${url}`;
      if (!fs.existsSync(abs(file))) { malas.push(`${url}: no existe`); continue; }
      if (sizes === 'any' || url.endsWith('.ico')) continue;
      const [w, h] = await medidas(file);
      if (sizes !== `${w}x${h}`) malas.push(`${url}: declara ${sizes}, mide ${w}x${h}`);
    }
    eq(`${src} declara tamaños reales`, malas, []);
    eq(`${src} ya no usa el icon.jpeg viejo`, /icon\.jpeg/.test(txt), false);
  }

  if (failed) {
    console.error(`\n${failed} comprobación(es) fallaron`);
    process.exit(1);
  }
  console.log('\nOK');
})();
