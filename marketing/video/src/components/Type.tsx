import { Img, staticFile } from "remotion";
import { ACCENT, DISPLAY, MONO, TEXT_DIM, TEXT_MUTED, TEXT_STRONG, TRACKING } from "../brand";
import type { Layout } from "../timing";

export function Logo({ height }: { height: number }) {
  const width = Math.round(height * (983 / 240));
  return (
    <Img
      src={staticFile("logo-huevsite.png")}
      style={{ height, width, display: "block" }}
    />
  );
}

export function Chrome({
  layout,
  label,
}: {
  layout: Layout;
  label: string;
}) {
  const vertical = layout === "vertical";
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: vertical ? 108 : 88,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: vertical ? "0 64px" : "0 72px",
        boxSizing: "border-box",
      }}
    >
      <Logo height={vertical ? 40 : 34} />
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: vertical ? 16 : 15,
          color: TEXT_MUTED,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function Headline({
  children,
  size,
  color = TEXT_STRONG,
  style,
}: {
  children: React.ReactNode;
  size: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: TRACKING,
        lineHeight: 0.92,
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, color = ACCENT }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: 16,
        color,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </div>
  );
}

export function Sub({ children, size = 32 }: { children: React.ReactNode; size?: number }) {
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: TRACKING,
        lineHeight: 1.05,
        color: TEXT_DIM,
      }}
    >
      {children}
    </div>
  );
}
