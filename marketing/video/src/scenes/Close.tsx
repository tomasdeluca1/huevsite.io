import { AbsoluteFill, Img, staticFile } from "remotion";
import { ACCENT, BG, DISPLAY, MONO, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import { useRise } from "../motion";
import { Chrome, Logo } from "../components/Type";
import type { Layout } from "../timing";

export function Close({ layout }: { layout: Layout }) {
  const vertical = layout === "vertical";
  const laurels = useRise(4, 10);
  const title = useRise(10, 22);
  const sub = useRise(20, 16);
  const cta = useRise(36, 18);
  const laurelH = vertical ? 220 : 280;

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Chrome layout={layout} label="// premios" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: vertical ? "120px 48px" : "80px 72px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: vertical ? 8 : 24, ...laurels }}>
          <Img src={staticFile("laurel-left.png")} style={{ height: laurelH, width: Math.round(laurelH * (454 / 512)) }} />
          <div style={{ width: vertical ? 460 : 720 }}>
            <div style={title}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 64 : 72, letterSpacing: TRACKING, lineHeight: 0.92, color: TEXT_STRONG }}>
                Nominados
              </div>
            </div>
            <div style={{ marginTop: 14, ...sub }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 32 : 36, letterSpacing: TRACKING, lineHeight: 1.05, color: TEXT_STRONG }}>
                PremiosTech.la
              </div>
              <div style={{ marginTop: 8, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 32 : 36, letterSpacing: TRACKING, color: ACCENT }}>
                Comunidad
              </div>
            </div>
          </div>
          <Img src={staticFile("laurel-right.png")} style={{ height: laurelH, width: Math.round(laurelH * (454 / 512)) }} />
        </div>

        <div style={{ marginTop: vertical ? 72 : 48, ...cta, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 48 : 44, letterSpacing: TRACKING, color: TEXT_STRONG, lineHeight: 1 }}>
            Reclamá tu username
          </div>
          <div style={{ marginTop: 22 }}>
            <Logo height={vertical ? 48 : 44} />
          </div>
          <div style={{ marginTop: 16, fontFamily: MONO, fontWeight: 500, fontSize: 16, color: TEXT_MUTED }}>
            huevsite.io <span style={{ fontFamily: "Noto Color Emoji, sans-serif" }}>🥚</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
