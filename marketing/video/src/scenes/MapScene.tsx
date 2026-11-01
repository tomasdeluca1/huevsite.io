import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ACCENT, BG, DISPLAY, MONO, SLATE, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import { countryRows, directoryTotal } from "../data";
import { useRise } from "../motion";
import { Chrome } from "../components/Type";
import type { Layout } from "../timing";

export function MapScene({ layout }: { layout: Layout }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vertical = layout === "vertical";
  const title = useRise(8, 24);
  const max = Math.max(...countryRows.map((r) => r.count));

  const rows = (
    <div style={{ display: "flex", flexDirection: "column", gap: vertical ? 22 : 16 }}>
      {countryRows.map((row, i) => {
        const local = frame - 24 - i * 5;
        const t = local <= 0 ? 0 : spring({ frame: local, fps, config: { damping: 18, stiffness: 120, mass: 0.7 } });
        const full = vertical ? 520 : 560;
        // The two big buckets stay proportional. Smaller countries would be a speck,
        // so they get a short tick — the number next to it is the count.
        const bar = (row.count >= 40 ? (row.count / max) * full : 48) * t;
        const tone = row.tone === "accent" ? ACCENT : SLATE;
        return (
          <div key={row.label} style={{ opacity: local <= 0 ? 0 : t }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <div
                style={{
                  width: vertical ? 96 : 88,
                  fontFamily: MONO,
                  fontWeight: 500,
                  fontSize: vertical ? 32 : 28,
                  color: tone,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.03em",
                }}
              >
                {Math.round(row.count * t)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 32 : 28, letterSpacing: TRACKING, color: TEXT_STRONG, lineHeight: 1 }}>
                  {row.label}
                </div>
                {row.detail ? (
                  <div style={{ marginTop: 4, fontFamily: MONO, fontWeight: 500, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.35 }}>
                    {row.detail}
                  </div>
                ) : null}
                <div style={{ marginTop: 8, height: 3, width: bar, background: tone }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Chrome layout={layout} label="// país público" />
      {vertical ? (
        <div style={{ position: "absolute", left: 64, right: 64, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 40 }}>
          <div style={title}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 76, letterSpacing: TRACKING, lineHeight: 0.92, color: TEXT_STRONG }}>
              Argentina y LATAM.
            </div>
            <div style={{ marginTop: 16, fontFamily: MONO, fontWeight: 500, fontSize: 16, color: TEXT_MUTED }}>
              {directoryTotal} perfiles · el país que cada uno publicó
            </div>
          </div>
          <div style={{ marginTop: 48 }}>{rows}</div>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 72, right: 72, top: 140, bottom: 56, display: "flex", gap: 72, alignItems: "center" }}>
          <div style={{ width: 640, ...title }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 68, letterSpacing: TRACKING, lineHeight: 0.92, color: TEXT_STRONG }}>
              Argentina y LATAM.
            </div>
            <div style={{ marginTop: 20, fontFamily: MONO, fontWeight: 500, fontSize: 16, color: TEXT_MUTED }}>
              {directoryTotal} perfiles · el país que cada uno publicó
            </div>
          </div>
          <div style={{ flex: 1 }}>{rows}</div>
        </div>
      )}
    </AbsoluteFill>
  );
}
