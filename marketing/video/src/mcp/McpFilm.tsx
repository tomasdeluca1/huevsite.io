import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  ACCENT,
  BG,
  BORDER,
  BORDER_BRIGHT,
  DISPLAY,
  MONO,
  SURFACE,
  SURFACE2,
  TEXT,
  TEXT_DIM,
  TEXT_MUTED,
  TEXT_STRONG,
  TRACKING,
} from "../brand";
import { Chrome } from "../components/Type";
import { roster } from "../data";
import { Fonts } from "../fonts";
import type { Layout } from "../timing";
import { AT, CLIENT_AT, DEMO, DURATION, ENDPOINT, PROMPT, TOOLS, TYPE } from "./timeline";

/**
 * Anuncio del MCP de huevsite.io.
 * Un solo personaje gráfico: el bloque lima es el agente. Escribe el gancho, entra al perfil,
 * deja un bloque nuevo y termina pegado al avatar de cada builder.
 */

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN = Easing.bezier(0.7, 0, 0.84, 0);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const INK = "#050505";

function ramp(frame: number, from: number, dur: number, easing: (n: number) => number = OUT) {
  return interpolate(frame, [from, from + dur], [0, 1], { ...CLAMP, easing });
}

function typed(text: string, frame: number, from: number, to: number) {
  const n = Math.floor(interpolate(frame, [from, to], [0, text.length], CLAMP));
  return text.slice(0, n);
}

const blink = (frame: number) => (frame % 18 < 11 ? 1 : 0);

type Scene = { frame: number; v: boolean };

/* ───────────────────────── primitivas ───────────────────────── */

function Words({
  frame,
  at,
  out,
  size,
  text,
  lines,
  color = TEXT_STRONG,
  accent = [],
  stagger = 3,
  lineStagger = 0,
  align = "left",
  maxWidth,
  tail,
}: {
  frame: number;
  at: number;
  out?: number;
  size: number;
  text?: string;
  lines?: string[];
  color?: string;
  accent?: string[];
  stagger?: number;
  lineStagger?: number;
  align?: "left" | "center";
  maxWidth?: number;
  tail?: React.ReactNode;
}) {
  const rows = lines ?? [text ?? ""];
  let index = 0;
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: TRACKING,
        lineHeight: 1,
        color,
        maxWidth,
      }}
    >
      {rows.map((row, r) => {
        const words = row.split(" ");
        return (
          <div
            key={r}
            style={{
              display: "flex",
              flexWrap: lines ? "nowrap" : "wrap",
              columnGap: "0.22em",
              justifyContent: align === "center" ? "center" : "flex-start",
              alignItems: "baseline",
              marginBottom: "-0.04em",
            }}
          >
            {words.map((word, w) => {
              const delay = r * lineStagger + (lineStagger ? w * stagger : index * stagger);
              index += 1;
              const p = ramp(frame, at + delay, 18);
              const q = out === undefined ? 0 : ramp(frame, out + r * 2 + w, 10, IN);
              return (
                <span
                  key={w}
                  style={{
                    display: "inline-block",
                    overflow: "hidden",
                    padding: "0.1em 0.06em 0.22em",
                    margin: "-0.1em -0.06em -0.22em",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transform: `translateY(${(1 - p) * 125 - q * 125}%)`,
                      color: accent.includes(word) ? ACCENT : undefined,
                    }}
                  >
                    {word}
                  </span>
                </span>
              );
            })}
            {r === rows.length - 1 ? tail : null}
          </div>
        );
      })}
    </div>
  );
}

function Label({
  children,
  color = TEXT_MUTED,
  size = 18,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: size,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Caret({ frame, size, steady }: { frame: number; size: number; steady?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size * 0.5,
        height: size * 0.86,
        marginLeft: size * 0.12,
        background: ACCENT,
        opacity: steady ? 1 : blink(frame),
        verticalAlign: "text-bottom",
        flexShrink: 0,
      }}
    />
  );
}

