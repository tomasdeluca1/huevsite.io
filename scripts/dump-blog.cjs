const fs = require('fs');
const ts = require('typescript');

let src = fs.readFileSync('lib/blog-data.ts', 'utf8');
// Stub the two relative imports so we don't need to resolve the module graph;
// neither affects the post data we extract (slug/title/excerpt/content).
src = src
  .replace(/import \{ calculateReadingTime \} from "\.\/utils";/, 'const calculateReadingTime = () => 0;')
  .replace(/import \{ BLOG_TRANSLATIONS \} from "\.\/blog-translations";/, 'const BLOG_TRANSLATIONS = {};');

const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText;

const mod = { exports: {} };
new Function('module', 'exports', 'require', 'process', js)(mod, mod.exports, require, process);

const posts = mod.exports.BLOG_POSTS.map((p) => ({
  slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content,
}));
fs.writeFileSync('.i18n-extract/blog-source.json', JSON.stringify(posts, null, 2) + '\n');
console.log(posts.length + ' posts dumped');
console.log('total content chars:', posts.reduce((n, p) => n + p.content.length, 0));
