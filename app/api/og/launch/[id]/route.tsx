import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  ACCENT,
  BORDER,
  TEXT_DIM,
  TEXT_MUTED,
  truncate,
  safeAvatarUrl,
  OgFrame,
  Eyebrow,
  AvatarCircle,
  BrandFallback,
  fetchLaunchOg,
} from "@/lib/og/shared";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Upvote triangle as inline SVG: Satori renders the classic border-triangle
// trick as a filled rectangle, so borders are not an option here.
function Triangle({ w, h, color }: { w: number; h: number; color: string }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={`M${w / 2} 0 L${w} ${h} L0 ${h} Z`} fill={color} />
    </svg>
  );
}

// Big upvote chevron + live count — the CTA of this image is "votalo".
function UpvoteBadge({ count }: { count: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: 132,
        padding: "22px 0",
        borderRadius: 24,
        background: ACCENT,
        boxShadow: `0 0 60px ${ACCENT}66`,
      }}
    >
      <Triangle w={32} h={22} color="#0a0a0f" />
      <span style={{ fontSize: 40, fontWeight: 900, color: "#0a0a0f", display: "flex", lineHeight: 1 }}>
        {count}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 900,
          color: "#0a0a0f",
          opacity: 0.7,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        votos
      </span>
    </div>
  );
}

// OG for a shared launch (/feed?launch=<id>): the launched product's info with
// an explicit "votalo" CTA. Never 500s — falls back to the brand image.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const og = await fetchLaunchOg(params.id);
    if (!og) return new ImageResponse(<BrandFallback />, { ...OG_SIZE });

    const productImg = safeAvatarUrl(og.imageUrl, 260);

    return new ImageResponse(
      (
        <OgFrame
          eyebrow={<Eyebrow label="Builders Hunt" />}
          footer={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 22,
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 24px",
                  borderRadius: 14,
                  background: ACCENT,
                  color: "#0a0a0f",
                  fontSize: 17,
                  fontWeight: 900,
                }}
              >
                <Triangle w={16} h={11} color="#0a0a0f" />
                Entrá y votalo
              </div>
              <span
                style={{
                  color: TEXT_MUTED,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                huevsite.io/feed
              </span>
            </div>
          }
        >
          <div style={{ display: "flex", flex: 1, width: "100%", gap: 44, alignItems: "center" }}>
            {/* Left: product info */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
              <div
                style={{
                  fontSize: 58,
                  lineHeight: 1.04,
                  fontWeight: 900,
                  letterSpacing: "-0.045em",
                  display: "flex",
                  flexWrap: "wrap",
                  color: "white",
                  maxWidth: 620,
                }}
              >
                {truncate(og.title, 52)}
              </div>
              {og.description ? (
                <div
                  style={{
                    fontSize: 22,
                    lineHeight: 1.42,
                    color: TEXT_DIM,
                    display: "flex",
                    flexWrap: "wrap",
                    maxWidth: 580,
                    fontWeight: 500,
                  }}
                >
                  {truncate(og.description, 130)}
                </div>
              ) : null}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
                <AvatarCircle url={og.avatar} name={og.name} size={44} accent={ACCENT} />
                <span style={{ fontSize: 19, fontWeight: 700, color: TEXT_DIM, display: "flex" }}>
                  @{og.username}
                </span>
                <span style={{ fontSize: 15, color: TEXT_MUTED, display: "flex", fontWeight: 700 }}>
                  · lanzado esta semana
                </span>
              </div>
            </div>

            {/* Right: product image + upvote CTA */}
            <div
              style={{
                width: 340,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 22,
                padding: 28,
                borderRadius: 28,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${ACCENT}40`,
              }}
            >
              {productImg ? (
                <img
                  src={productImg}
                  width={230}
                  height={230}
                  style={{
                    width: 230,
                    height: 230,
                    borderRadius: 24,
                    objectFit: "cover",
                    border: `1px solid ${BORDER}`,
                    background: "#0a0a0f",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 230,
                    height: 230,
                    borderRadius: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}33)`,
                    color: "#0a0a0f",
                    fontSize: 96,
                    fontWeight: 900,
                  }}
                >
                  {(og.title || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <UpvoteBadge count={og.upvotes} />
            </div>
          </div>
        </OgFrame>
      ),
      { ...OG_SIZE }
    );
  } catch {
    return new ImageResponse(<BrandFallback />, { ...OG_SIZE });
  }
}
