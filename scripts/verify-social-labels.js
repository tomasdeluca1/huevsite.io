// Comprobaciones de lib/social-platforms.ts (resolveSquareLabel, resolveFollowUrl,
// compactUrl). Sin test runner: imprime y sale con código != 0 si algo falla.
// Uso: npx tsx scripts/verify-social-labels.js
const sp = require('../lib/social-platforms');
const { SOCIAL_PLATFORMS, resolveSquareLabel, resolveFollowUrl, compactUrl } = sp;

let failed = 0;
function eq(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    esperado: ${JSON.stringify(expected)}\n    obtenido: ${JSON.stringify(actual)}`}`);
}

for (const [key, p] of Object.entries(SOCIAL_PLATFORMS)) {
  const ok = typeof p.short === 'string' && p.short.length >= 1 && p.short.length <= 8;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${key}.short = ${JSON.stringify(p.short)} (1..8 caracteres)`);
}

eq('label propio no gana en el cuadrado', resolveSquareLabel({ platform: 'instagram', url: 'https://instagram.com/t', label: 'Mi newsletter' }), 'INSTA');
eq('twitter -> X', resolveSquareLabel({ platform: 'twitter', url: 'https://x.com/t' }), 'X');
eq('desconocida -> hostname', resolveSquareLabel({ platform: 'tiktok', url: 'https://tiktok.com/@x' }), 'TIKTOK');
const M = { severalWebsites: true };
eq('un solo website -> WEB', resolveSquareLabel({ platform: 'website', url: 'https://www.acme.com' }), 'WEB');
eq('un solo website (ctx false) -> WEB', resolveSquareLabel({ platform: 'website', url: 'https://acme.com' }, { severalWebsites: false }), 'WEB');
eq('varios website con favicon -> WEB', resolveSquareLabel({ platform: 'website', url: 'https://acme.com', favicon: 'https://acme.com/f.ico' }, M), 'WEB');
eq('varios website sin favicon: www.acme.com', resolveSquareLabel({ platform: 'website', url: 'https://www.acme.com' }, M), 'ACME');
eq('varios website sin favicon: 9 caracteres corta en 8', resolveSquareLabel({ platform: 'website', url: 'https://midominio.com' }, M), 'MIDOMINI');
eq('website sin esquema', resolveSquareLabel({ platform: 'website', url: 'acme.io/blog' }, M), 'ACME');
eq('website acme.co.uk', resolveSquareLabel({ platform: 'website', url: 'https://acme.co.uk' }, M), 'ACME');
eq('desconocida sin url usa la plataforma', resolveSquareLabel({ platform: 'mastodon', url: '' }), 'MASTODON');
eq('nunca vacío ni undefined', resolveSquareLabel({ platform: '', url: '' }), 'WEB');

eq('twitter -> intent de seguir', resolveFollowUrl({ platform: 'twitter', url: 'https://x.com/tomas' }), 'https://x.com/intent/follow?screen_name=tomas');
eq('twitter.com con @ y query', resolveFollowUrl({ platform: 'twitter', url: 'https://twitter.com/@tomas?s=20' }), 'https://x.com/intent/follow?screen_name=tomas');
eq('twitter con url rara queda igual', resolveFollowUrl({ platform: 'twitter', url: 'https://x.com/intent/follow?screen_name=a' }), 'https://x.com/intent/follow?screen_name=a');
eq('instagram sin intent', resolveFollowUrl({ platform: 'instagram', url: 'https://instagram.com/t' }), 'https://instagram.com/t');
eq('sin esquema se completa con https', resolveFollowUrl({ platform: 'github', url: 'github.com/t' }), 'https://github.com/t');
eq('nunca app://', /^https?:|^mailto:/.test(resolveFollowUrl({ platform: 'linkedin', url: 'linkedin.com/in/x' })), true);

eq('compactUrl linkedin largo -> host', compactUrl('https://www.linkedin.com/in/santiago-rodriguez-cetran'), 'linkedin.com');
eq('compactUrl github largo -> host', compactUrl('https://github.com/santiagocetran'), 'github.com');
eq('compactUrl corto suma segmento', compactUrl('https://github.com/tomas?tab=x'), 'github.com/tomas');
eq('compactUrl sin path', compactUrl('https://www.acme.com/'), 'acme.com');

if (failed) { console.error(`\n${failed} comprobación(es) fallaron`); process.exit(1); }
console.log('\nOK');
