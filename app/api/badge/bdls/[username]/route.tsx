import { ImageResponse } from "next/og";
import { profileService } from "@/lib/profile-service";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Embeddable "Builder de la Semana" badge (transparent PNG). Designed laurel
// halves in /public/badge flank the title on one line, in huevsite's own fonts
// (Bricolage Grotesque title + JetBrains Mono wordmark). ?theme=dark for dark
// backgrounds (default light). Validates the user ever won the weekly showcase.
export async function GET(req: Request, { params }: { params: { username: string } }) {
  const url = new URL(req.url);
  const username = (params.username || "").toLowerCase();
  const theme = url.searchParams.get("theme") === "light" ? "light" : "dark";
  const checkOnly = url.searchParams.get("check") === "1";

  let everWon = false;
  try {
    const profile = await profileService.getProfile(username);
    everWon = !!profile?.badges?.some((b: any) => b.key === "builder_of_the_week");
  } catch {
    everWon = false;
  }

  if (checkOnly) {
    return new Response(JSON.stringify({ winner: everWon }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  if (!everWon) {
    return new Response("Not a Builder de la Semana", { status: 404 });
  }

  // Branded dark card: black bg + subtle lime glow + lime laurels. (theme=light
  // keeps a transparent slate version for light portfolios.)
  const dark = theme !== "light";
  const ink = dark ? "#FFFFFF" : "#3D4A6B";
  const sub = dark ? "#C8FF00" : "#6B7894";
  const lkey = dark ? "dark" : "light";
  const leftUrl = new URL(`/badge/laurel-${lkey}-left.png`, req.url).toString();
  const rightUrl = new URL(`/badge/laurel-${lkey}-right.png`, req.url).toString();
  const bg = dark
    ? "radial-gradient(circle at 50% 45%, rgba(200,255,0,0.10), rgba(0,0,0,0) 62%), linear-gradient(180deg, #0c0c0f, #000000)"
    : "transparent";

  // Brand fonts (same-origin, bundled in /public/fonts). Degrade to the default
  // sans if the fetch ever fails so the badge still renders.
  let fonts: any[] | undefined;
  try {
    const [display, mono] = await Promise.all([
      fetch(new URL("/fonts/Bricolage-800.ttf", req.url)).then((r) => r.arrayBuffer()),
      fetch(new URL("/fonts/JetBrainsMono-700.ttf", req.url)).then((r) => r.arrayBuffer()),
    ]);
    fonts = [
      { name: "Bricolage", data: display, weight: 800, style: "normal" },
      { name: "JetBrainsMono", data: mono, weight: 700, style: "normal" },
    ];
  } catch {
    fonts = undefined;
  }

  const W = 760;
  const H = 220;
  const lH = 180;
  const lW = theme === "dark" ? 160 : 165;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          background: bg,
          borderRadius: 28,
          fontFamily: "Bricolage, sans-serif",
        }}
      >
        <img src={leftUrl} width={lW} height={lH} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: "Bricolage, sans-serif",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: ink,
              whiteSpace: "nowrap",
              display: "flex",
            }}
          >
            Builder de la Semana
          </div>
          <div
            style={{
              fontFamily: "JetBrainsMono, monospace",
              fontSize: 16,
              fontWeight: 700,
              color: sub,
              marginTop: 8,
              display: "flex",
            }}
          >
            huevsite.io
          </div>
        </div>
        <img src={rightUrl} width={lW} height={lH} />
      </div>
    ),
    {
      width: W,
      height: H,
      ...(fonts ? { fonts } : {}),
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
