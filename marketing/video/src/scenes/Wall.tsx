import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../motion";
import { ACCENT, BG, BORDER, DISPLAY, MONO, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import { directoryLabel, directoryTotal, wallBuilders } from "../data";
import { Chrome } from "../components/Type";
import { ProfileCard } from "../components/ProfileCard";
import type { Layout } from "../timing";

export function Wall({ layout }: { layout: Layout }) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const vertical = layout === "vertical";
  const padX = vertical ? 64 : 72;
  const chromeH = vertical ? 108 : 88;
  const cols = vertical ? 2 : 4;
  const gap = 16;
  const cards = wallBuilders.slice(0, vertical ? 40 : 48);
  const cardW = (width - padX * 2 - gap * (cols - 1)) / cols;
  const cardH = vertical ? 168 : 132;
  const stride = cardH + gap;
  const rows = Math.ceil(cards.length / cols);
  const viewTop = chromeH + 8;
  const viewH = height - viewTop - 24;
  const maxScroll = Math.max(0, rows * stride - viewH);
  const scroll = interpolate(frame, [28, 230], [0, maxScroll], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const dim = interpolate(frame, [228, 252], [1, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const count = Math.round(
    interpolate(frame, [214, 252], [0, directoryTotal], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  );
  const local = Math.max(0, frame - 236);
  const pop = local === 0 && frame < 236 ? 0 : spring({ frame: local, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
  const numberOpacity = frame < 230 ? 0 : pop;

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Chrome layout={layout} label="// explore" />
      <div
        style={{
          position: "absolute",
          top: viewTop,
          left: padX,
          right: padX,
          height: viewH,
          overflow: "hidden",
          opacity: dim,
        }}
      >
        <div style={{ transform: `translateY(${-scroll}px)` }}>
          {cards.map((builder, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const delay = row * 3 + col;
            const enter = spring({
              frame: Math.max(0, frame - delay),
              fps,
              config: { damping: 16, stiffness: 140, mass: 0.6 },
            });
            const y = interpolate(enter, [0, 1], [36, 0]);
            return (
              <div
                key={`${builder.username}-${i}`}
                style={{
                  position: "absolute",
                  left: col * (cardW + gap),
                  top: row * stride,
                  opacity: frame < delay ? 0 : enter,
                  transform: `translateY(${y}px)`,
                }}
              >
                <ProfileCard builder={builder} width={cardW} height={cardH} />
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: vertical ? 48 : 360,
          right: vertical ? 48 : 360,
          top: vertical ? height * 0.3 : height * 0.16,
          background: BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: vertical ? "40px 28px 36px" : "28px 32px 26px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: numberOpacity,
          transform: `translateY(${interpolate(pop, [0, 1], [24, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: vertical ? 18 : 16,
            color: TEXT_MUTED,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(count).padStart(3, "0")} en el directorio
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: vertical ? 168 : 132,
            letterSpacing: TRACKING,
            lineHeight: 0.86,
            color: ACCENT,
          }}
        >
          {directoryLabel.split(" ")[0]}
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: vertical ? 72 : 56,
            letterSpacing: TRACKING,
            lineHeight: 0.9,
            color: TEXT_STRONG,
          }}
        >
          builders
        </div>
        <div
          style={{
            marginTop: 22,
            height: 3,
            width: interpolate(pop, [0, 1], [0, vertical ? 180 : 160]),
            background: ACCENT,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
