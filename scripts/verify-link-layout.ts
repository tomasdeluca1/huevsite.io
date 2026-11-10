import assert from "node:assert/strict";
import { applyLinkOrder, buildLinksLayout, isSocialSquare, safeHttpUrl, studioLinkRows } from "../lib/link-layout";
import { parseLinkBoxStyle, parseProfileLayout, resolveBoxStyle } from "../lib/profile-layout";

assert.equal(parseProfileLayout(undefined), "portfolio");
assert.equal(parseProfileLayout("links"), "links");
assert.equal(parseProfileLayout("nope"), "portfolio");
assert.equal(parseLinkBoxStyle("card"), "card");
assert.equal(parseLinkBoxStyle("nope"), "pill");
assert.equal(resolveBoxStyle("featured", "pill"), "featured");
assert.equal(resolveBoxStyle(null, "compact"), "compact");
assert.equal(safeHttpUrl("javascript:alert(1)"), undefined);
assert.equal(safeHttpUrl("https://huevsite.io"), "https://huevsite.io/");

const blocks = [
  { id: "hero", type: "hero", order: 0, visible: true, tagline: "hola" },
  { id: "hidden", type: "project", order: 1, visible: false, title: "Oculto", link: "https://hidden.example" },
  { id: "site", type: "project", order: 2, visible: true, title: "Website", link: "https://alice.dev", boxStyle: "card" },
  { id: "stack", type: "stack", order: 3, visible: true, items: ["TS"] },
  { id: "port", type: "project", order: 4, visible: true, title: "Portfolio", link: "https://alice.dev/work" },
  {
    id: "social",
    type: "social",
    order: 5,
    visible: true,
    links: [
      { platform: "twitter", url: "https://x.com/alice" },
      { platform: "instagram", url: "https://instagram.com/alice" },
      { platform: "website", url: "https://alice.dev/shop", label: "Shop" },
      { platform: "website", url: "javascript:alert(1)", label: "Malo" },
    ],
  },
  { id: "gh", type: "github", order: 6, visible: true, username: "alice" },
  { id: "gh2", type: "github", order: 7, visible: true, username: "alice" },
];

const layout = buildLinksLayout(blocks as never, "pill");
assert.deepEqual(layout.buttons.map((button) => button.title), ["Website", "Portfolio", "Shop"]);
assert.equal(layout.buttons[0].style, "card");
assert.equal(layout.buttons[1].style, "pill");
assert.ok(layout.buttons.every((button) => button.title !== "Oculto"));
assert.ok(layout.buttons.every((button) => button.title !== "Malo"));
assert.deepEqual(layout.socials.map((social) => social.platform), ["twitter", "instagram", "github"]);
assert.equal(isSocialSquare("website", "https://instagram.com/alice"), true);
assert.equal(isSocialSquare("website", "https://alice.dev"), false);

const rows = studioLinkRows(blocks as never);
assert.equal(rows.find((row) => row.blockId === "hidden")?.hidden, true);
assert.ok(rows.some((row) => row.blockId === "stack") === false);

const reordered = applyLinkOrder(
  blocks.map((block) => ({ id: block.id, order: block.order })),
  ["port", "site", "social", "gh", "hidden", "gh2"],
);
const order = Object.fromEntries(reordered.map((block) => [block.id, block.order]));
assert.equal(order.hero, 0);
assert.equal(order.port, 1);
assert.equal(order.site, 2);
assert.equal(order.stack, 3);
assert.equal(order.social, 4);

console.log("link layout ok");
