import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ACCENT, BG, BORDER, DISPLAY, MONO, SURFACE, TEXT, TEXT_MUTED } from "../brand";
import { Logo } from "../components/Type";
import { roster, soloProjects } from "../data";
import type { Layout } from "../timing";

const EASE = Easing.bezier(0.65, 0, 0.35, 1);
const FADE = 12;

/** 36s. Each block is one StoryBrand beat. */
const AT = {
  hook: [0, 60],
  scattered: [60, 120],
  cards: [120, 210],
  unseen: [210, 285],
  failure: [285, 345],
  guide: [345, 435],
  planProfile: [435, 480],
  profile: [480, 570],
  planProjects: [570, 615],
  projects: [615, 705],
  planSeen: [705, 750],
  ranking: [750, 870],
  proof: [870, 975],
  cta: [975, 1080],
} as const;

function person(username: string) {
  const found = roster.find((b) => b.username === username);
  if (!found) throw new Error(username);
  return found;
}

const PROOF = ["giannidona", "azanello", "tomidelu"].map(person);

function clampReveal(frame: number, at: number, dur = 14) {
  return interpolate(frame, [at, at + dur], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function shotOpacity(frame: number, start: number, end: number, last = false) {
  const enter = start === 0 ? 1 : clampReveal(frame, start, FADE);
  const leave = last
    ? 0
    : interpolate(frame, [end - FADE, end], [0, 1], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  return Math.min(enter, 1 - leave);
}

function Shot({
  frame,
  start,
  end,
  last,
  children,
}: {
  frame: number;
  start: number;
  end: number;
  last?: boolean;
  children: React.ReactNode;
}) {
  const opacity = shotOpacity(frame, start, end, last);
  if (frame < start || frame > end || opacity < 0.02) return null;
  const enter = start === 0 ? 1 : clampReveal(frame, start, FADE);
  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${1.02 - enter * 0.02})`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function Line({
  text,
  frame,
  at,
  size,
  color = TEXT,
}: {
  text: string;
  frame: number;
  at: number;
  size: number;
  color?: string;
}) {
  const p = clampReveal(frame, at, 12);
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "-0.05em",
        lineHeight: 0.9,
        color,
        textAlign: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * 22}px)`,
      }}
    >
      {text}
    </div>
  );
}

function Stack({
  lines,
  frame,
  at,
  size,
  color,
  gap,
}: {
  lines: string[];
  frame: number;
  at: number;
  size: number;
  color?: string;
  gap?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: gap ?? size * 0.08, padding: "0 64px" }}>
      {lines.map((line, i) => (
        <Line key={line} text={line} frame={frame} at={at + i * 10} size={size} color={color} />
      ))}
    </div>
  );
}

const SCATTER = [
  { x: -170, y: -300, r: -7 },
  { x: 160, y: -90, r: 6 },
  { x: -140, y: 140, r: -4 },
  { x: 170, y: 320, r: 5 },
];

function Product({
  src,
  frame,
  start,
  end,
  vertical,
}: {
  src: string;
  frame: number;
  start: number;
  end: number;
  vertical: boolean;
}) {
  const aspect = src.includes("ranking") ? 1440 / 980 : 1440 / 1180;
  let width = vertical ? 960 : 1160;
  let height = width / aspect;
  const maxH = vertical ? 1180 : 800;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  const p = interpolate(frame, [start, end], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 28,
        overflow: "hidden",
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          transform: `scale(${1 + p * 0.045}) translateY(${-p * 12}px)`,
          transformOrigin: "center top",
        }}
      />
    </div>
  );
}

function Egg({ size }: { size: number }) {
  return (
    <svg width={size * 0.76} height={size} viewBox="0 0 76 100" aria-hidden>
      <path d="M38 3C60 3 73 30 73 54C73 80 57 97 38 97C19 97 3 80 3 54C3 30 16 3 38 3Z" fill={ACCENT} />
    </svg>
  );
}

export function Story({ layout, variant }: { layout: Layout; variant: "organic" | "ads" }) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const vertical = layout === "vertical";
  const hero = vertical ? 118 : 96;
  const mid = vertical ? 104 : 88;
  const hookLines = variant === "organic" ? ["Nominados", "en PremiosTech."] : ["52 builders", "reales."];
  const proofLine = variant === "organic" ? "PremiosTech." : "Builders reales.";

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Shot frame={frame} start={AT.hook[0]} end={AT.hook[1]}>
        <Stack lines={hookLines} frame={frame} at={-4} size={hero} />
      </Shot>

      <Shot frame={frame} start={AT.scattered[0]} end={AT.scattered[1]}>
        <Stack lines={["Tu trabajo", "está disperso."]} frame={frame} at={AT.scattered[0]} size={mid} />
      </Shot>

      <Shot frame={frame} start={AT.cards[0]} end={AT.cards[1]}>
        <Scattered frame={frame} vertical={vertical} />
      </Shot>

      <Shot frame={frame} start={AT.unseen[0]} end={AT.unseen[1]}>
        <Stack lines={["Nadie", "te ve."]} frame={frame} at={AT.unseen[0]} size={hero} />
      </Shot>

      <Shot frame={frame} start={AT.failure[0]} end={AT.failure[1]}>
        <Stack lines={["Seguir", "invisible."]} frame={frame} at={AT.failure[0]} size={mid} />
      </Shot>

      <Shot frame={frame} start={AT.guide[0]} end={AT.guide[1]}>
        <Guide frame={frame} vertical={vertical} />
      </Shot>

      <Shot frame={frame} start={AT.planProfile[0]} end={AT.planProfile[1]}>
        <Stack lines={["Creá", "tu perfil."]} frame={frame} at={AT.planProfile[0]} size={mid} />
      </Shot>

      <Shot frame={frame} start={AT.profile[0]} end={AT.profile[1]}>
        <Product src="screens/profile.png" frame={frame} start={AT.profile[0]} end={AT.profile[1]} vertical={vertical} />
      </Shot>

      <Shot frame={frame} start={AT.planProjects[0]} end={AT.planProjects[1]}>
        <Stack lines={["Sumá", "proyectos."]} frame={frame} at={AT.planProjects[0]} size={mid} />
      </Shot>

      <Shot frame={frame} start={AT.projects[0]} end={AT.projects[1]}>
        <ProjectList frame={frame} vertical={vertical} width={width} />
      </Shot>

      <Shot frame={frame} start={AT.planSeen[0]} end={AT.planSeen[1]}>
        <Stack lines={["Que", "te vean."]} frame={frame} at={AT.planSeen[0]} size={mid} />
      </Shot>

      <Shot frame={frame} start={AT.ranking[0]} end={AT.ranking[1]}>
        <Product src="screens/ranking.png" frame={frame} start={AT.ranking[0]} end={AT.ranking[1]} vertical={vertical} />
      </Shot>

      <Shot frame={frame} start={AT.proof[0]} end={AT.proof[1]}>
        <Proof frame={frame} vertical={vertical} line={proofLine} />
      </Shot>

      <Shot frame={frame} start={AT.cta[0]} end={AT.cta[1]} last>
        <EndCard frame={frame} vertical={vertical} />
      </Shot>
    </AbsoluteFill>
  );
}

