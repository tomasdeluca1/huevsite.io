// Merges every .i18n-extract/*.json fragment into messages/es.json.
//
// Agents wrote keys in mixed styles: some nested ({a:{b:v}}), some flat-dotted
// ({"a.b": v}). next-intl resolves t('a.b') by NESTED traversal, so flat-dotted
// keys must be expanded. We normalize by flattening every fragment to canonical
// dotted paths, then rebuilding a single nested tree. Collisions (same path,
// different value) and leaf/parent conflicts are reported.
const fs = require('fs');
const path = require('path');

const FRAG_DIR = path.join(__dirname, '..', '.i18n-extract');
const OUT = path.join(__dirname, '..', 'messages', 'es.json');

// nested-or-flat object → { 'a.b.c': value }
function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out);
    else out[p] = v;
  }
  return out;
}

const canonical = {}; // dotted path -> value
const collisions = [];
const files = fs.readdirSync(FRAG_DIR).filter((f) => f.endsWith('.json')).sort();
for (const f of files) {
  const frag = JSON.parse(fs.readFileSync(path.join(FRAG_DIR, f), 'utf8'));
  const flat = flatten(frag, '', {});
  for (const [p, v] of Object.entries(flat)) {
    if (p in canonical && canonical[p] !== v) collisions.push({ key: p, a: canonical[p], b: v });
    canonical[p] = v;
  }
  console.log(`merged ${f} → namespaces: ${Object.keys(frag).join(', ')} (${Object.keys(flat).length} leaves)`);
}

// rebuild nested tree from canonical dotted paths
const leafParentConflicts = [];
const tree = {};
for (const [p, v] of Object.entries(canonical)) {
  const parts = p.split('.');
  let node = tree;
  let ok = true;
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    if (node[seg] === undefined) node[seg] = {};
    else if (typeof node[seg] !== 'object') { leafParentConflicts.push(p); ok = false; break; }
    node = node[seg];
  }
  if (!ok) continue;
  const last = parts[parts.length - 1];
  if (node[last] && typeof node[last] === 'object') { leafParentConflicts.push(p); continue; }
  node[last] = v;
}

fs.writeFileSync(OUT, JSON.stringify(tree, null, 2) + '\n');
console.log(`\nwrote ${OUT}`);
console.log(`top-level namespaces: ${Object.keys(tree).sort().join(', ')}`);
console.log(`total leaf paths: ${Object.keys(canonical).length}`);
console.log(collisions.length ? `\n⚠️  ${collisions.length} value collisions:` : '\nno value collisions ✅');
for (const c of collisions.slice(0, 20)) console.log(`  ${c.key}: ${JSON.stringify(c.a)} vs ${JSON.stringify(c.b)}`);
if (leafParentConflicts.length) {
  console.log(`\n⚠️  ${leafParentConflicts.length} leaf/parent conflicts (a key is both a value and a parent):`);
  for (const p of leafParentConflicts.slice(0, 20)) console.log(`  ${p}`);
}
