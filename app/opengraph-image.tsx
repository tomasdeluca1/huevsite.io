import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  OgLogo,
  countBuilders,
  fetchActiveBuilderAvatars,
  inlineImages,
} from "@/lib/og/shared";
import { SITE_URL } from "@/lib/site-url";

export const runtime = "edge";
// Dinámica a propósito: las fuentes se piden a SITE_URL, y en el build el sitio
// en producción todavía no tiene las nuevas.
export const dynamic = "force-dynamic";

export const alt = "huevsite.io: los builders de la comunidad y su link in bio";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// La imagen al compartir la home es la comunidad: un muro con las fotos de los
// builders más activos de los últimos 30 días, apagado, y al centro el logo, el
// número de builders y la URL. Todo lo que hay que leer está dentro del cuadrado
// central de 630px, que es lo que muestran WhatsApp y otros lectores en chico.
// La URL de la imagen se versiona por semana en app/page.tsx, así el muro se
// renueva cada lunes en X y LinkedIn. El Builder de la Semana tiene su imagen
// en /builders-de-la-semana.
//
// Copy aprobado por Tomás el 16-nov-2026 (pasó por /biblia, ledger
// 2026-11-16-huevsite-og-home-copy, opción 7; la 3 cuando no hay número).

const C = BRAND.color;

// Safe zone: el texto vive en x 300-900, dentro del cuadrado central (285-915)
// y lejos del recorte de X a 2:1 (15px arriba y abajo). Las fotos del borde
// pueden cortarse: son fondo.
const DISPLAY = "Bricolage";
const MONO = "JetBrainsMono";

// Las mismas fuentes que el producto (Bricolage Grotesque + JetBrains Mono),
// servidas desde public/fonts. Si no cargan, Satori usa su sans de fábrica y la
// imagen sale igual.
export const HOME_OG_FONTS = [
  { name: DISPLAY, file: "Bricolage-400.ttf", weight: 400 },
  { name: DISPLAY, file: "Bricolage-800.ttf", weight: 800 },
  { name: MONO, file: "JetBrainsMono-700.ttf", weight: 700 },
] as const;

export type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: "normal" };

async function loadFonts(): Promise<OgFont[] | undefined> {
  try {
    return await Promise.all(
      HOME_OG_FONTS.map(async (f) => {
        const res = await fetch(`${SITE_URL}/fonts/${f.file}`);
        if (!res.ok) throw new Error(f.file);
        return { name: f.name, data: await res.arrayBuffer(), weight: f.weight, style: "normal" as const };
      })
    );
  } catch {
    return undefined;
  }
}

/* ---------- El muro ---------- */

const TILE = 88;
const GAP = 12;
const COLS = 12;
const ROWS = 7;
const X0 = (1200 - (COLS * TILE + (COLS - 1) * GAP)) / 2;
const Y0 = (630 - (ROWS * TILE + (ROWS - 1) * GAP)) / 2;
// El óvalo negro del centro. Las fotos que quedan abajo no se piden.
const HOLE = { rx: 330, ry: 205 };

type Tile = { x: number; y: number; d: number };

// Las casillas visibles, de la más cercana al centro a la más lejana: la foto
// del builder más activo queda pegada al texto.
export const WALL_TILES: Tile[] = (() => {
  const tiles: Tile[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = X0 + c * (TILE + GAP);
      const y = Y0 + r * (TILE + GAP);
      const dx = (x + TILE / 2 - 600) / HOLE.rx;
      const dy = (y + TILE / 2 - 315) / HOLE.ry;
      const d = dx * dx + dy * dy;
      if (d >= 1) tiles.push({ x, y, d });
    }
  }
  return tiles.sort((a, b) => a.d - b.d);
})();

export type HomeOgData = { count: number | null; avatars: string[] };

export function homeOgElement({ count, avatars }: HomeOgData) {
  const headline =
    count && count > 0 ? (
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ color: C.accent }}>{count} builders</span>
        <span>&nbsp;ya tienen su huevsite.</span>
      </div>
    ) : (
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>Tu portfolio de builder en un link.</div>
    );

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: C.bg, color: C.textStrong, fontFamily: DISPLAY }}>
      {WALL_TILES.map((tile, i) => {
        const src = avatars[i];
        const common = {
          position: "absolute" as const,
          left: tile.x,
          top: tile.y,
          width: TILE,
          height: TILE,
          borderRadius: 999,
        };
        return src ? (
          <img key={i} src={src} width={TILE} height={TILE} style={{ ...common, objectFit: "cover", opacity: 0.6, border: "2px solid rgba(255,255,255,0.08)" }} />
        ) : (
          <div key={i} style={{ ...common, display: "flex", background: C.surface2, border: `1px solid ${C.border}`, opacity: 0.6 }} />
        );
      })}

      {/* El óvalo: negro sólido con un borde difuso que apaga las fotos de alrededor. */}
      <div
        style={{
          position: "absolute",
          left: 600 - HOLE.rx,
          top: 315 - HOLE.ry,
          width: HOLE.rx * 2,
          height: HOLE.ry * 2,
          display: "flex",
          borderRadius: "50%",
          background: C.bg,
          boxShadow: `0 0 60px 30px ${C.bg}`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 300,
          width: 600,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          textAlign: "center",
        }}
      >
        <OgLogo height={40} />
        <div style={{ display: "flex", fontSize: 58, lineHeight: 1.02, fontWeight: 800, letterSpacing: -2.4 }}>{headline}</div>
        <div style={{ display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: 19, color: C.textMuted }}>
          huevsite.io/<span style={{ color: C.textStrong }}>tuusuario</span>
        </div>
      </div>
    </div>
  );
}

export async function fetchHomeOgData(): Promise<HomeOgData> {
  const [count, urls] = await Promise.all([
    countBuilders().catch(() => null),
    // Se piden de más: algunas fotos no cargan y no queremos huecos en el muro.
    fetchActiveBuilderAvatars(Math.ceil(WALL_TILES.length * 1.5), TILE).catch(() => [] as string[]),
  ]);
  const avatars = (await inlineImages(urls).catch(() => [] as string[])).slice(0, WALL_TILES.length);
  return { count, avatars };
}

export default async function Image() {
  const [fonts, data] = await Promise.all([loadFonts(), fetchHomeOgData().catch(() => ({ count: null, avatars: [] }))]);
  try {
    return new ImageResponse(homeOgElement(data), { ...size, ...(fonts ? { fonts } : {}) });
  } catch {
    return new ImageResponse(homeOgElement({ count: data.count, avatars: [] }), { ...size, ...(fonts ? { fonts } : {}) });
  }
}