function Scattered({ frame, vertical }: { frame: number; vertical: boolean }) {
  const local = frame - AT.cards[0];
  return (
    <AbsoluteFill>
      {soloProjects.map((project, i) => {
        const spot = SCATTER[i];
        const fade = interpolate(local, [22 + i * 16, 46 + i * 16], [1, 0], {
          easing: EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = vertical ? 1 : 0.9;
        return (
          <div
            key={project.title}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: vertical ? 320 : 360,
              opacity: fade,
              transform: `translate(calc(-50% + ${spot.x * scale}px), calc(-50% + ${spot.y * (vertical ? 1 : 0.55)}px)) rotate(${spot.r}deg)`,
              background: "#171718",
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, color: TEXT_MUTED }}>{project.host}</div>
            <div style={{ marginTop: 6, fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em", color: TEXT, lineHeight: 1.05 }}>
              {project.title}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function Guide({ frame, vertical }: { frame: number; vertical: boolean }) {
  const p = clampReveal(frame, AT.guide[0], 18);
  const drift = interpolate(frame, [AT.guide[0], AT.guide[1]], [0.98, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity: p, transform: `scale(${drift})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Logo height={vertical ? 84 : 72} />
    </div>
  );
}

function ProjectList({ frame, vertical, width }: { frame: number; vertical: boolean; width: number }) {
  const settle = clampReveal(frame, AT.projects[0], 18);
  return (
    <div style={{ width: Math.min(width - 96, vertical ? 760 : 820), display: "flex", flexDirection: "column", gap: 12 }}>
      {soloProjects.map((project, i) => {
        const spot = SCATTER[i];
        const x = (1 - settle) * spot.x * 0.35;
        const y = (1 - settle) * 24;
        return (
          <div
            key={project.title}
            style={{
              transform: `translate(${x}px, ${y}px)`,
              background: "#171718",
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: "14px 18px",
            }}
          >
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 26 : 22, letterSpacing: "-0.04em", color: TEXT }}>
              {project.title}
            </div>
            <div style={{ marginTop: 4, fontFamily: MONO, fontWeight: 500, fontSize: 14, color: TEXT_MUTED }}>{project.host}</div>
          </div>
        );
      })}
    </div>
  );
}

function Proof({ frame, vertical, line }: { frame: number; vertical: boolean; line: string }) {
  const size = vertical ? 168 : 140;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: vertical ? 36 : 28 }}>
      <div style={{ display: "flex", gap: vertical ? 22 : 32 }}>
        {PROOF.map((card, i) => {
          const p = clampReveal(frame, AT.proof[0] + i * 8, 14);
          return (
            <div key={card.username} style={{ opacity: p, transform: `translateY(${(1 - p) * 16}px)`, textAlign: "center", width: size }}>
              <div style={{ width: size, height: size, borderRadius: size, overflow: "hidden", margin: "0 auto" }}>
                <Img src={staticFile(card.avatarFile || "")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ marginTop: 12, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 18 : 16, letterSpacing: "-0.03em", color: TEXT }}>
                {card.name.split(" ")[0]}
              </div>
            </div>
          );
        })}
      </div>
      <Line text={line} frame={frame} at={AT.proof[0] + 28} size={vertical ? 64 : 56} color={ACCENT} />
    </div>
  );
}

function EndCard({ frame, vertical }: { frame: number; vertical: boolean }) {
  const drift = interpolate(frame, [AT.cta[0], AT.cta[1]], [1, 1.015], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${drift})` }}>
      <Logo height={vertical ? 64 : 56} />
      <div style={{ height: 28 }} />
      <Egg size={vertical ? 72 : 60} />
      <div style={{ height: 32 }} />
      <Line text="Armá tu portfolio" frame={frame} at={AT.cta[0]} size={vertical ? 64 : 56} />
      <div style={{ height: 14 }} />
      <Line text="huevsite.io" frame={frame} at={AT.cta[0] + 8} size={vertical ? 36 : 32} color={ACCENT} />
    </div>
  );
}
