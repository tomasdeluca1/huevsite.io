import { Img, staticFile } from "remotion";
import { ACCENT, BORDER, DISPLAY, MONO, SURFACE, SURFACE2, TEXT_DIM, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import type { BuilderCard } from "../data";

export function Avatar({
  file,
  name,
  size,
}: {
  file: string | null;
  name: string;
  size: number;
}) {
  const letter = (name || "?").replace(/^@/, "").charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        overflow: "hidden",
        background: SURFACE2,
        border: `1px solid ${BORDER}`,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: size * 0.38,
        letterSpacing: TRACKING,
        color: TEXT_STRONG,
      }}
    >
      {file ? (
        <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        letter
      )}
    </div>
  );
}

export function ProfileCard({
  builder,
  width,
  height,
}: {
  builder: BuilderCard;
  width: number;
  height: number;
}) {
  const compact = height < 140;
  return (
    <div
      style={{
        width,
        height,
        boxSizing: "border-box",
        background: SURFACE,
        border: `1px solid ${builder.isWinner ? ACCENT : BORDER}`,
        borderRadius: 14,
        padding: compact ? 12 : 16,
        display: "flex",
        gap: compact ? 10 : 14,
        overflow: "hidden",
      }}
    >
      <Avatar file={builder.avatarFile} name={builder.name} size={compact ? 48 : 64} />
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: compact ? 20 : 24,
              letterSpacing: TRACKING,
              color: TEXT_STRONG,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1,
            }}
          >
            {builder.name}
          </div>
          {builder.country ? (
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 12, color: TEXT_MUTED, flexShrink: 0 }}>
              {builder.country}
            </div>
          ) : null}
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: compact ? 13 : 14, color: ACCENT, marginTop: 6 }}>
          @{builder.username}
        </div>
        {builder.tagline ? (
          <div
            style={{
              marginTop: compact ? 8 : 12,
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: compact ? 14 : 16,
              letterSpacing: TRACKING,
              color: TEXT_DIM,
              lineHeight: 1.25,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {builder.tagline}
          </div>
        ) : builder.location ? (
          <div style={{ marginTop: 10, fontFamily: MONO, fontWeight: 500, fontSize: 13, color: TEXT_MUTED }}>
            {builder.location}
          </div>
        ) : null}
      </div>
    </div>
  );
}
