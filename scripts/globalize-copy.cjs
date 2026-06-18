// One-shot: align copy from LATAM-only to a global builder network, in both
// message bundles, and strip decorative 🇦🇷 flags from copy.
const fs = require('fs');
const set = (o, p, v) => { const a = p.split('.'); let n = o; for (let i = 0; i < a.length - 1; i++) n = n[a[i]]; n[a[a.length - 1]] = v; };
const es = JSON.parse(fs.readFileSync('messages/es.json'));
const en = JSON.parse(fs.readFileSync('messages/en.json'));

const ES = {
  'landing.metaDescription': 'Proyectos, métricas reales y endorsements de otros builders. Que te vean shippeando, no diciendo. Acá vive la red de builders.',
  'meta.rootDescription': 'Proyectos, métricas reales y endorsements de otros builders. Que te vean shippeando, no diciendo. Acá vive la red de builders.',
  'landing.heroSocialDescription': 'El perfil vivo donde los builders se muestran, se rankean y se descubren. Tus proyectos, tu código y tus métricas reales — en una URL que pelea por la portada.',
  'landing.winnerDescCommunity': 'Conocé a los creadores de todo el mundo que están buildeando cosas increíbles hoy mismo.',
  'landing.founderQuoteFallback': '“Soy Tomas. Armé huevsite para que el laburo de los builders <accent>se vea, no se cuente</accent>. Es lo que uso yo todos los días.”',
  'recruiter.titleLine2': 'talento builder.',
  'recruiter.locationPlaceholder': 'ej. Ciudad, Remoto...',
  'leaderboard.metaDescription': 'El ranking de los builders más activos. Subí tu builder score, sumá seguidores y escalá posiciones.',
  'explore.subtitle': 'Mirá los perfiles de los builders más piolas. Buscá inspiración y armá el tuyo en 3 minutos.',
  'showcase.subtitle': 'El builder más nominado de la semana.',
  'pricing.founderFeature4': 'Apoyás a un proyecto indie',
  'legal.terms.metaDescription': 'Términos y condiciones de uso de huevsite.io — la plataforma para builders.',
  'login.metaDescription': 'Red social y portfolio para builders.',
  'shared.scoreInfo.description': 'El <strong>Builder Score</strong> es un sistema que mide tu impacto en la escena tech. No solo premia qué tan completo está tu portfolio, sino tu actividad y cómo ayudás a que otros builders crezcan.',
};
const EN = {
  'landing.metaDescription': 'Projects, real metrics and endorsements from other builders. Let them see you shipping, not just talking. This is where the builder network lives.',
  'meta.rootDescription': 'Projects, real metrics and endorsements from other builders. Let them see you shipping, not just talking. This is where the builder network lives.',
  'landing.heroSocialDescription': 'The living profile where builders show up, get ranked and get discovered. Your projects, your code and your real metrics — on a URL that fights for the front page.',
  'landing.winnerDescCommunity': 'Meet creators from all over the world building incredible things right now.',
  'landing.founderQuoteFallback': '“I’m Tomas. I built huevsite so builders’ work <accent>gets seen, not just talked about</accent>. It’s what I use every day.”',
  'recruiter.titleLine2': 'builder talent.',
  'recruiter.locationPlaceholder': 'e.g. City, Remote...',
  'leaderboard.metaDescription': 'The leaderboard of the most active builders. Raise your builder score, gain followers, and climb the ranks.',
  'explore.subtitle': 'Check out the profiles of the coolest builders. Find inspiration and build yours in 3 minutes.',
  'showcase.subtitle': 'The most nominated builder of the week.',
  'pricing.founderFeature4': 'You back an indie project',
  'legal.terms.metaDescription': 'Terms and conditions of use for huevsite.io — the platform for builders.',
  'login.metaDescription': 'Social network and portfolio for builders.',
  'shared.scoreInfo.description': 'The <strong>Builder Score</strong> is a system that measures your impact on the tech scene. It rewards not just how complete your portfolio is, but your activity and how you help other builders grow.',
};
for (const [k, v] of Object.entries(ES)) set(es, k, v);
for (const [k, v] of Object.entries(EN)) set(en, k, v);

// strip decorative Argentina flags from any remaining copy
const strip = (s) => (typeof s === 'string' ? s.replace(/\s*🇦🇷/g, '') : s);
const walk = (o) => { for (const k of Object.keys(o)) { if (o[k] && typeof o[k] === 'object') walk(o[k]); else o[k] = strip(o[k]); } };
walk(es); walk(en);

fs.writeFileSync('messages/es.json', JSON.stringify(es, null, 2) + '\n');
fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2) + '\n');
console.log('done: LATAM→global copy + flag strip');
