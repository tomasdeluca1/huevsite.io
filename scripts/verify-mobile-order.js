// Comprobaciones de lib/mobile-order.ts (orden propio de celular).
// Sin test runner: imprime y sale con código != 0 si algo falla.
// Uso: npx tsx scripts/verify-mobile-order.js
const { parseBlockViewFields, parseReorderBody, hasMobileOrder, materializeMobileOrder, nextMobileOrder, sortForMobile } = require('../lib/mobile-order');

let failed = 0;
function eq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    esperado: ${JSON.stringify(expected)}\n    obtenido: ${JSON.stringify(actual)}`}`);
}
const b = (id, order, mobileOrder = null) => ({ id, order, mobileOrder });

const allNull = [b('a', 0), b('b', 1), b('c', 2)];
eq('hasMobileOrder([todos NULL]) === false', hasMobileOrder(allNull), false);
eq('hasMobileOrder([uno con valor]) === true', hasMobileOrder([b('a', 0), b('b', 1, 0)]), true);
eq('hasMobileOrder([]) === false', hasMobileOrder([]), false);

eq('materialize(3 en NULL) -> los TRES con 0,1,2',
  materializeMobileOrder(allNull),
  [{ id: 'a', mobile_order: 0 }, { id: 'b', mobile_order: 1 }, { id: 'c', mobile_order: 2 }]);
eq('materialize respeta `order` aunque el array llegue desordenado',
  materializeMobileOrder([b('c', 2), b('a', 0), b('b', 1)]),
  [{ id: 'a', mobile_order: 0 }, { id: 'b', mobile_order: 1 }, { id: 'c', mobile_order: 2 }]);

eq('nextMobileOrder([todos NULL]) === null', nextMobileOrder(allNull), null);
eq('nextMobileOrder([]) === null', nextMobileOrder([]), null);
eq('nextMobileOrder([0,1,2]) === 3 (al final)', nextMobileOrder([b('a', 0, 0), b('b', 1, 1), b('c', 2, 2)]), 3);
eq('nextMobileOrder([mixto 0,NULL,4]) === 5', nextMobileOrder([b('a', 0, 0), b('b', 1), b('c', 2, 4)]), 5);

eq('sortForMobile(todos NULL) = orden de escritorio',
  sortForMobile([b('c', 2), b('a', 0), b('b', 1)]).map(x => x.id), ['a', 'b', 'c']);
eq('sortForMobile(mixto: uno con 1, otro NULL) -> NULL ULTIMO',
  sortForMobile([b('n', 0), b('m', 1, 1)]).map(x => x.id), ['m', 'n']);
eq('sortForMobile(empate mobile_order 2) -> desempata por order',
  sortForMobile([b('z', 5, 2), b('y', 3, 2), b('x', 9, 0)]).map(x => x.id), ['x', 'y', 'z']);
eq('sortForMobile(empate total) es estable',
  sortForMobile([b('p', 1, 2), b('q', 1, 2)]).map(x => x.id), ['p', 'q']);
const input = [b('b', 1, 1), b('a', 0, 0)];
sortForMobile(input);
eq('sortForMobile no muta la entrada', input.map(x => x.id), ['b', 'a']);

// --- parseReorderBody (cuerpo de POST /api/blocks/reorder) ---
const P = parseReorderBody;
eq('reorder: array pelado escribe SOLO order',
  P([{ id: 'a', order: 0 }, { id: 'b', order: 1 }]),
  { ok: true, view: 'desktop', updates: [{ id: 'a', patch: { order: 0 } }, { id: 'b', patch: { order: 1 } }] });
eq('reorder: array pelado ignora un mobile_order colado',
  P([{ id: 'a', order: 3, mobile_order: 9 }]).updates, [{ id: 'a', patch: { order: 3 } }]);
eq('reorder: {view:desktop} escribe order',
  P({ view: 'desktop', blocks: [{ id: 'a', order: 2 }] }).updates, [{ id: 'a', patch: { order: 2 } }]);
eq('reorder: {blocks} sin view = escritorio',
  P({ blocks: [{ id: 'a', order: 2 }] }).view, 'desktop');
eq('reorder: mobile escribe SOLO mobile_order',
  P({ view: 'mobile', blocks: [{ id: 'a', mobile_order: 1 }, { id: 'b', mobile_order: 0 }] }).updates,
  [{ id: 'a', patch: { mobile_order: 1 } }, { id: 'b', patch: { mobile_order: 0 } }]);
