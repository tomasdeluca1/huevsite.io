// Stylized laurel branch as an inline SVG data-URI (one side), for the
// "Builder de la Semana" badge. The stem is an ELLIPSE arc — a rounded "(" for
// the left side, ")" for the right — sized to fill the viewBox without clipping
// (ax/ay decouple horizontal vs vertical extent). Leaves are tapered ellipses
// along the arc, splayed outward. Use as the `src` of an <img> inside next/og.
export function laurelDataUri({
  color = "#3D4A6B",
  side = "left",
  width = 110,
  height = 210,
}: {
  color?: string;
  side?: "left" | "right";
  width?: number;
  height?: number;
} = {}): string {
  const w = width;
  const h = height;
  const cy = h / 2;
  const halfSpan = (72 * Math.PI) / 180;
  const ax = (w * 0.74) / (1 - Math.cos(halfSpan));
  const ay = (h * 0.74) / (2 * Math.sin(halfSpan));
  const cxc = side === "left" ? w * 0.12 + ax : w * 0.88 - ax;
  const base = side === "left" ? Math.PI : 0;

  const pt = (t: number) => {
    const th = base + (t - 0.5) * 2 * halfSpan;
    return { x: cxc + ax * Math.cos(th), y: cy + ay * Math.sin(th), th };
  };

  const seg: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const p = pt(i / 24);
    seg.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  const stem = `<path d="M ${seg.join(" L ")}" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  const N = 9;
  const leaves: string[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N;
    const p = pt(t);
    const taper = Math.sin(Math.PI * t); // 0 at tips, 1 in middle
    const rx = 6 + 13 * taper;
    const ry = 3 + 5.2 * taper;
    const out = (Math.atan2(Math.sin(p.th), Math.cos(p.th)) * 180) / Math.PI;
    const leafAng = out + (side === "left" ? -24 : 24); // splay outward, tilt up the branch
    leaves.push(
      `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${leafAng.toFixed(1)})"><ellipse cx="${(rx * 0.8).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${color}"/></g>`
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${stem}${leaves.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
