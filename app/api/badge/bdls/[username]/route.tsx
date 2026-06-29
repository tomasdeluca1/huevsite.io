import { ImageResponse } from "next/og";
import { profileService } from "@/lib/profile-service";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Embeddable "Builder de la Semana" badge (transparent PNG) for any builder who
// has EVER won the weekly showcase. The laurel wreath is a designed asset in
// /public/badge (light = slate, dark = lime); the text is composited here so it
// stays crisp and on-brand. ?theme=dark for dark backgrounds (default light).
export async function GET(req: Request, { params }: { params: { username: string } }) {
  const url = new URL(req.url);
  const username = (params.username || "").toLowerCase();
  const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";
  const checkOnly = url.searchParams.get("check") === "1";

  let everWon = false;
  try {
    const profile = await profileService.getProfile(username);
    everWon = !!profile?.badges?.some((b: any) => b.key === "builder_of_the_week");
  } catch {
    everWon = false;
  }

  // Lightweight winner check (no image) so the dashboard card can self-gate.
  if (checkOnly) {
    return new Response(JSON.stringify({ winner: everWon }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  if (!everWon) {
    return new Response("Not a Builder de la Semana", { status: 404 });
  }

  const ink = theme === "dark" ? "#FFFFFF" : "#3D4A6B";
  const sub = theme === "dark" ? "#C8FF00" : "#6B7894";
  const wreath = new URL(`/badge/laurel-${theme}.png`, req.url).toString();

  const W = 680;
  const H = 372;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          fontFamily: "sans-serif",
        }}
      >
        <img src={wreath} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H }} />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: ink, lineHeight: 1.1, display: "flex" }}>
            Builder de la
          </div>
          <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-0.02em", color: ink, lineHeight: 1.02, display: "flex" }}>
            Semana
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: sub, marginTop: 6, display: "flex" }}>
            huevsite.io
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
