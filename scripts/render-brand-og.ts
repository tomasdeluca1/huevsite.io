// Renders the home OG (the same tree as app/opengraph-image.tsx) to a PNG.
// `public/opengraph-image.png` is the brand-only frame: schema and the login /
// linktree cards point at it, so it must not carry a winner accent.
//
//   npx tsx --tsconfig scripts/tsconfig.json scripts/render-brand-og.ts
//   npx tsx --tsconfig scripts/tsconfig.json scripts/render-brand-og.ts --winner /tmp/home-og-winner.png
import { writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { homeOgElement } from "../app/opengraph-image";
import { OG_SIZE } from "../lib/og/shared";

const args = process.argv.slice(2);
const withWinner = args.includes("--winner");
const file = args.find((a) => a.endsWith(".png")) ?? "public/opengraph-image.png";

const el = homeOgElement(
  withWinner
    ? {
        username: "ada",
        name: "Ada Builder",
        image: null,
        tagline: "Shippeo en público, con métricas reales.",
        accent_color: "#FF2D95",
      }
    : null
);

async function main() {
  const res = new ImageResponse(el, { ...OG_SIZE });
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(file, buf);
  console.log(`${file} ${buf.length}`);
}

main();
