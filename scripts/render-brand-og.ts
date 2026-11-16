// Renders the home OG (the same tree as app/opengraph-image.tsx) to a PNG.
// `public/opengraph-image.png` is the static copy: schema and the login /
// linktree cards point at it.
//
//   npx tsx --tsconfig scripts/tsconfig.json scripts/render-brand-og.ts
//   npx tsx --tsconfig scripts/tsconfig.json scripts/render-brand-og.ts /tmp/home-og.png
import { readFileSync, writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { homeOgElement, HOME_OG_FONTS, type OgFont } from "../app/opengraph-image";
import { OG_SIZE } from "../lib/og/shared";

const file = process.argv.slice(2).find((a) => a.endsWith(".png")) ?? "public/opengraph-image.png";

const fonts: OgFont[] = HOME_OG_FONTS.map((f) => {
  const buf = readFileSync(`public/fonts/${f.file}`);
  return {
    name: f.name,
    data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
    weight: f.weight,
    style: "normal",
  };
});

async function main() {
  const res = new ImageResponse(homeOgElement(), { ...OG_SIZE, fonts });
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(file, buf);
  console.log(`${file} ${buf.length}`);
}

main();
