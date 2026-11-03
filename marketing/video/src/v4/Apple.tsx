import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ACCENT, BG, BORDER, DISPLAY, MONO, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import { roster } from "../data";
import type { Layout } from "../timing";

const APPLE = Easing.bezier(0.65, 0, 0.35, 1);
const BEAT = 18;

function person(username: string) {
  const found = roster.find((b) => b.username === username);
  if (!found) throw new Error(username);
  return found;
}

const WEEK = person("giannidona");
const ROW = ["azanello", "tomidelu", "galfrevn", "nerdemma"].map(person);

function reveal(frame: number, at: number, dur = 12) {
  return interpolate(frame, [at, at + dur], [0, 1], {
    easing: APPLE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function Shot({
  frame,
  start,
  end,
  children,
}: {
  frame: number;
  start: number;
  end: number;
  children: React.ReactNode;
}) {
  const fade = 8;
  const enter = start === 0 ? 1 : reveal(frame, start, fade);
  const leave = end >= 1080 ? 0 : interpolate(frame, [end - fade, end], [0, 1], {
    easing: APPLE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(enter, 1 - leave);
  if (frame < start || frame > end || opacity < 0.02) return null;
  const blur = (1 - enter) * 16 + leave * 14;
  const scale = 1.035 - enter * 0.035 + leave * 0.02;
  return (
    <AbsoluteFill
      style={{
        opacity,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        transform: `scale(${scale})`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function Words({
  lines,
  frame,
  at,
  size,
  color = TEXT_STRONG,
}: {
  lines: string[];
  frame: number;
  at: number;
  size: number;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.06 }}>
      {lines.map((line, i) => {
        const p = reveal(frame, at + i * BEAT, 12);
        return (
          <div
            key={line}
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: size,
              letterSpacing: "-0.055em",
              lineHeight: 0.88,
              color,
              opacity: p,
              filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
              transform: `translateY(${(1 - p) * 26}px)`,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}

function Screen({
  src,
  frame,
  start,
  end,
  vertical,
  float,
}: {
  src: string;
  frame: number;
  start: number;
  end: number;
  vertical: boolean;
  float?: boolean;
}) {
  const aspect = src.includes("ranking") ? 1440 / 980 : 1440 / 1180;
  let width = float ? (vertical ? 760 : 900) : vertical ? 980 : 1180;
  let height = width / aspect;
  const maxH = float ? (vertical ? 920 : 640) : vertical ? 1240 : 840;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  const p = interpolate(frame, [start, end], [0, 1], {
    easing: APPLE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = 1 + p * 0.055;
  const y = -p * 16;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: float ? 36 : 28,
        overflow: "hidden",
        background: "#0E0E0F",
        border: `1px solid ${BORDER}`,
        boxShadow: float ? "0 50px 100px rgba(0,0,0,0.62)" : "0 28px 70px rgba(0,0,0,0.5)",
        transform: float ? `perspective(1600px) rotateX(6deg) translateY(${y * 0.4}px)` : undefined,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          transform: `scale(${scale}) translateY(${y}px)`,
          transformOrigin: "center top",
        }}
      />
    </div>
  );
}

function Egg({ size }: { size: number }) {
  return (
    <svg width={size * 0.76} height={size} viewBox="0 0 76 100" aria-hidden>
      <path
        d="M38 3C60 3 73 30 73 54C73 80 57 97 38 97C19 97 3 80 3 54C3 30 16 3 38 3Z"
        fill={ACCENT}
      />
    </svg>
  );
}

export function Apple({ layout, variant }: { layout: Layout; variant: "organic" | "ads" }) {
  const frame = useCurrentFrame();
  const vertical = layout === "vertical";
  const hook = vertical ? 132 : 108;
  const mid = vertical ? 120 : 104;
  const hookLines = variant === "organic" ? ["Nominados", "en PremiosTech."] : ["52 builders", "reales."];

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Shot frame={frame} start={0} end={72}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: vertical ? 18 : 14 }}>
          <Words lines={hookLines} frame={frame} at={0} size={hook} />
          <div style={{ height: vertical ? 18 : 10 }} />
          <Words lines={["Por ellos."]} frame={frame} at={BEAT * 3} size={vertical ? 96 : 80} color={ACCENT} />
        </div>
      </Shot>

      <Shot frame={frame} start={72} end={144}>
        <Words lines={["Un", "perfil."]} frame={frame} at={72} size={mid} />
      </Shot>

      <Shot frame={frame} start={144} end={288}>
        <Screen src="screens/profile.png" frame={frame} start={144} end={288} vertical={vertical} />
      </Shot>

      <Shot frame={frame} start={288} end={360}>
        <Words lines={["Un", "ranking."]} frame={frame} at={288} size={mid} />
      </Shot>

      <Shot frame={frame} start={360} end={504}>
        <Screen src="screens/ranking.png" frame={frame} start={360} end={504} vertical={vertical} />
      </Shot>

      <Shot frame={frame} start={504} end={576}>
        <Words lines={["Esta", "semana."]} frame={frame} at={504} size={mid} />
      </Shot>

      <Shot frame={frame} start={576} end={720}>
        <Portrait frame={frame} start={576} end={720} vertical={vertical} />
      </Shot>

      <Shot frame={frame} start={720} end={828}>
        <FaceRow frame={frame} start={720} vertical={vertical} />
      </Shot>

      <Shot frame={frame} start={828} end={900}>
        <Words lines={["Un solo", "lugar."]} frame={frame} at={828} size={mid} />
      </Shot>

      <Shot frame={frame} start={900} end={972}>
        <Screen
          src="screens/profile.png"
          frame={frame}
          start={900}
          end={972}
          vertical={vertical}
          float
        />
      </Shot>

      <Shot frame={frame} start={972} end={1080}>
        <EndCard frame={frame} vertical={vertical} />
      </Shot>
    </AbsoluteFill>
  );
}

function Portrait({
  frame,
  start,
  end,
  vertical,
}: {
  frame: number;
  start: number;
  end: number;
  vertical: boolean;
}) {
  const p = interpolate(frame, [start, end], [0, 1], {
    easing: APPLE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const size = vertical ? 460 : 340;
  const nameIn = reveal(frame, start + 8, 14);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size,
          overflow: "hidden",
          transform: `scale(${1 + p * 0.04})`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        <Img src={staticFile(WEEK.avatarFile || "")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div
        style={{
          marginTop: 28,
          opacity: nameIn,
          transform: `translateY(${(1 - nameIn) * 16}px)`,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 64 : 52, letterSpacing: TRACKING, color: TEXT_STRONG, lineHeight: 0.95 }}>
          {WEEK.name}
        </div>
        <div style={{ marginTop: 12, fontFamily: MONO, fontWeight: 500, fontSize: vertical ? 22 : 18, color: TEXT_MUTED }}>
          Builder de la Semana
        </div>
      </div>
    </div>
  );
}

function FaceRow({ frame, start, vertical }: { frame: number; start: number; vertical: boolean }) {
  const size = vertical ? 168 : 132;
  return (
    <div style={{ display: "flex", gap: vertical ? 28 : 36, alignItems: "flex-start" }}>
      {ROW.map((card, i) => {
        const p = reveal(frame, start + i * BEAT, 12);
        return (
          <div key={card.username} style={{ opacity: p, transform: `translateY(${(1 - p) * 18}px)`, textAlign: "center", width: size + 8 }}>
            <div style={{ width: size, height: size, borderRadius: size, overflow: "hidden", margin: "0 auto", boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}>
              <Img src={staticFile(card.avatarFile || "")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ marginTop: 14, fontFamily: MONO, fontWeight: 500, fontSize: vertical ? 15 : 14, color: TEXT_MUTED }}>
              @{card.username}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EndCard({ frame, vertical }: { frame: number; vertical: boolean }) {
  const drift = interpolate(frame, [972, 1080], [1, 1.018], {
    easing: APPLE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${drift})` }}>
      <Egg size={vertical ? 92 : 78} />
      <div style={{ height: vertical ? 36 : 28 }} />
      <Words lines={["Armá tu portfolio"]} frame={frame} at={972} size={vertical ? 68 : 60} />
      <div style={{ height: 16 }} />
      <Words lines={["en huevsite.io"]} frame={frame} at={984} size={vertical ? 44 : 40} color={ACCENT} />
    </div>
  );
}
