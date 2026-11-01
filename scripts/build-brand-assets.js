// Genera los archivos de marca a partir del lockup. No hay vector: todo sale
// de rasterizar public/logo-huevsite.png. Si algún día aparece el SVG, este
// script es el que hay que cambiar, no los PNG.
//
//   - re-colorea el lockup al verde de la tabla conservando el sombreado
//   - recorta el isotipo (el bloque de la izquierda, antes del wordmark)
//   - lo compone centrado sobre el negro de marca en los tamaños que declaran
//     el manifest y el layout
//
// Es idempotente: correrlo dos veces da los mismos archivos. No borra nada.
// Uso: npx tsx scripts/build-brand-assets.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { BRAND } = require('../lib/brand');

const abs = (p) => path.join(__dirname, '..', p);
const LOCKUP = abs('public/logo-huevsite.png');
const [AR, AG, AB] = [1, 3, 5].map((i) => parseInt(BRAND.color.accent.slice(i, i + 2), 16));
const [BR, BG_, BB] = [1, 3, 5].map((i) => parseInt(BRAND.color.bg.slice(i, i + 2), 16));

/**
 * Lleva la familia de verdes del logo al verde de la tabla. Se mapea por
 * luminancia en vez de reemplazar a secas, así el sombreado de las caras del
 * isotipo y el antialias de los bordes se conservan. La referencia es el verde
 * más pleno que haya en el archivo, no un número fijo: por eso correrlo sobre
 * un lockup ya re-coloreado da exactamente el mismo archivo.
 */
async function recolorearLockup() {
  const { data, info } = await sharp(LOCKUP).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const esVerde = (r, g, b, a) => a > 0 && g > b + 40 && g >= r && r > b;
  // La referencia es el verde que MÁS aparece —las caras planas del isotipo y
  // el ".io"—, no el más alto: un solo píxel de borde a 255 alcanzaba para
  // dejar todo el logo un 7% apagado.
  const frecuencia = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a > 250 && esVerde(r, g, b, a)) frecuencia.set(g, (frecuencia.get(g) || 0) + 1);
  }
  const pleno = [...frecuencia.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] || 1;
  let tocados = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (!esVerde(r, g, b, a)) continue;
    const f = Math.min(1, g / pleno);
    data[i] = Math.round(AR * f);
    data[i + 1] = Math.round(AG * f);
    data[i + 2] = Math.round(AB * f);
    tocados++;
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png({ compressionLevel: 9 })
    .toFile(LOCKUP + '.tmp');
  fs.renameSync(LOCKUP + '.tmp', LOCKUP);
  return tocados;
}

/**
 * El isotipo es el primer bloque del lockup. Se lo encuentra por el hueco
 * transparente que lo separa del wordmark, en vez de por un ancho fijo: si
 * cambia el archivo, el corte sigue cayendo donde tiene que caer.
 */
async function recortarIsotipo() {
  const { data, info } = await sharp(LOCKUP).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const columnaVacia = (x) => {
    for (let y = 0; y < info.height; y++) if (data[(y * info.width + x) * info.channels + 3] > 8) return false;
    return true;
  };
  let inicio = 0;
  while (inicio < info.width && columnaVacia(inicio)) inicio++;
  let corte = inicio, hueco = 0;
  for (let x = inicio; x < info.width; x++) {
    hueco = columnaVacia(x) ? hueco + 1 : 0;
    if (hueco >= 10) { corte = x - hueco + 1; break; }
  }
  if (corte <= inicio) throw new Error('no se encontró el hueco entre el isotipo y el wordmark');
  // En dos pasos a propósito: sharp corre `trim` ANTES que `extract` dentro de
  // la misma cadena, así que encadenarlos recorta sobre una imagen ya achicada.
  const bloque = await sharp(LOCKUP)
    .extract({ left: inicio, top: 0, width: corte - inicio, height: info.height })
    .png()
    .toBuffer();
  return sharp(bloque).trim().png().toBuffer();
}

/** El isotipo centrado sobre el negro de marca, con 12% de aire a cada lado. */
async function icono(isotipo, size, destino) {
  const contenido = Math.round(size * 0.76);
  const marca = await sharp(isotipo).resize(contenido, contenido, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: BR, g: BG_, b: BB, alpha: 1 } } })
    .composite([{ input: marca, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(abs(destino));
  console.log(`${destino} ${size}x${size}`);
}

(async () => {
  console.log(`lockup: ${await recolorearLockup()} píxeles verdes llevados a ${BRAND.color.accent}`);
  const isotipo = await recortarIsotipo();
  await icono(isotipo, 512, 'app/icon.png');
  await icono(isotipo, 512, 'public/icons/icon-512.png');
  await icono(isotipo, 192, 'public/icons/icon-192.png');
  await icono(isotipo, 32, 'public/icons/icon-32.png');
})();