eq('reorder: mobile acepta order como valor',
  P({ view: 'mobile', blocks: [{ id: 'a', order: 4 }] }).updates, [{ id: 'a', patch: { mobile_order: 4 } }]);
eq('reorder: mobile acepta null (reset)',
  P({ view: 'mobile', blocks: [{ id: 'a', mobile_order: null }] }).updates, [{ id: 'a', patch: { mobile_order: null } }]);
eq('reorder: desktop rechaza null', P([{ id: 'a', order: null }]).ok, false);
const bad = [
  ['null', null], ['string', 'x'], ['número', 3], ['array vacío', []], ['objeto sin blocks', {}],
  ['blocks vacío', { view: 'mobile', blocks: [] }], ['view desconocida', { view: 'tablet', blocks: [{ id: 'a', order: 0 }] }],
  ['sin id', [{ order: 0 }]], ['id numérico', [{ id: 1, order: 0 }]], ['item null', [null]],
  ['order string', [{ id: 'a', order: '1' }]], ['order decimal', [{ id: 'a', order: 1.5 }]],
  ['mobile sin valor', { view: 'mobile', blocks: [{ id: 'a' }] }],
  ['mobile string', { view: 'mobile', blocks: [{ id: 'a', mobile_order: 'x' }] }],
  ['uno malo entre buenos (sin escritura parcial)', { view: 'mobile', blocks: [{ id: 'a', mobile_order: 0 }, { id: 'b', mobile_order: 'x' }] }],
];
for (const [n, body] of bad) eq(`reorder: inválido rechazado (${n})`, P(body).ok, false);

// parseBlockViewFields: la compuerta Pro y la escritura usan SOLO lo que devuelve.
const V = parseBlockViewFields;
eq('view: body sin campos => ok, fields vacío', V({ visible: false }), { ok: true, fields: {} });
eq('view: solo snake', V({ visible_on: 'desktop' }), { ok: true, fields: { visible_on: 'desktop' } });
eq('view: solo camel se normaliza a snake', V({ visibleOn: 'mobile' }), { ok: true, fields: { visible_on: 'mobile' } });
eq('view: both válido', V({ visible_on: 'both' }), { ok: true, fields: { visible_on: 'both' } });
eq('view: las dos grafías (both primero, desktop después) => rechazo', V({ visible_on: 'both', visibleOn: 'desktop' }).ok, false);
eq('view: las dos grafías (orden inverso) => rechazo', V({ visibleOn: 'desktop', visible_on: 'both' }).ok, false);
eq('view: las dos grafías iguales => rechazo', V({ visible_on: 'desktop', visibleOn: 'desktop' }).ok, false);
eq('view: snake inválido', V({ visible_on: 'basura' }).ok, false);
eq('view: camel inválido', V({ visibleOn: 'basura' }).ok, false);
eq('view: visible_on no string', V({ visible_on: 1 }).ok, false);
eq('view: visible_on null', V({ visible_on: null }).ok, false);
eq('view: both válido + camel basura => rechazo', V({ visible_on: 'both', visibleOn: 'basura' }).ok, false);
eq('view: mobile_order entero', V({ mobile_order: 3 }), { ok: true, fields: { mobile_order: 3 } });
eq('view: mobile_order 0', V({ mobile_order: 0 }), { ok: true, fields: { mobile_order: 0 } });
eq('view: mobileOrder camel entero', V({ mobileOrder: 2 }), { ok: true, fields: { mobile_order: 2 } });
eq('view: mobile_order null (reset)', V({ mobile_order: null }), { ok: true, fields: { mobile_order: null } });
eq('view: mobile_order basura', V({ mobile_order: 'x' }).ok, false);
eq('view: mobile_order decimal', V({ mobile_order: 1.5 }).ok, false);
eq('view: mobile_order negativo', V({ mobile_order: -1 }).ok, false);
eq('view: mobileOrder basura', V({ mobileOrder: 'x' }).ok, false);
eq('view: mobile_order + mobileOrder juntas, la 2da basura => rechazo', V({ mobile_order: 1, mobileOrder: 'x' }).ok, false);
eq('view: ambos campos válidos juntos', V({ visible_on: 'mobile', mobile_order: 1 }), { ok: true, fields: { visible_on: 'mobile', mobile_order: 1 } });
eq('view: body null / array / string => sin campos', [V(null), V([]), V('x')], [{ ok: true, fields: {} }, { ok: true, fields: {} }, { ok: true, fields: {} }]);

if (failed) {
  console.error(`\n${failed} comprobación(es) fallaron`);
  process.exit(1);
}
console.log('\nOK');
