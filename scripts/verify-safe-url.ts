// Guardas de URL: lo que llega del usuario y termina en un href o en un redirect.
// Uso: npx tsx scripts/verify-safe-url.ts
import { isScriptUrl, safeHref, safeInternalPath, sanitizeBlockData } from "../lib/safe-url";
import { withHuevsiteUtm } from "../lib/utm";

let failed = 0;
function ok(name: string, condition: boolean, detail?: string) {
  if (!condition) failed++;
  console.log(`${condition ? "✓" : "✗"} ${name}${!condition && detail ? `\n    ${detail}` : ""}`);
}

const SCRIPTS = [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "  javascript:alert(1)",
  "java\nscript:alert(1)",
  "java\tscript:alert(1)",
  "\u0001javascript:alert(1)",
  "vbscript:msgbox(1)",
  "data:text/html,<script>alert(1)</script>",
  "data:text/html;base64,PHNjcmlwdD4=",
];
ok("los scheme que ejecutan código se detectan", SCRIPTS.every(isScriptUrl), SCRIPTS.filter((item) => !isScriptUrl(item)).join(" | "));
ok("en un href quedan en #", SCRIPTS.every((item) => safeHref(item) === "#"));
ok(
  "los links normales no se tocan",
  ["https://huevsite.io", "http://localhost:3000/x", "mailto:hola@huevsite.io", "tel:+5491100000000", "/feed", "#top", "huevsite.io/tomi"].every((item) => safeHref(item) === item)
);
ok("data, file y blob no son links", ["data:image/png;base64,AAAA", "file:///etc/passwd", "blob:https://x/y"].every((item) => safeHref(item) === "#"));
ok("vacío o no string cae al fallback", safeHref("") === "#" && safeHref(null) === "#" && safeHref(undefined, "/x") === "/x" && safeHref(42) === "#");
ok("una imagen en data: no se confunde con script", !isScriptUrl("data:image/png;base64,AAAA") && !isScriptUrl("JavaScript es mi lenguaje"));

const FALLBACK = "/dashboard";
const OUTSIDE = [
  "javascript:alert(1)",
  "//evil.example",
  "/\\evil.example",
  "https://evil.example",
  "@evil.example",
  ".evil.example",
  "evil.example",
  "/\t/evil.example",
  "/x\nSet-Cookie: a=b",
  "",
  "/" + "a".repeat(2100),
];
ok("un destino que sale del sitio cae al fallback", OUTSIDE.every((item) => safeInternalPath(item, FALLBACK) === FALLBACK), OUTSIDE.filter((item) => safeInternalPath(item, FALLBACK) !== FALLBACK).join(" | "));
ok("null y arrays caen al fallback", safeInternalPath(null, FALLBACK) === FALLBACK && safeInternalPath(["/a"], FALLBACK) === FALLBACK);
const INSIDE = ["/feed", "/dashboard?tab=insights", "/onboarding?ref=tomi", "/onboarding?claim=abc", "/oauth/authorize?client_id=https%3A%2F%2Fclaude.ai%2Fx&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb&state=a%2Fb"];
ok("los paths internos pasan tal cual", INSIDE.every((item) => safeInternalPath(item, FALLBACK) === item));

const dirty = {
  title: "JavaScript: The Good Parts",
  description: "javascript: lo que aprendí",
  link: "javascript:alert(document.cookie)",
  fileUrl: " JAVASCRIPT:alert(1)",
  imageUrl: "data:image/png;base64,AAAA",
  url: "https://huevsite.io",
  links: [{ label: "javascript: tips", url: "java\nscript:alert(1)" }, { label: "ok", url: "https://x.com/huevsite" }],
  stack: ["javascript:alert(1)", "TypeScript"],
  stats: { stars: 12, nested: { href: "vbscript:x" } },
  visible: true,
  empty: null,
};
const clean = sanitizeBlockData(dirty);
ok(
  "los links con script se vacían en cualquier nivel",
  clean.link === "" && clean.fileUrl === "" && clean.links[0].url === "" && clean.stack[0] === "" && clean.stats.nested.href === ""
);
ok(
  "el texto y los datos válidos quedan igual",
  clean.title === dirty.title && clean.description === dirty.description && clean.links[0].label === "javascript: tips" && clean.imageUrl === dirty.imageUrl && clean.url === dirty.url && clean.links[1].url === "https://x.com/huevsite" && clean.stack[1] === "TypeScript" && clean.stats.stars === 12 && clean.visible === true && clean.empty === null
);
ok("no modifica el objeto original", dirty.link.startsWith("javascript:"));

ok("el link de un proyecto con script no llega al href", withHuevsiteUtm("javascript:alert(1)", "profile") === "#", withHuevsiteUtm("javascript:alert(1)", "profile"));
ok("el link de un proyecto normal lleva utm", withHuevsiteUtm("https://example.com", "profile").startsWith("https://example.com/?utm_source="), withHuevsiteUtm("https://example.com", "profile"));

if (failed) {
  console.error(`\n${failed} checks fallaron`);
  process.exit(1);
}
console.log("\nsafe-url ok");
