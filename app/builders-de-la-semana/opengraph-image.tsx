import { ImageResponse } from "next/og";
import {
  OG_SIZE, OG_CONTENT_TYPE, ACCENT, TEXT_DIM, TEXT_MUTED,
  OgFrame, Eyebrow, FooterCTA, AvatarCircle, Card, truncate,
  fetchRecentWinners, BrandFallback,
} from "@/lib/og/shared";
import { LAUREL_DATA_URI } from "@/lib/og/laurel-data";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const alt = "Builders de la Semana — el salón de la fama de huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// "2026-W23" -> "Semana 23"
function weekLabel(week: string): string {
  const m = week?.match(/W?0*(\d+)\s*$/);
  return m ? `Semana ${m[1]}` : week || "";
}

function Laurel({ width = 132 }: { width?: number }) {
  // Full brand wreath (inlined data-URI). Keeps the 260×146 source aspect.
  const height = Math.round((width * 146) / 260);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={LAUREL_DATA_URI} width={width} height={height} style={{ width, height, display: "flex" }} alt="" />;
}

export default async function Image() {
  try {
    const winners = (await fetchRecentWinners(4)).slice(0, 4);
    const headline = "El salón de la fama de los builders.";
    const sub = "Cada semana la comunidad nomina y corona al que más shippeó. Estos son los ganadores.";

    const left = (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        <Laurel width={132} />
        <div
          style={{
            fontSize: 58, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-0.045em",
            display: "flex", flexWrap: "wrap", color: "white", maxWidth: 540,
          }}
        >
          {headline}
        </div>
        <div style={{ fontSize: 22, lineHeight: 1.42, color: TEXT_DIM, display: "flex", flexWrap: "wrap", maxWidth: 520, fontWeight: 500 }}>
          {sub}
        </div>
      </div>
    );

    const body = winners.length ? (
      <div style={{ display: "flex", flex: 1, width: "100%", gap: 44, alignItems: "center" }}>
        {left}
        <Card accent={ACCENT} width={440}>
          {winners.map((w) => (
            <div key={w.user.username} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <AvatarCircle url={w.user.image} name={w.user.name || w.user.username} size={56} accent={ACCENT} />
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "white", display: "flex" }}>
                  {truncate(w.user.name || w.user.username, 16)}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: ACCENT, display: "flex" }}>
                  {weekLabel(w.week)}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_MUTED, letterSpacing: "0.08em", display: "flex" }}>
                @{truncate(w.user.username, 12)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    ) : (
      <div style={{ display: "flex", flex: 1, width: "100%", alignItems: "center" }}>{left}</div>
    );

    return new ImageResponse(
      <OgFrame
        eyebrow={<Eyebrow label="Salón de la fama" />}
        footer={<FooterCTA cta="Ver el salón" hint="huevsite.io/builders-de-la-semana" />}
      >
        {body}
      </OgFrame>,
      { ...size }
    );
  } catch {
    return new ImageResponse(
      <BrandFallback label="Builders de la Semana — el salón de la fama de huevsite.io" />,
      { ...size }
    );
  }
}
