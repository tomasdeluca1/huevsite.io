import { ImageResponse } from "next/og";
import { profileService } from "@/lib/profile-service";
import { laurelDataUri } from "@/lib/og/laurel";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Embeddable "Builder de la Semana" badge (laurel, transparent PNG) for any
// builder who has EVER won the weekly showcase. Winners drop the <img> on their
// own portfolio; it links back to their huevsite profile. ?theme=dark flips the
// colors for dark backgrounds (default light, like the Product-Hunt reference).
export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
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

  // Lightweight winner check (no image) for the dashboard snippet card to self-gate.
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
  const leaf = theme === "dark" ? "#C8FF00" : "#3D4A6B";
  const sub = theme === "dark" ? "#C8FF00" : "#6B7894";

  const W = 600;
  const H = 240;
  const laurelW = 110;
  const laurelH = 210;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          fontFamily: "sans-serif",
        }}
      >
        <img src={laurelDataUri({ color: leaf, side: "left", width: laurelW, height: laurelH })} width={laurelW} height={laurelH} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 -10px",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: ink, lineHeight: 1.1, display: "flex" }}>
            Builder de la
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.02em", color: ink, lineHeight: 1.05, display: "flex" }}>
            Semana
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: sub, marginTop: 8, display: "flex" }}>
            huevsite.io
          </div>
        </div>
        <img src={laurelDataUri({ color: leaf, side: "right", width: laurelW, height: laurelH })} width={laurelW} height={laurelH} />
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        // Winner status changes rarely; let browsers/CDN cache the embed.
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
