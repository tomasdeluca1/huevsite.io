import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../motion";
import { ACCENT, BG, BORDER, DISPLAY, MONO, SURFACE, TEXT_DIM, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import { featuredProjects, statusLabel, type Project } from "../data";
import { useRise } from "../motion";
import { Avatar } from "../components/ProfileCard";
import { Chrome } from "../components/Type";
import type { Layout } from "../timing";

function ProjectCard({ project, compact }: { project: Project; compact?: boolean }) {
  const status = statusLabel(project.status);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: compact ? "16px 18px" : "22px 24px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: compact ? 28 : 32,
            letterSpacing: TRACKING,
            lineHeight: 0.98,
            color: TEXT_STRONG,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {project.title}
        </div>
        {status ? (
          <div style={{ flexShrink: 0, fontFamily: MONO, fontWeight: 500, fontSize: 13, color: status.live ? ACCENT : TEXT_MUTED }}>
            {status.text}
          </div>
        ) : null}
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: compact ? 16 : 18,
          letterSpacing: TRACKING,
          lineHeight: 1.3,
          color: TEXT_DIM,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        {project.description}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar file={project.avatarFile} name={project.name} size={28} />
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 14, color: ACCENT, whiteSpace: "nowrap" }}>
          @{project.username}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, minWidth: 0, justifyContent: "flex-end", overflow: "hidden" }}>
          {project.stack.slice(0, compact ? 2 : 3).map((tech) => (
            <span
              key={tech}
              style={{
                fontFamily: MONO,
                fontWeight: 500,
                fontSize: 12,
                color: TEXT_MUTED,
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
                padding: "4px 8px",
                whiteSpace: "nowrap",
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Projects({ layout }: { layout: Layout }) {
  const frame = useCurrentFrame();
  const vertical = layout === "vertical";
  const per = vertical ? 2 : 4;
  const sets: Project[][] = [];
  for (let i = 0; i < featuredProjects.length; i += per) sets.push(featuredProjects.slice(i, i + per));
  const safeSets = sets.length ? sets : [[]];
  const setDur = Math.max(1, Math.floor(300 / safeSets.length));
  const setIndex = Math.min(safeSets.length - 1, Math.floor(frame / setDur));
  const local = frame - setIndex * setDur;
  const slideFrames = 16;
  const isLast = setIndex === safeSets.length - 1;
  const swap = !isLast && local >= setDur - slideFrames
    ? interpolate(local, [setDur - slideFrames, setDur], [0, 1], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const line1 = useRise(0, 18);
  const line2 = useRise(4, 14);
  const current = safeSets[setIndex] || [];
  const upcoming = swap > 0 ? safeSets[setIndex + 1] || [] : [];

  const phrase = (
    <div>
      <div style={line1}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 72 : 58, letterSpacing: TRACKING, lineHeight: 0.92, color: TEXT_STRONG }}>
          No digas que sos builder.
        </div>
      </div>
      <div style={{ marginTop: 14, ...line2 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 44 : 36, letterSpacing: TRACKING, color: ACCENT }}>
          Probalo.
        </div>
      </div>
    </div>
  );

  const deckStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
  };
  const outgoingShift = interpolate(swap, [0, 1], [0, -56]);
  const incomingShift = interpolate(swap, [0, 1], [56, 0]);

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Chrome layout={layout} label="// lo que shippean" />
      {vertical ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "140px 64px 80px" }}>
          <div style={{ width: "100%" }}>
            {phrase}
            <div style={{ marginTop: 36, ...deckStyle }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, transform: `translateY(${outgoingShift}px)` }}>
                {current.map((project) => (
                  <div key={project.username + project.title} style={{ height: 340 }}>
                    <ProjectCard project={project} />
                  </div>
                ))}
              </div>
              {upcoming.length > 0 ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 16, transform: `translateY(${incomingShift}px)` }}>
                  {upcoming.map((project) => (
                    <div key={project.username + project.title} style={{ height: 340 }}>
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", top: 120, left: 72, right: 72, bottom: 48, display: "flex", gap: 48 }}>
          <div style={{ width: 520, flexShrink: 0, display: "flex", alignItems: "center" }}>{phrase}</div>
          <div style={{ flex: 1, ...deckStyle }}>
            <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 14, transform: `translateY(${outgoingShift}px)` }}>
              {current.map((project) => (
                <ProjectCard key={project.username + project.title} project={project} compact />
              ))}
            </div>
            {upcoming.length > 0 ? (
              <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 14, transform: `translateY(${incomingShift}px)` }}>
                {upcoming.map((project) => (
                  <ProjectCard key={project.username + project.title} project={project} compact />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
