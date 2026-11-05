import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ACCENT, BG, BORDER, DISPLAY, MONO, SURFACE, TEXT_DIM, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import { Logo } from "../components/Type";
import { roster, soloBuilder, soloProjects } from "../data";
import type { Layout } from "../timing";
import { CommunityWall } from "./Community";

const EASE = Easing.inOut(Easing.cubic);

function fadeWindow(frame: number, start: number, end: number, edge = 18) {
  const inn = interpolate(frame, [start, start + edge], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const out = interpolate(frame, [end - edge, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  return Math.min(inn, out);
}

function Avatar({ file, name, size }: { file: string | null; name: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        overflow: "hidden",
        background: "#171718",
        border: `1px solid ${BORDER}`,
        flexShrink: 0,
      }}
    >
      {file ? (
        <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 800, color: TEXT_STRONG, fontSize: size * 0.4 }}>
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

function Egg({ open, size }: { open: number; size: number }) {
  const gap = 4 + open * size * 0.28;
  return (
    <div style={{ width: size * 0.78, height: size, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "54%",
          background: ACCENT,
          borderRadius: `${size}px ${size}px ${size * 0.15}px ${size * 0.15}px`,
          transform: `translateY(${-gap}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "46%",
          background: ACCENT,
          borderRadius: `${size * 0.12}px ${size * 0.12}px ${size}px ${size}px`,
          transform: `translateY(${gap}px)`,
        }}
      />
    </div>
  );
}

const HOOK_FACES = [0, 3, 7, 11, 16, 21, 28, 34, 40, 48].filter((i) => i < roster.length);

export function Story({ layout, variant }: { layout: Layout; variant: "organic" | "ads" }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const vertical = layout === "vertical";

  const hook = frame < 60 ? 1 : fadeWindow(frame, 0, 78, 18);
  const problem = fadeWindow(frame, 48, 312, 20);
  const turn = fadeWindow(frame, 292, 612, 22);
  const community = fadeWindow(frame, 590, 1152, 24);
  const cta = interpolate(frame, [1128, 1164], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {hook > 0.01 ? <Hook frame={frame} fps={fps} vertical={vertical} width={width} opacity={hook} variant={variant} /> : null}
      {problem > 0.01 ? <Problem frame={frame} vertical={vertical} opacity={problem} /> : null}
      {turn > 0.01 ? <Turn frame={frame} vertical={vertical} width={width} opacity={turn} /> : null}
      {community > 0.01 ? (
        <AbsoluteFill style={{ opacity: community }}>
          <CommunityWall frame={frame} layout={layout} />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: vertical ? 150 : 110,
              background: BG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: vertical ? 42 : 36,
              letterSpacing: TRACKING,
              color: TEXT_STRONG,
              opacity: fadeWindow(frame, 820, 1120, 24),
            }}
          >
            No estás solo.
          </div>
        </AbsoluteFill>
      ) : null}
      {cta > 0.01 ? <Cta opacity={cta} vertical={vertical} /> : null}
    </AbsoluteFill>
  );
}

function Hook({
  frame,
  fps,
  vertical,
  width,
  opacity,
  variant,
}: {
  frame: number;
  fps: number;
  vertical: boolean;
  width: number;
  opacity: number;
  variant: "organic" | "ads";
}) {
  const line = variant === "organic" ? "Nominados en PremiosTech." : "52 builders reales.";
  const faces = HOOK_FACES.map((index) => roster[index]);
  return (
    <AbsoluteFill style={{ opacity, background: BG, alignItems: "center", justifyContent: "center", padding: vertical ? 48 : 72 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(5, ${vertical ? 112 : 96}px)`, gap: vertical ? 16 : 14, justifyContent: "center", marginBottom: vertical ? 36 : 28 }}>
        {faces.map((card, i) => {
          const enter = spring({
            frame: frame + 14 - i * 2,
            fps,
            config: { damping: 28, stiffness: 70, mass: 0.85 },
          });
          return (
            <div key={card.username} style={{ opacity: enter, transform: `scale(${0.9 + enter * 0.1})` }}>
              <Avatar file={card.avatarFile} name={card.name} size={vertical ? 112 : 96} />
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 58 : 52, letterSpacing: TRACKING, color: TEXT_STRONG, textAlign: "center", lineHeight: 0.98, maxWidth: width - 96 }}>
        {line}
      </div>
      <div style={{ marginTop: 14, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 40 : 36, letterSpacing: TRACKING, color: ACCENT, textAlign: "center" }}>
        Por ellos.
      </div>
    </AbsoluteFill>
  );
}

const SCATTER = [
  { x: -200, y: -340, rot: -7 },
  { x: 190, y: -160, rot: 6 },
  { x: -170, y: 200, rot: -4 },
  { x: 210, y: 340, rot: 5 },
];

function Problem({ frame, vertical, opacity }: { frame: number; vertical: boolean; opacity: number }) {
  const local = frame - 60;
  return (
    <AbsoluteFill style={{ opacity, background: BG, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <Avatar file={soloBuilder.avatarFile} name={soloBuilder.name} size={vertical ? 148 : 120} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 36 : 30, letterSpacing: TRACKING, color: TEXT_STRONG }}>{soloBuilder.name}</div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 16, color: TEXT_MUTED }}>@{soloBuilder.username}</div>
      </div>
      {soloProjects.map((project, i) => {
        const fade = interpolate(local, [50 + i * 42, 92 + i * 42], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        });
        const spot = SCATTER[i];
        const scale = vertical ? 1 : 0.9;
        return (
          <div
            key={project.title}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: vertical ? 340 : 380,
              opacity: fade,
              transform: `translate(calc(-50% + ${spot.x * scale}px), calc(-50% + ${spot.y * (vertical ? 1 : 0.62)}px)) rotate(${spot.rot}deg)`,
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, color: ACCENT }}>{project.host}</div>
            <div style={{ marginTop: 6, fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, letterSpacing: TRACKING, color: TEXT_STRONG, lineHeight: 1.05 }}>{project.title}</div>
            <div style={{ marginTop: 6, fontFamily: DISPLAY, fontWeight: 800, fontSize: 14, letterSpacing: TRACKING, color: TEXT_DIM, lineHeight: 1.3 }}>{project.description}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function Turn({
  frame,
  vertical,
  width,
  opacity,
}: {
  frame: number;
  vertical: boolean;
  width: number;
  opacity: number;
}) {
  const local = Math.max(0, frame - 300);
  const open = interpolate(local, [0, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const logoIn = interpolate(local, [56, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const settle = interpolate(local, [90, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const cardOpacity = interpolate(local, [80, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const eggOpacity = interpolate(local, [50, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

  return (
    <AbsoluteFill style={{ opacity, background: BG, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", opacity: eggOpacity, transform: `scale(${1 + open * 0.08})` }}>
        <Egg open={open} size={vertical ? 220 : 180} />
      </div>
      <div style={{ opacity: logoIn, transform: `scale(${0.94 + logoIn * 0.06})`, marginBottom: vertical ? 28 : 18 }}>
        <Logo height={vertical ? 72 : 60} />
      </div>
      <div style={{ width: Math.min(width - 80, vertical ? 760 : 920), display: "flex", flexDirection: "column", gap: 12, marginTop: vertical ? 12 : 8 }}>
        {soloProjects.map((project, i) => {
          const spot = SCATTER[i];
          const x = (1 - settle) * spot.x * (vertical ? 0.7 : 0.85);
          const y = (1 - settle) * spot.y * 0.25;
          const rot = (1 - settle) * spot.rot;
          return (
            <div
              key={project.title}
              style={{
                opacity: cardOpacity,
                transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 22 : 20, letterSpacing: TRACKING, color: TEXT_STRONG }}>{project.title}</div>
                <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, color: TEXT_MUTED }}>{project.host}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", bottom: vertical ? 80 : 48, display: "flex", alignItems: "center", gap: 14, opacity: settle }}>
        <Avatar file={soloBuilder.avatarFile} name={soloBuilder.name} size={54} />
        <div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, letterSpacing: TRACKING, color: TEXT_STRONG }}>{soloBuilder.name}</div>
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, color: ACCENT }}>@{soloBuilder.username}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Cta({ opacity, vertical }: { opacity: number; vertical: boolean }) {
  return (
    <AbsoluteFill style={{ opacity, background: BG, alignItems: "center", justifyContent: "center", padding: vertical ? 56 : 80 }}>
      <Logo height={vertical ? 68 : 56} />
      <div style={{ marginTop: 32, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 58 : 52, letterSpacing: TRACKING, color: TEXT_STRONG, textAlign: "center", lineHeight: 0.98, maxWidth: vertical ? 900 : 1200 }}>
        Sumate como Founder
      </div>
      <div style={{ marginTop: 12, fontFamily: MONO, fontWeight: 500, fontSize: vertical ? 32 : 28, color: ACCENT, textAlign: "center" }}>
        en huevsite.io
      </div>
      <div style={{ marginTop: 36 }}>
        <Egg open={0} size={vertical ? 72 : 64} />
      </div>
    </AbsoluteFill>
  );
}