function Dots({ frame }: { frame: number }) {
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${BORDER} 1.5px, transparent 1.6px)`,
        backgroundSize: "48px 48px",
        backgroundPosition: `24px ${24 - frame * 0.35}px`,
      }}
    />
  );
}

/** Barrido lima a pantalla completa. El corte ocurre cuando tapa todo. */
function Wipe({ frame, at }: { frame: number; at: number }) {
  if (frame < at - 10 || frame > at + 12) return null;
  const a = ramp(frame, at - 10, 10, INOUT);
  const b = ramp(frame, at, 12, INOUT);
  return <AbsoluteFill style={{ background: ACCENT, transform: `translateY(${(1 - a) * 100 - b * 100}%)` }} />;
}

function Chip({ children, lime }: { children: React.ReactNode; lime?: boolean }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: 19,
        color: lime ? ACCENT : TEXT_DIM,
        border: `1px solid ${lime ? ACCENT : BORDER_BRIGHT}`,
        borderRadius: 8,
        padding: "5px 12px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── 1 · gancho ───────────────────────── */

function Hook({ frame, v }: Scene) {
  const size = v ? 168 : 156;
  const lines = v ? ["Tu agente", "ya puede", "editar tu", "huevsite."] : ["Tu agente ya puede", "editar tu huevsite."];
  const out = AT.prompt - 16;
  const lastAt = v ? 8 + 27 : 8 + 18;
  const label = ramp(frame, 3, 14) - ramp(frame, out, 8, IN);
  return (
    <AbsoluteFill style={{ padding: v ? "520px 80px 0" : "350px 96px 0" }}>
      <div style={{ opacity: label, transform: `translateY(${(1 - label) * 12}px)`, marginBottom: v ? 40 : 32 }}>
        <Label color={ACCENT} size={v ? 24 : 22}>
          MCP · Nuevo
        </Label>
      </div>
      <div style={{ position: "relative" }}>
        {frame < 9 ? (
          <div style={{ position: "absolute", left: -size * 0.12, top: size * 0.08 }}>
            <Caret frame={frame} size={size} steady />
          </div>
        ) : null}
        <Words
          frame={frame}
          at={8}
          out={out}
          size={size}
          lines={lines}
          accent={["huevsite."]}
          lineStagger={v ? 9 : 18}
          stagger={v ? 3 : 4}
          tail={
            frame >= lastAt + 12 && frame < out ? (
              <span style={{ alignSelf: "center" }}>
                <Caret frame={frame} size={size * 0.9} />
              </span>
            ) : null
          }
        />
      </div>
    </AbsoluteFill>
  );
}

/* ───────────────────────── 2 · prompt ───────────────────────── */

function PromptCard({ frame, v }: Scene) {
  const enter = ramp(frame, AT.prompt, 18);
  const t = ramp(frame, TYPE.enter + 10, 24, INOUT);
  const big = v ? { x: 80, y: 600, w: 920, h: 560 } : { x: 300, y: 270, w: 1320, h: 470 };
  const small = v ? { x: 80, y: 350, w: 920, h: 84 } : { x: 72, y: 380, w: 780, h: 84 };
  const mix = (a: number, b: number) => a + (b - a) * t;
  const pressed = frame >= TYPE.enter && frame < TYPE.enter + 9;
  const flash = ramp(frame, TYPE.enter, 2) - ramp(frame, TYPE.enter + 6, 10, INOUT);
  const text = typed(PROMPT, frame, TYPE.promptFrom, TYPE.promptTo);
  const bigSize = v ? 58 : 62;
  return (
    <div
      style={{
        position: "absolute",
        left: mix(big.x, small.x),
        top: mix(big.y, small.y) + (1 - enter) * 120,
        width: mix(big.w, small.w),
        height: mix(big.h, small.h),
        opacity: enter,
        background: SURFACE,
        border: `1px solid ${flash > 0.05 ? ACCENT : BORDER_BRIGHT}`,
        borderRadius: 10,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, padding: v ? 44 : 48, opacity: 1 - Math.min(1, t * 2.2) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 16, height: 16, background: ACCENT }} />
            <Label color={TEXT} size={20}>
              Tu agente
            </Label>
          </div>
          <Label size={18}>MCP · huevsite conectado</Label>
        </div>
        <div
          style={{
            marginTop: v ? 56 : 48,
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: bigSize,
            lineHeight: 1.28,
            color: TEXT_STRONG,
            width: big.w - (v ? 88 : 96),
          }}
        >
          {text}
          <Caret frame={frame} size={bigSize * 0.92} steady={frame < TYPE.promptTo} />
        </div>
        <div
          style={{
            position: "absolute",
            right: v ? 44 : 48,
            bottom: v ? 44 : 48,
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: 20,
            letterSpacing: "0.1em",
            padding: "12px 22px",
            borderRadius: 8,
            border: `1px solid ${pressed ? ACCENT : BORDER_BRIGHT}`,
            background: pressed ? ACCENT : "transparent",
            color: pressed ? INK : TEXT_MUTED,
            transform: `translateY(${pressed ? 3 : 0}px)`,
          }}
        >
          ENTER
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 24px",
          opacity: Math.max(0, t * 2.2 - 1.2),
        }}
      >
        <div style={{ width: 12, height: 12, background: ACCENT, flexShrink: 0 }} />
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: v ? 24 : 20,
            color: TEXT_DIM,
            whiteSpace: "nowrap",
          }}
        >
          {PROMPT}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 3 · demo ───────────────────────── */

const CAPTIONS = [
  { at: DEMO.read, text: "Primero lee tu perfil." },
  { at: DEMO.dry, text: "Con dry_run te muestra cómo queda." },
  { at: DEMO.yes, text: "Decís dale y recién ahí escribe." },
  { at: DEMO.post, text: "Y publica el avance." },
];

function LogRow({
  frame,
  at,
  done,
  name,
  args,
  status,
}: {
  frame: number;
  at: number;
  done: number;
  name: string;
  args: string;
  status: string;
}) {
  const p = ramp(frame, at, 12);
  const ok = frame >= done;
  const s = ramp(frame, done, 10);
  return (
    <div
      style={{
        height: 66,
        display: "flex",
        alignItems: "center",
        gap: 18,
        opacity: p,
        transform: `translateX(${(1 - p) * -24}px)`,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          boxSizing: "border-box",
          border: `2px solid ${ACCENT}`,
          background: ok ? ACCENT : "transparent",
          opacity: ok ? 1 : 0.35 + 0.65 * blink(frame * 2),
          flexShrink: 0,
        }}
      />
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 30, color: TEXT_STRONG }}>{name}</div>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 23, color: TEXT_MUTED, flex: 1, whiteSpace: "nowrap" }}>
        {args}
      </div>
      <Label color={ACCENT} size={19} style={{ opacity: s, transform: `translateX(${(1 - s) * 12}px)` }}>
        {status}
      </Label>
    </div>
  );
}

function ToolLog({ frame, width }: { frame: number; width: number }) {
  const p = ramp(frame, AT.demo, 16);
  const yes = ramp(frame, DEMO.yes, 10);
  return (
    <div
      style={{
        width,
        boxSizing: "border-box",
        padding: "4px 24px 8px",
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
        height: 66 * 5 + 14,
      }}
    >
      <LogRow frame={frame} at={DEMO.read} done={DEMO.read + 16} name="get_my_profile" args="" status="OK" />
      <LogRow
        frame={frame}
        at={DEMO.dry}
        done={DEMO.dry + 12}
        name="create_project"
        args="dry_run: true"
        status="Preview"
      />
      <div
        style={{
          height: 66,
          display: "flex",
          alignItems: "center",
          gap: 18,
          opacity: yes,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <Label size={19}>Vos</Label>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 30, color: TEXT_STRONG }}>
          {typed("dale", frame, DEMO.yes, DEMO.yes + 10)}
          {frame < DEMO.write ? <Caret frame={frame} size={26} steady /> : null}
        </div>
      </div>
      <LogRow
        frame={frame}
        at={DEMO.write}
        done={DEMO.write + 10}
        name="create_project"
        args={'title: "huevsite MCP"'}
        status="Guardado"
      />
      <LogRow frame={frame} at={DEMO.post} done={DEMO.post + 10} name="post_update" args="note" status="Publicado" />
    </div>
  );
}

function Block({
  p,
  children,
  style,
}: {
  p: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        boxSizing: "border-box",
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 20,
        padding: 26,
        opacity: p,
        transform: `translateY(${(1 - p) * 28}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Status({ children, live }: { children: React.ReactNode; live?: boolean }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: 16,
        letterSpacing: "0.1em",
        color: live ? ACCENT : TEXT_MUTED,
        border: `1px solid ${live ? ACCENT : BORDER_BRIGHT}`,
        borderRadius: 999,
        padding: "4px 12px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

const PANEL_W = 920;
const NEW_H = 276;

function ProfilePanel({ frame }: { frame: number }) {
  const enter = ramp(frame, AT.demo, 18);
  const loaded = DEMO.read + 16;
  const hero = ramp(frame, loaded, 16);
  const cardA = ramp(frame, loaded + 4, 16);
  const cardB = ramp(frame, loaded + 8, 16);
  const ghost = ramp(frame, DEMO.dry + 10, 16);
  const sweepIn = ramp(frame, DEMO.write, 8, INOUT);
  const sweepOut = ramp(frame, DEMO.write + 8, 14, INOUT);
  const solid = frame >= DEMO.write + 8;
  const update = ramp(frame, DEMO.post + 8, 16);
  const inner = PANEL_W - 48;

  const px = interpolate(
    frame,
    [DEMO.read, DEMO.dry - 4, DEMO.dry + 14, DEMO.post - 4, DEMO.post + 12],
    [690, 690, 742, 742, 560],
    { ...CLAMP, easing: INOUT },
  );
  const py = interpolate(
    frame,
    [DEMO.read, DEMO.dry - 4, DEMO.dry + 14, DEMO.post - 4, DEMO.post + 12],
    [150, 150, 600, 600, 742],
    { ...CLAMP, easing: INOUT },
  );
  const pointer = ramp(frame, DEMO.read, 12);

  return (
    <div
      style={{
        position: "relative",
        width: PANEL_W,
        boxSizing: "border-box",
        padding: 24,
        background: "#0A0A0B",
        border: `1px solid ${BORDER_BRIGHT}`,
        borderRadius: 10,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 80}px)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: ACCENT }} />
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, color: TEXT_DIM }}>huevsite.io/tomidelu</div>
        </div>
        <Label size={17}>Perfil público</Label>
      </div>

      <Block p={hero} style={{ marginTop: 16, height: 216, display: "flex", alignItems: "center", gap: 28 }}>
        <Img
          src={staticFile("avatars/tomidelu.jpg")}
          style={{ width: 128, height: 128, borderRadius: 64, objectFit: "cover", border: `1px solid ${BORDER_BRIGHT}` }}
        />
        <div>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 56,
              letterSpacing: TRACKING,
              lineHeight: 1,
              color: TEXT_STRONG,
            }}
          >
            Tomas Deluca
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, color: ACCENT, marginTop: 10 }}>
            Creativo Tech
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Chip>@tomidelu</Chip>
            <Chip>Buenos Aires</Chip>
          </div>
        </div>
      </Block>

      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <Block p={cardA} style={{ flex: 1, height: 200 }}>
          <ProjectHead title="Social Reps" status="LANZADO" live size={38} />
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, lineHeight: 1.4, color: TEXT_MUTED, marginTop: 16 }}>
            Earn your scroll with push ups.
          </div>
        </Block>
        <Block p={cardB} style={{ flex: 1, height: 200 }}>
          <ProjectHead title="Norte Tech" status="IDEA" size={38} />
        </Block>
      </div>

      {/* El bloque nuevo: primero preview punteado, después guardado. */}
      <div
        style={{
          position: "relative",
          marginTop: 16,
          height: NEW_H,
          opacity: ghost,
          transform: `translateY(${(1 - ghost) * 28}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxSizing: "border-box",
            borderRadius: 20,
            padding: 26,
            background: solid ? SURFACE : "transparent",
            border: `1px solid ${solid ? ACCENT : "transparent"}`,
          }}
        >
          <div style={{ opacity: solid ? 1 : 0.6 }}>
            <ProjectHead title="huevsite MCP" status="LANZADO" live size={46} />
            <div
              style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, lineHeight: 1.4, color: TEXT_DIM, marginTop: 14 }}
            >
              Editá tu huevsite desde tu agente.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Chip>Next.js</Chip>
              <Chip>Supabase</Chip>
              <Chip>MCP</Chip>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 26,
              right: 26,
              bottom: 22,
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity: update,
              transform: `translateY(${(1 - update) * 16}px)`,
              borderTop: `1px solid ${BORDER}`,
              paddingTop: 16,
            }}
          >
            <div style={{ width: 4, height: 28, background: ACCENT }} />
            <Label color={ACCENT} size={16}>
              Avance · hoy
            </Label>
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 21, color: TEXT }}>Salió el MCP de huevsite.</div>
          </div>
        </div>

        {!solid ? (
          <>
            <svg width={inner} height={NEW_H} style={{ position: "absolute", inset: 0 }}>
              <rect
                x={1.5}
                y={1.5}
                width={inner - 3}
                height={NEW_H - 3}
                rx={20}
                fill="none"
                stroke={ACCENT}
                strokeWidth={2.5}
                strokeDasharray="14 10"
                strokeDashoffset={-frame * 1.4}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                right: 22,
                bottom: 22,
                background: ACCENT,
                borderRadius: 6,
                padding: "7px 14px",
              }}
            >
              <Label color={INK} size={16}>
                Dry run · sin guardar
              </Label>
            </div>
          </>
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            background: ACCENT,
            clipPath: `inset(0 ${(1 - sweepIn) * 100}% 0 ${sweepOut * 100}% round 20px)`,
          }}
        />
      </div>

      {/* El agente. */}
      <div
        style={{
          position: "absolute",
          left: px,
          top: py,
          opacity: pointer,
          transform: `scale(${0.4 + pointer * 0.6})`,
          transformOrigin: "0 0",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <div style={{ width: 26, height: 26, background: ACCENT, opacity: 0.4 + 0.6 * blink(frame) }} />
        <div style={{ background: ACCENT, padding: "5px 10px", marginLeft: 6, marginTop: 18, borderRadius: 4 }}>
          <Label color={INK} size={16}>
            Agente
          </Label>
        </div>
      </div>
    </div>
  );
}

function ProjectHead({ title, status, live, size }: { title: string; status: string; live?: boolean; size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: TRACKING,
          lineHeight: 1,
          color: TEXT_STRONG,
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      <Status live={live}>{status}</Status>
    </div>
  );
}

function Demo({ frame, v }: Scene) {
  const colW = v ? 920 : 780;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: v ? 80 : 72, top: v ? 150 : 190, width: colW }}>
        {CAPTIONS.map((c, i) => {
          const next = CAPTIONS[i + 1]?.at ?? AT.tools + 20;
          if (frame < c.at || frame >= next) return null;
          return (
            <Words
              key={i}
              frame={frame}
              at={c.at}
              out={next - 9}
              size={v ? 80 : 68}
              text={c.text}
              accent={["dry_run", "dale"]}
              maxWidth={colW}
            />
          );
        })}
      </div>
      <div style={{ position: "absolute", left: v ? 80 : 72, top: v ? 458 : 508 }}>
        <ToolLog frame={frame} width={colW} />
      </div>
      <div style={{ position: "absolute", left: v ? 80 : 928, top: v ? 830 : 126 }}>
        <ProfilePanel frame={frame} />
      </div>
    </AbsoluteFill>
  );
}

/* ───────────────────────── 4 · tools ───────────────────────── */

const TOOL_LIST: { name: string; dry: boolean }[] = [
  { name: "get_my_profile", dry: false },
  { name: "update_profile", dry: true },
  { name: "list_my_projects", dry: false },
  { name: "create_project", dry: true },
  { name: "update_project", dry: true },
  { name: "delete_project", dry: true },
  { name: "post_update", dry: true },
  { name: "announce_launch", dry: false },
  { name: "sync_from_github", dry: false },
];

function Roll({ frame, at, size, to }: { frame: number; at: number; size: number; to: number }) {
  const p = ramp(frame, at, 28);
  return (
    <div style={{ height: size, overflow: "hidden", opacity: frame < at ? 0 : 1 }}>
      <div
        style={{
          transform: `translateY(${-p * to * size}px)`,
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: TRACKING,
          lineHeight: 1,
          color: ACCENT,
        }}
      >
        {Array.from({ length: to + 1 }, (_, n) => (
          <div key={n} style={{ height: size }}>
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function Tools({ frame, v }: Scene) {
  const big = v ? 250 : 220;
  const rowH = v ? 86 : 72;
  const two = v ? 120 : 104;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: v ? 80 : 96,
          top: v ? 150 : 170,
          display: "flex",
          alignItems: "flex-start",
          gap: big * 0.16,
        }}
      >
        <Roll frame={frame} at={AT.tools + 2} size={big} to={9} />
        <Words frame={frame} at={AT.tools + 8} size={big} text="tools" />
      </div>

      <div style={{ position: "absolute", left: v ? 80 : 1010, top: v ? 470 : 190, width: v ? 920 : 814 }}>
        {TOOL_LIST.map((tool, i) => {
          const p = ramp(frame, TOOLS.list + i * 3, 14);
          return (
            <div
              key={tool.name}
              style={{
                height: rowH,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 24,
                borderBottom: `1px solid ${BORDER}`,
                opacity: p,
                transform: `translateX(${(1 - p) * -36}px)`,
              }}
            >
              <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 20, color: TEXT_MUTED, width: 36 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: v ? 40 : 34, color: TEXT_STRONG, flex: 1 }}>
                {tool.name}
              </div>
              {tool.dry ? <Chip lime>dry_run</Chip> : null}
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: v ? 80 : 96, top: v ? 1320 : 520 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: two * 0.16 }}>
          <Roll frame={frame} at={TOOLS.prompts} size={two} to={2} />
          <Words frame={frame} at={TOOLS.prompts + 4} size={two} text="prompts" />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 36, flexDirection: v ? "row" : "column", alignItems: "flex-start" }}>
          {["armar_mi_perfil", "publicar_avance"].map((name, i) => {
            const p = ramp(frame, TOOLS.prompts + 12 + i * 5, 14);
            return (
              <div
                key={name}
                style={{
                  fontFamily: MONO,
                  fontWeight: 500,
                  fontSize: 32,
                  color: TEXT_STRONG,
                  border: `1px solid ${BORDER_BRIGHT}`,
                  background: SURFACE,
                  borderRadius: 10,
                  padding: "16px 24px",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 24}px)`,
                }}
              >
                {name}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ───────────────────────── 5 · clientes ───────────────────────── */

