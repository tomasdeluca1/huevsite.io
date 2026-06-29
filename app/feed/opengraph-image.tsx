import { ImageResponse } from "next/og";
import {
  OG_SIZE, OG_CONTENT_TYPE, ACCENT, BORDER, TEXT_FAINT,
  OgFrame, Eyebrow, SplitBody, FooterCTA,
} from "@/lib/og/shared";

export const runtime = "edge";
export const alt = "Builders Hunt — lo que se lanza esta semana en huevsite.io";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Upvote chevron + count pill — the Builders Hunt signature, drawn with borders
// so it never depends on an emoji/glyph font.
function UpvotePill({ rank }: { rank: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        width: 52,
        padding: "10px 0",
        borderRadius: 14,
        background: rank === 1 ? ACCENT : "rgba(255,255,255,0.06)",
        border: rank === 1 ? "none" : `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: `11px solid ${rank === 1 ? "#0a0a0f" : "white"}`,
          display: "flex",
        }}
      />
      <span style={{ fontSize: 15, fontWeight: 900, color: rank === 1 ? "#0a0a0f" : "white", display: "flex" }}>
        {rank === 1 ? "128" : rank === 2 ? "94" : "57"}
      </span>
    </div>
  );
}

function LaunchRow({ rank }: { rank: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ width: 22, fontSize: 22, fontWeight: 900, color: TEXT_FAINT, display: "flex" }}>{rank}</span>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          display: "flex",
          background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}44)`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
        <div style={{ width: rank === 1 ? 168 : 132, height: 13, borderRadius: 999, background: "rgba(255,255,255,0.5)", display: "flex" }} />
        <div style={{ width: 200, height: 9, borderRadius: 999, background: "rgba(255,255,255,0.16)", display: "flex" }} />
      </div>
      <UpvotePill rank={rank} />
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    <OgFrame
      eyebrow={<Eyebrow label="Builders Hunt" />}
      footer={<FooterCTA cta="Ver Builders Hunt" hint="huevsite.io/feed" />}
    >
      <SplitBody
        headline="Lo que se lanza esta semana."
        sub="Cada semana los builders presentan lo que shippearon. Votá los mejores, descubrí proyectos y lanzá el tuyo."
        right={
          <div
            style={{
              width: 440,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 22,
              padding: 28,
              borderRadius: 28,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${ACCENT}40`,
            }}
          >
            <LaunchRow rank={1} />
            <LaunchRow rank={2} />
            <LaunchRow rank={3} />
          </div>
        }
      />
    </OgFrame>,
    { ...size }
  );
}
