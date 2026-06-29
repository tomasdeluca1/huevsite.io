import { ImageResponse } from "next/og";
import { getLaunchBadge } from "@/lib/launch-service";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Embeddable Builders Hunt badge for a launched project. The builder puts it on
// their product/portfolio to rally votes (voting requires an account → acquisition).
// Live (launch week): rocket + title + live votes + countdown. Featured (after):
// "Lanzado en Builders Hunt" (evergreen, keeps the backlink). 404 if never launched.
// ?check=1 → JSON {found,state} so the dashboard card can self-gate. Read-only,
// service-role; exposes only title/votes/week (no PII).
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

export async function GET(req: Request, { params }: { params: { blockId: string } }) {
  const url = new URL(req.url);
  const checkOnly = url.searchParams.get("check") === "1";

  let badge: Awaited<ReturnType<typeof getLaunchBadge>> = null;
  try {
    badge = await getLaunchBadge(params.blockId);
  } catch {
    badge = null;
  }

  if (checkOnly) {
    return new Response(JSON.stringify({ found: !!badge, state: badge?.state ?? null }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  if (!badge) {
    return new Response("Not launched on Builders Hunt", { status: 404 });
  }

  const live = badge.state === "live";
  const ink = "#FFFFFF";
  const lime = "#C8FF00";
  const dim = "rgba(255,255,255,0.6)";
  const tri = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11"><polygon points="6,0 12,11 0,11" fill="#C8FF00"/></svg>'
  )}`;

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

  const W = 720;
  const H = 200;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 56px",
          borderRadius: 28,
          background:
            "radial-gradient(circle at 50% 30%, rgba(200,255,0,0.12), rgba(0,0,0,0) 60%), linear-gradient(180deg, #0c0c0f, #000000)",
          fontFamily: "Bricolage, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontFamily: "JetBrainsMono, monospace", fontSize: 16, fontWeight: 700, letterSpacing: "0.18em", color: lime }}>
          🚀 {live ? "EN BUILDERS HUNT" : "LANZADO EN BUILDERS HUNT"}
        </div>
        <div style={{ display: "flex", fontSize: 46, fontWeight: 800, letterSpacing: "-0.02em", color: ink, marginTop: 6 }}>
          {truncate(badge.title, 26)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "JetBrainsMono, monospace", fontSize: 17, fontWeight: 700, color: dim, marginTop: 10 }}>
          {live ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <img src={tri} width={12} height={11} />
                <span style={{ display: "flex", color: lime }}>{badge.upvotes}</span>
              </div>
              <span style={{ display: "flex" }}>· cierra en {badge.closeDays}d · votá en huevsite.io</span>
            </>
          ) : (
            <span style={{ display: "flex", color: lime }}>huevsite.io</span>
          )}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      ...(fonts ? { fonts } : {}),
      headers: {
        "cache-control": live
          ? "public, max-age=120, s-maxage=180, stale-while-revalidate=600"
          : "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
