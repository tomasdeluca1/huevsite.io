import { AbsoluteFill } from "remotion";
import { ACCENT, BG, BORDER, DISPLAY, MONO, SURFACE, TEXT_DIM, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import { builderOfTheWeek, launches, launchWeek, winnerTrail } from "../data";
import { useRise } from "../motion";
import { Avatar } from "../components/ProfileCard";
import { Chrome } from "../components/Type";
import type { Layout } from "../timing";

export function Hunt({ layout }: { layout: Layout }) {
  const vertical = layout === "vertical";
  const title = useRise(6, 22);
  const winner = useRise(16, 18);
  const trail = useRise(28, 14);
  const feed = useRise(40, 16);

  const phrase = (
    <div style={title}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: vertical ? 68 : 52,
          letterSpacing: TRACKING,
          lineHeight: 0.94,
          color: TEXT_STRONG,
        }}
      >
        Se rankean.
        <br />
        Se descubren.
        <br />
        Se nominan.
      </div>
    </div>
  );

  const winnerCard = (
    <div style={{ ...winner, background: SURFACE, border: `1px solid ${ACCENT}`, borderRadius: 14, padding: vertical ? 22 : 20, display: "flex", gap: 16, alignItems: "center" }}>
      <Avatar file={builderOfTheWeek.avatarFile} name={builderOfTheWeek.name} size={vertical ? 84 : 72} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, color: ACCENT }}>
          // builder de la semana{builderOfTheWeek.week ? ` · ${builderOfTheWeek.week}` : ""}
        </div>
        <div style={{ marginTop: 6, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 32 : 28, letterSpacing: TRACKING, color: TEXT_STRONG, lineHeight: 1 }}>
          {builderOfTheWeek.name}
        </div>
        <div style={{ marginTop: 6, fontFamily: MONO, fontWeight: 500, fontSize: 14, color: TEXT_MUTED }}>
          @{builderOfTheWeek.username}
        </div>
      </div>
    </div>
  );

  const trailBlock = (
    <div style={{ ...trail, display: "flex", flexDirection: "column", gap: 8 }}>
      {winnerTrail.map((w) => (
        <div key={w.username} style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
          <div style={{ width: 92, fontFamily: MONO, fontWeight: 500, fontSize: 13, color: TEXT_MUTED }}>{w.week}</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 18, letterSpacing: TRACKING, color: TEXT_DIM }}>{w.name}</div>
        </div>
      ))}
    </div>
  );

  const feedBlock = (
    <div style={feed}>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 14, color: TEXT_MUTED }}>
        // builders hunt{launchWeek ? ` · ${launchWeek}` : ""}
      </div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {launches.map((item) => (
          <div
            key={item.title}
            style={{
              borderTop: `1px solid ${BORDER}`,
              paddingTop: 10,
              display: "flex",
              gap: 16,
              alignItems: "baseline",
            }}
          >
            <div style={{ width: 48, fontFamily: MONO, fontWeight: 500, fontSize: 16, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>
              ▲{item.upvoteCount}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 800,
                  fontSize: vertical ? 22 : 20,
                  letterSpacing: TRACKING,
                  color: TEXT_STRONG,
                  lineHeight: 1.1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {item.title}
              </div>
              <div style={{ marginTop: 4, fontFamily: MONO, fontWeight: 500, fontSize: 13, color: TEXT_MUTED }}>
                @{item.username}
                {item.stack.length ? ` · ${item.stack.slice(0, 2).join(" · ")}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Chrome layout={layout} label="// la comunidad" />
      {vertical ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "130px 64px 72px" }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 28 }}>
            {phrase}
            {winnerCard}
            {trailBlock}
            {feedBlock}
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", top: 120, left: 72, right: 72, bottom: 40, display: "flex", gap: 56 }}>
          <div style={{ width: 620, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
            {phrase}
            {winnerCard}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
            {trailBlock}
            {feedBlock}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
