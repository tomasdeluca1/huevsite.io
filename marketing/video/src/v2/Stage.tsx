import { AbsoluteFill, useVideoConfig } from "remotion";
import { ACCENT, BG, DISPLAY, MONO, TEXT_DIM, TEXT_STRONG, TRACKING } from "../brand";
import {
  builderOfTheWeek,
  countryRows,
  featuredProjects,
  launches,
  roster,
} from "../data";
import type { Shot } from "../edit";
import type { Layout } from "../timing";
import { Logo } from "../components/Type";
import { ProfileCard } from "../components/ProfileCard";
import { FlyWall, LogoAssemble } from "./Wall3D";

function typeSize(text: string, vertical: boolean) {
  if (text.length <= 12) return vertical ? 112 : 96;
  if (text.length <= 22) return vertical ? 78 : 72;
  return vertical ? 52 : 48;
}

export function Stage({
  frame,
  shot,
  layout,
}: {
  frame: number;
  shot: Shot;
  layout: Layout;
}) {
  const { width } = useVideoConfig();
  const local = frame - shot.from;
  const vertical = layout === "vertical";
  if (shot.kind === "gap") {
    return <AbsoluteFill style={{ background: BG }} />;
  }

  if (shot.kind === "cursor") {
    const on = Math.floor(local / 4) % 2 === 0;
    return (
      <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: vertical ? 28 : 24, color: "#888888" }}>
          // la red, en vivo
          <span style={{ display: "inline-block", width: 16, height: 26, marginLeft: 8, background: ACCENT, verticalAlign: "text-bottom", opacity: on ? 1 : 0 }} />
        </div>
      </AbsoluteFill>
    );
  }

  if (shot.kind === "logo") {
    return <LogoAssemble local={local} dur={shot.dur} />;
  }

  if (shot.kind === "type" && shot.text) {
    const size = typeSize(shot.text, vertical);
    const invert = shot.sound === "impact" && local === 0;
    const p = Math.min(1, local / 5);
    const scale = 1.12 - 0.12 * (1 - (1 - p) ** 3);
    return (
      <AbsoluteFill style={{ background: invert ? ACCENT : BG, alignItems: "center", justifyContent: "center", padding: vertical ? 56 : 80 }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: size,
            letterSpacing: TRACKING,
            lineHeight: 0.96,
            color: invert ? "#050505" : shot.accent ? ACCENT : TEXT_STRONG,
            textAlign: "center",
            transform: `scale(${scale})`,
            maxWidth: width - (vertical ? 112 : 160),
          }}
        >
          {shot.text}
        </div>
      </AbsoluteFill>
    );
  }

  if (shot.kind === "cluster") {
    const start = shot.index ?? 0;
    const cards = roster.slice(start, start + 4);
    const pad = vertical ? 72 : 80;
    const gap = 16;
    const cardW = (width - pad * 2 - gap) / 2;
    const cardH = vertical ? 300 : 250;
    const p = Math.min(1, local / Math.max(1, shot.dur));
    const push = shot.ramp === "in" ? p ** 3 : 1 - (1 - p) ** 3;
    const scale = 0.94 + push * 0.06;
    return (
      <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap,
            transform: `perspective(900px) rotateX(${(1 - push) * 8}deg) scale(${scale})`,
          }}
        >
          {cards.map((card) => (
            <ProfileCard key={card.username} builder={card} width={cardW} height={cardH} />
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  if (shot.kind === "hero") {
    const card = roster[shot.index ?? 0];
    return (
      <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center", padding: 64 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: (card?.name.length ?? 0) > 18 ? (vertical ? 64 : 56) : vertical ? 92 : 84, letterSpacing: TRACKING, color: TEXT_STRONG, textAlign: "center", lineHeight: 0.95, maxWidth: "100%" }}>
          {card?.name}
        </div>
        <div style={{ marginTop: 18, fontFamily: MONO, fontWeight: 500, fontSize: 28, color: ACCENT }}>
          @{card?.username}
        </div>
      </AbsoluteFill>
    );
  }

  if (shot.kind === "fly") {
    return (
      <AbsoluteFill style={{ background: BG }}>
        <FlyWall frame={frame} shot={shot} layout={layout} />
      </AbsoluteFill>
    );
  }

  if (shot.kind === "project") {
    const project = featuredProjects[shot.index ?? 0];
    if (!project) return <AbsoluteFill style={{ background: BG }} />;
    return (
      <AbsoluteFill style={{ background: BG, justifyContent: "center", padding: vertical ? "120px 64px" : "80px 120px" }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 18, color: ACCENT }}>@{project.username}</div>
        <div
          style={{
            marginTop: 12,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: vertical ? 64 : 56,
            letterSpacing: TRACKING,
            lineHeight: 0.96,
            color: TEXT_STRONG,
            maxWidth: "100%",
          }}
        >
          {project.title}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: TRACKING,
            color: TEXT_DIM,
            lineHeight: 1.25,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {project.description}
        </div>
        {project.stack[0] ? (
          <div style={{ marginTop: 22, fontFamily: MONO, fontWeight: 500, fontSize: 18, color: "#888888" }}>{project.stack.slice(0, 3).join("  ·  ")}</div>
        ) : null}
      </AbsoluteFill>
    );
  }

  if (shot.kind === "geo") {
    const row = countryRows[shot.index ?? 0];
    if (!row) return <AbsoluteFill style={{ background: BG }} />;
    return (
      <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: vertical ? 140 : 120, color: row.tone === "accent" ? ACCENT : "#4A4949", letterSpacing: "-0.04em", lineHeight: 0.9 }}>
          {row.count}
        </div>
        <div style={{ marginTop: 8, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 48 : 42, letterSpacing: TRACKING, color: TEXT_STRONG }}>
          {row.label}
        </div>
      </AbsoluteFill>
    );
  }

  if (shot.kind === "bdls") {
    return (
      <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center", padding: 64 }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 18, color: ACCENT }}>
          // builder de la semana{builderOfTheWeek.week ? ` · ${builderOfTheWeek.week}` : ""}
        </div>
        <div style={{ marginTop: 16, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 72 : 64, letterSpacing: TRACKING, color: TEXT_STRONG, textAlign: "center" }}>
          {builderOfTheWeek.name}
        </div>
        <div style={{ marginTop: 12, fontFamily: MONO, fontWeight: 500, fontSize: 24, color: "#888888" }}>@{builderOfTheWeek.username}</div>
      </AbsoluteFill>
    );
  }

  if (shot.kind === "launch") {
    const item = launches[shot.index ?? 0];
    if (!item) return <AbsoluteFill style={{ background: BG }} />;
    return (
      <AbsoluteFill style={{ background: BG, justifyContent: "center", padding: vertical ? 64 : 100 }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 20, color: ACCENT }}>▲ {item.upvoteCount}</div>
        <div style={{ marginTop: 12, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 52 : 46, letterSpacing: TRACKING, lineHeight: 0.98, color: TEXT_STRONG }}>
          {item.title}
        </div>
        <div style={{ marginTop: 14, fontFamily: MONO, fontWeight: 500, fontSize: 20, color: "#888888" }}>@{item.username}</div>
      </AbsoluteFill>
    );
  }

  if (shot.kind === "cta") {
    return (
      <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center", padding: vertical ? 56 : 80 }}>
        <Logo height={vertical ? 64 : 56} />
        <div style={{ marginTop: 36, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 52 : 48, letterSpacing: TRACKING, color: TEXT_STRONG, textAlign: "center", lineHeight: 0.95 }}>
          Sumate como
        </div>
        <div style={{ marginTop: 8, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 108 : 96, letterSpacing: TRACKING, color: TEXT_STRONG, textAlign: "center", lineHeight: 0.9 }}>
          Founder <span style={{ fontFamily: "Noto Color Emoji, sans-serif" }}>🥚</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: MONO, fontWeight: 500, fontSize: vertical ? 32 : 28, color: ACCENT, textAlign: "center" }}>
          en huevsite.io
        </div>
      </AbsoluteFill>
    );
  }

  return <AbsoluteFill style={{ background: BG }} />;
}
