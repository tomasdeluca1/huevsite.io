import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ACCENT, BG, DISPLAY, MONO, TEXT_DIM, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import { useRise } from "../motion";
import { Logo } from "../components/Type";
import type { Layout } from "../timing";

export function Hook({ layout }: { layout: Layout }) {
  const frame = useCurrentFrame();
  const vertical = layout === "vertical";
  const label = "// la red, en vivo";
  const typed = label.slice(0, Math.round(interpolate(frame, [6, 34], [0, label.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })));
  const logo = useRise(18, 18);
  const ruleW = interpolate(frame, [40, 62], [0, vertical ? 200 : 240], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line1 = useRise(48, 36);
  const line2 = useRise(66, 28);
  const foot = useRise(88, 16);
  const cursorOn = Math.floor(frame / 14) % 2 === 0;

  return (
    <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: vertical ? "0 72px" : "0 120px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: vertical ? 20 : 18, color: TEXT_MUTED, minHeight: 28 }}>
          {typed}
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 18,
              marginLeft: 6,
              background: ACCENT,
              verticalAlign: "text-bottom",
              opacity: cursorOn ? 1 : 0,
            }}
          />
        </div>
        <div style={{ marginTop: vertical ? 36 : 28, ...logo }}>
          <Logo height={vertical ? 132 : 112} />
        </div>
        <div style={{ marginTop: vertical ? 36 : 28, height: 3, width: ruleW, background: ACCENT }} />
        <div style={{ marginTop: vertical ? 40 : 32, ...line1 }}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: vertical ? 84 : 72,
              letterSpacing: TRACKING,
              lineHeight: 1,
              color: TEXT_STRONG,
            }}
          >
            Mostrá lo que shippeás.
          </div>
        </div>
        <div style={{ marginTop: vertical ? 28 : 24, ...line2 }}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: vertical ? 40 : 34,
              letterSpacing: TRACKING,
              lineHeight: 1,
              color: TEXT_DIM,
            }}
          >
            Que te encuentren.
          </div>
        </div>
        <div style={{ marginTop: vertical ? 48 : 36, ...foot, fontFamily: MONO, fontWeight: 500, fontSize: 16, color: TEXT_MUTED }}>
          huevsite.io
        </div>
      </div>
    </AbsoluteFill>
  );
}
