// Comprobaciones de lib/mobile-order.ts (orden propio de celular).
// Sin test runner: imprime y sale con código != 0 si algo falla.
// Uso: npx tsx scripts/verify-mobile-order.js
const { hasMobileOrder, materializeMobileOrder, nextMobileOrder, sortForMobile } = require('../lib/mobile-order');

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

if (failed) {
  console.error(`\n${failed} comprobación(es) fallaron`);
  process.exit(1);
}
console.log('\nOK');
