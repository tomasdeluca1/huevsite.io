// Comprobaciones de lib/og-meta.ts contra HTML sintético.
// Uso: npx tsx scripts/verify-og-meta.js   (sale con código 1 si algo falla)
const { pickMetaContent, resolveAssetUrl, pickLinkHref, pickTitleTag } = require('../lib/og-meta');

const IMG = 'https://x.com/og.png';
const cases = [
  ['property con comillas dobles', pickMetaContent(`<meta property="og:image" content="${IMG}">`, ['og:image']), IMG],
  ['content primero, property después', pickMetaContent(`<meta content="${IMG}" property="og:image"/>`, ['og:image']), IMG],
  ['name="og:image" en lugar de property', pickMetaContent(`<meta name="og:image" content="${IMG}">`, ['og:image']), IMG],
  ['atributos sin comillas', pickMetaContent(`<meta property=og:image content=${IMG}>`, ['og:image']), IMG],
  ['comillas simples', pickMetaContent(`<meta property='og:image' content='${IMG}'>`, ['og:image']), IMG],
  ['sin og:image cae a twitter:image', pickMetaContent(`<meta name="twitter:image" content="${IMG}">`, ['og:image', 'twitter:image']), IMG],
  ['og:image gana aunque twitter:image aparezca antes', pickMetaContent(`<meta name="twitter:image" content="t.png"><meta property="og:image" content="${IMG}">`, ['og:image', 'twitter:image']), IMG],
  ['ninguna => vacío', pickMetaContent('<meta charset="utf-8"><title>x</title>', ['og:image', 'twitter:image']), ''],
  ['content vacío se saltea', pickMetaContent(`<meta property="og:image" content=""><meta name="twitter:image" content="${IMG}">`, ['og:image', 'twitter:image']), IMG],
  ['">" dentro de content no corta la etiqueta', pickMetaContent('<meta property="og:title" content="a > b">', ['og:title']), 'a > b'],
  ['entidades', pickMetaContent('<meta property="og:title" content="Tom &amp; Jerry &#39;s &lt;3">', ['og:title']), "Tom & Jerry 's <3"],
  ['&amp;lt; no se decodifica dos veces', pickMetaContent('<meta property="og:title" content="&amp;lt;">', ['og:title']), '&lt;'],
  ['link: apple-touch-icon preferido', pickLinkHref('<link rel="icon" href="/f.ico"><link href="/a.png" rel="apple-touch-icon">', ['apple-touch-icon', 'icon']), '/a.png'],
  ['link: rel="shortcut icon"', pickLinkHref('<link rel="shortcut icon" href=/f.ico>', ['apple-touch-icon', 'icon']), '/f.ico'],
  ['title tag', pickTitleTag('<head><title> Hola &amp; chau </title>'), 'Hola & chau'],
  ['resolveAssetUrl relativa contra URL final', resolveAssetUrl('/og.png', 'https://www.x.com/a'), 'https://www.x.com/og.png'],
  ['resolveAssetUrl protocol-relative', resolveAssetUrl('//cdn.x.com/a.png', 'https://x.com'), 'https://cdn.x.com/a.png'],
  ['resolveAssetUrl basura => vacío', resolveAssetUrl('no es una url', 'https://x.com'), ''],
  ['resolveAssetUrl javascript: => vacío', resolveAssetUrl('javascript:alert(1)', 'https://x.com'), ''],
  ['resolveAssetUrl vacío => vacío', resolveAssetUrl('', 'https://x.com'), ''],
];

let failed = 0;
for (const [name, got, want] of cases) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `\n       esperado: ${JSON.stringify(want)}\n       obtenido: ${JSON.stringify(got)}`}`);
}
console.log(failed ? `\n${failed} fallaron` : `\n${cases.length} comprobaciones ok`);
process.exit(failed ? 1 : 0);