const CLIENTS = ["Cursor", "VS Code", "Claude", "ChatGPT"];

function Clients({ frame, v }: Scene) {
  const size = v ? 196 : 184;
  const url = typed(ENDPOINT, frame, TYPE.endpointFrom, TYPE.endpointTo);
  const box = ramp(frame, TYPE.endpointFrom - 12, 14);
  const done = frame >= TYPE.endpointTo;
  const oauth = ramp(frame, TYPE.endpointTo, 10);
  const spots = v
    ? CLIENTS.map((_, i) => ({ left: 80, top: 430 + i * 206 }))
    : [
        { left: 96, top: 290 },
        { left: 990, top: 290 },
        { left: 96, top: 500 },
        { left: 990, top: 500 },
      ];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: v ? 80 : 96, top: v ? 160 : 150 }}>
        <Words
          frame={frame}
          at={AT.clients + 2}
          size={v ? 78 : 68}
          text="Lo conectás con OAuth desde"
          color={TEXT_DIM}
          maxWidth={v ? 920 : 1700}
        />
      </div>
      {CLIENTS.map((name, i) => {
        const at = CLIENT_AT[i];
        const until = CLIENT_AT[i + 1] ?? at + 14;
        const p = ramp(frame, at, 16);
        return (
          <div key={name} style={{ position: "absolute", ...spots[i], overflow: "hidden", height: size * 1.12 }}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: size,
                letterSpacing: TRACKING,
                lineHeight: 1,
                whiteSpace: "nowrap",
                color: frame < until ? ACCENT : TEXT_STRONG,
                transform: `translateY(${(1 - p) * 118}%)`,
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: v ? 80 : 96,
          top: v ? 1330 : 780,
          opacity: box,
          transform: `translateY(${(1 - box) * 32}px)`,
        }}
      >
        <Label size={18}>Server URL</Label>
        <div
          style={{
            marginTop: 16,
            width: v ? 920 : 1000,
            height: 108,
            boxSizing: "border-box",
            padding: "0 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: SURFACE,
            border: `1px solid ${done ? ACCENT : BORDER_BRIGHT}`,
            borderRadius: 10,
          }}
        >
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: v ? 38 : 40, color: TEXT_STRONG, whiteSpace: "nowrap" }}>
            {url}
            {done ? null : <Caret frame={frame} size={36} steady />}
          </div>
          <Label color={ACCENT} size={18} style={{ opacity: oauth }}>
            OAuth
          </Label>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ───────────────────────── 6 · cierre ───────────────────────── */

