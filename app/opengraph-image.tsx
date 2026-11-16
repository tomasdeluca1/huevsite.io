import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { OG_SIZE, OG_CONTENT_TYPE, OgLogo } from "@/lib/og/shared";
import { SITE_URL } from "@/lib/site-url";

export const runtime = "edge";
// Dinámica a propósito: las fuentes se piden a SITE_URL, y en el build el sitio
// en producción todavía no tiene las nuevas.
export const dynamic = "force-dynamic";

export const alt = "huevsite.io: el link que mandás cuando te preguntan en qué andás";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// La imagen al compartir la home habla del producto: el copy a la izquierda y
// un perfil de ejemplo armado con los bloques reales del perfil a la derecha.
// Es estática (no consulta la base), así que nunca queda vieja. Si cambia el
// diseño o el texto, subí el `?v=` de app/page.tsx para que X y LinkedIn la
// vuelvan a pedir. El Builder de la Semana tiene su imagen en
// /builders-de-la-semana.
//
// Copy aprobado por Tomás el 16-nov-2026 (pasó por /biblia, ledger
// 2026-11-16-huevsite-og-home-copy).
const EYEBROW = "link in bio para builders";
const HEADLINE = "El link que mandás cuando te preguntan";
const HEADLINE_ACCENT = "en qué andás.";
const SUB = "Tus proyectos y tu GitHub en un perfil que armás en 3 minutos.";
const CTA = "Armá el tuyo";

const C = BRAND.color;

// Safe zone: nada importante a menos de SAFE_X de los costados ni de SAFE_Y de
// arriba y abajo. X recorta la tarjeta a 2:1 (15px arriba y abajo) y varias
// apps redondean las esquinas; con estos márgenes no se come nada.
const SAFE_X = 72;
const SAFE_Y = 60;
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

/* ---------- El perfil de ejemplo (los bloques de components/blocks) ---------- */

const BLOCK = {
  display: "flex",
  flexDirection: "column" as const,
  background: "rgba(17,17,17,0.85)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 28,
  padding: 22,
};

function BlockLabel({ children, live = false }: { children: string; live?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 10,
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: C.textMuted,
      }}
    >
      {live ? (
        <div style={{ display: "flex", width: 8, height: 8, borderRadius: 999, background: C.accent, boxShadow: `0 0 10px ${C.accent}` }} />
      ) : null}
      {children}
    </div>
  );
}

function Stat({ value, label, color = C.textStrong }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: -0.8, color }}>{value}</div>
      <div style={{ display: "flex", fontSize: 9, letterSpacing: 1.6, textTransform: "uppercase", color: C.textMuted }}>{label}</div>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div style={{ display: "flex", marginTop: "auto", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", width: `${pct}%`, height: 6, borderRadius: 999, background: C.accent }} />
    </div>
  );
}

function SampleProfile() {
  return (
    <div style={{ position: "absolute", right: SAFE_X, top: SAFE_Y, width: 500, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* hero */}
      <div style={{ ...BLOCK, height: 140, flexDirection: "row", alignItems: "center", gap: 20, padding: "24px 28px" }}>
        <div
          style={{
            display: "flex",
            width: 78,
            height: 78,
            borderRadius: 999,
            border: `2px solid ${C.accent}`,
            boxShadow: `0 0 24px rgba(200,255,0,0.35)`,
            background: "linear-gradient(145deg, #2b2b2e, #141416)",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 800,
            color: C.textDim,
          }}
        >
          T
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: -0.9, color: C.textStrong }}>Tu nombre</div>
          <div style={{ display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.accent }}>huevsite.io/tuusuario</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                background: C.accentDim,
                border: `1px solid ${C.accentMid}`,
                color: C.accent,
              }}
            >
              <div style={{ display: "flex", width: 5, height: 5, borderRadius: 999, background: C.accent }} />
              construyendo
            </div>
            <div
              style={{
                display: "flex",
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: C.textMuted,
              }}
            >
              indie hacker
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {/* building now */}
        <div style={{ ...BLOCK, width: 242, height: 354 }}>
          <BlockLabel live>building now</BlockLabel>
          <div style={{ display: "flex", fontSize: 23, fontWeight: 800, letterSpacing: -0.5, color: C.accent, marginBottom: 8 }}>
            SaaS en progreso
          </div>
          <div style={{ display: "flex", fontSize: 14, lineHeight: 1.5, color: C.textDim, marginBottom: 14 }}>
            Lo que estás shippeando esta semana.
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 10,
              padding: "26px 22px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(160deg, #1d2410, #101112 60%)",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", width: "70%", height: 14, borderRadius: 6, background: "rgba(200,255,0,0.35)" }} />
            <div style={{ display: "flex", width: "100%", height: 9, borderRadius: 6, background: "rgba(255,255,255,0.10)" }} />
            <div style={{ display: "flex", width: "85%", height: 9, borderRadius: 6, background: "rgba(255,255,255,0.07)" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Next.js", "Supabase"].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: C.textDim,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 242 }}>
          {/* github */}
          <div style={{ ...BLOCK, height: 156 }}>
            <BlockLabel>github</BlockLabel>
            <div style={{ display: "flex", gap: 20 }}>
              <Stat value="128" label="stars" />
              <Stat value="34" label="repos" color={C.accent} />
              <Stat value="210" label="follows" color={C.blue} />
            </div>
            <Bar pct={68} />
          </div>
          {/* score */}
          <div style={{ ...BLOCK, height: 182 }}>
            <BlockLabel>builder score</BlockLabel>
            <div style={{ display: "flex", fontSize: 50, fontWeight: 800, letterSpacing: -2, color: C.textStrong }}>742</div>
            <Bar pct={74} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function homeOgElement() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: C.bg,
        color: C.textStrong,
        fontFamily: DISPLAY,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1.4px, transparent 1.4px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 700,
          top: -60,
          width: 620,
          height: 620,
          display: "flex",
          backgroundImage: "radial-gradient(circle, rgba(200,255,0,0.10), transparent 65%)",
        }}
      />

      <SampleProfile />

      <div style={{ position: "absolute", left: SAFE_X, top: SAFE_Y, bottom: SAFE_Y, width: 520, display: "flex", flexDirection: "column" }}>
        <OgLogo height={38} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              color: C.accent,
            }}
          >
            <div style={{ display: "flex", width: 8, height: 8, borderRadius: 999, background: C.accent, boxShadow: `0 0 10px ${C.accent}` }} />
            {EYEBROW}
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 52, lineHeight: 1.0, fontWeight: 800, letterSpacing: -2.3 }}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>{HEADLINE}</div>
            <div style={{ display: "flex", color: C.accent }}>{HEADLINE_ACCENT}</div>
          </div>
          <div style={{ display: "flex", fontSize: 23, lineHeight: 1.38, fontWeight: 400, color: C.textDim, maxWidth: 480 }}>{SUB}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              padding: "14px 24px",
              borderRadius: 14,
              background: C.accent,
              color: C.bg,
              fontSize: 19,
              fontWeight: 800,
            }}
          >
            {CTA}
          </div>
          <div style={{ display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: 15, color: C.textMuted }}>
            huevsite.io/<span style={{ color: C.textStrong }}>tuusuario</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Image() {
  const fonts = await loadFonts();
  return new ImageResponse(homeOgElement(), { ...size, ...(fonts ? { fonts } : {}) });
}
