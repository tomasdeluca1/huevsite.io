// Static safety net: for every source file that uses next-intl, collect the
// namespaces it binds (useTranslations('x') / getTranslations('x')) and every
// LITERAL t('key') call, then assert the key exists under at least one of the
// file's namespaces in messages/es.json. Template-literal keys (t(`...${x}`))
// are reported separately as un-checkable, not failures.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'es.json'), 'utf8'));

function get(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
}

const files = cp
  .execSync(
    `grep -rlE "useTranslations|getTranslations" app components --include=*.tsx --include=*.ts`,
    { cwd: ROOT, encoding: 'utf8' }
  )
  .trim()
  .split('\n')
  .filter(Boolean);

let missing = [];
let dynamicCount = 0;
let checked = 0;

for (const rel of files) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const namespaces = [
    ...src.matchAll(/(?:useTranslations|getTranslations)\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((m) => m[1]);
  if (!namespaces.length) continue;

  // literal t('key') / t("key") / t.rich('key' / t('key', {
  for (const m of src.matchAll(/\bt(?:\.rich)?\(\s*['"]([^'"]+)['"]/g)) {
    const key = m[1];
    checked++;
    const ok = namespaces.some((ns) => typeof get(es, `${ns}.${key}`) === 'string');
    if (!ok) missing.push({ file: rel, key, namespaces: namespaces.join('|') });
  }
  // template-literal keys: t(`...`)
  for (const _ of src.matchAll(/\bt(?:\.rich)?\(\s*`/g)) dynamicCount++;
}

console.log(`files using next-intl: ${files.length}`);
console.log(`literal t() keys checked: ${checked}`);
console.log(`template-literal (dynamic) t() calls (not statically checkable): ${dynamicCount}`);
if (missing.length) {
  console.log(`\n❌ ${missing.length} literal keys NOT found in es.json:`);
  for (const m of missing) console.log(`  [${m.namespaces}] ${m.key}  (${m.file})`);
  process.exit(1);
} else {
  console.log('\n✅ every literal t() key resolves in es.json');
}