const FACES = (() => {
  const files = roster.map((b) => b.avatarFile).filter((f): f is string => Boolean(f));
  const mine = "avatars/tomidelu.jpg";
  return [mine, ...files.filter((f) => f !== mine)];
})();

const TILE = 140;
const GAP = 16;

function FaceRow({
  frame,
  row,
  count,
  top,
  left = 0,
}: {
  frame: number;
  row: number;
  count: number;
  top: number;
  left?: number;
}) {
  const local = frame - AT.cta;
  const dir = row % 2 === 0 ? -1 : 1;
  const drift = dir * local * 0.6 - (dir < 0 ? 0 : (TILE + GAP) * 1.5);
  return (
    <div style={{ position: "absolute", top, left: left + drift, display: "flex", gap: GAP }}>
      {Array.from({ length: count }, (_, col) => {
        const file = FACES[(row * 7 + col) % FACES.length];
        const delay = col * 2 + row * 3;
        const p = ramp(frame, AT.cta + 2 + delay, 16);
        const on = ramp(frame, AT.cta + 26 + delay * 1.3, 12);
        return (
          <div
            key={col}
            style={{
              position: "relative",
              width: TILE,
              height: TILE,
              flexShrink: 0,
              opacity: p,
              transform: `translateY(${(1 - p) * 36}px)`,
            }}
          >
            <Img
              src={staticFile(file)}
              style={{
                width: TILE,
                height: TILE,
                objectFit: "cover",
                borderRadius: 10,
                filter: `grayscale(${1 - on}) brightness(${0.55 + on * 0.45})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: -6,
                bottom: -6,
                width: 30,
                height: 30,
                background: ACCENT,
                border: `4px solid ${BG}`,
                transform: `scale(${on})`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Cta({ frame, v }: Scene) {
  const pill = ramp(frame, AT.cta + 30, 16, INOUT);
  const rows = v ? [128, 284, 440, 1356, 1512, 1668] : [110, 266, 422, 578, 734, 890];
  return (
    <AbsoluteFill>
      {v ? (
        rows.map((top, r) => <FaceRow key={r} frame={frame} row={r} count={10} top={top} left={-40} />)
      ) : (
        <div style={{ position: "absolute", left: 1040, top: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          {rows.map((top, r) => (
            <FaceRow key={r} frame={frame} row={r} count={9} top={top} left={-40} />
          ))}
        </div>
      )}
      <div style={{ position: "absolute", left: v ? 80 : 96, top: v ? 650 : 250 }}>
        <Words frame={frame} at={AT.cta + 6} size={v ? 208 : 188} text="Agentizá" color={ACCENT} />
        <div style={{ marginTop: v ? 6 : 4 }}>
          <Words frame={frame} at={AT.cta + 12} size={v ? 150 : 136} text="tu huevsite." />
        </div>
        <div style={{ marginTop: v ? 40 : 36 }}>
          <Words frame={frame} at={AT.cta + 22} size={v ? 68 : 60} text="¿Quién se copa?" color={TEXT_DIM} />
        </div>
        <div
          style={{
            marginTop: v ? 48 : 44,
            display: "inline-block",
            background: ACCENT,
            borderRadius: 10,
            padding: v ? "26px 40px" : "24px 38px",
            clipPath: `inset(0 ${(1 - pill) * 100}% 0 0 round 10px)`,
          }}
        >
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: v ? 48 : 44, color: INK, whiteSpace: "nowrap" }}>
            huevsite.io/mcp
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ───────────────────────── película ───────────────────────── */

export function McpFilm({ layout }: { layout: Layout }) {
  const frame = useCurrentFrame();
  const v = layout === "vertical";
  const scene = { frame, v };
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Fonts />
      <Audio
        src={staticFile("audio/bed.wav")}
        volume={(f) => interpolate(f, [0, 10, DURATION - 40, DURATION - 2], [0, 0.75, 0.75, 0], CLAMP)}
      />
      <Audio src={staticFile("audio/mcp-sfx.wav")} volume={0.5} />
      <Dots frame={frame} />
      {frame < AT.prompt ? <Hook {...scene} /> : null}
      {frame >= AT.demo && frame < AT.tools ? <Demo {...scene} /> : null}
      {frame >= AT.prompt && frame < AT.tools ? <PromptCard {...scene} /> : null}
      {frame >= AT.tools && frame < AT.clients ? <Tools {...scene} /> : null}
      {frame >= AT.clients && frame < AT.cta ? <Clients {...scene} /> : null}
      {frame >= AT.cta ? <Cta {...scene} /> : null}
      <Chrome layout={layout} label="huevsite.io/mcp" />
      <Wipe frame={frame} at={AT.tools} />
      <Wipe frame={frame} at={AT.cta} />
    </AbsoluteFill>
  );
}
