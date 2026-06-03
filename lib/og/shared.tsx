/* Shared toolkit for next/og (edge) OpenGraph images.
 *
 * Primitives mirror app/opengraph-image.tsx so every page OG shares one visual
 * language. Satori (the edge renderer) can't decode webp, so remote avatars go
 * through safeAvatarUrl (re-encodes to JPEG). All data fetchers are wrapped by
 * callers in try/catch and degrade to a static layout — an OG route must never
 * 500 or social crawlers report the image as unreachable.
 *
 * JSX-returning helpers (not React components) — fine for ImageResponse.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export const ACCENT = "#C8FF00";
export const BORDER = "rgba(255,255,255,0.08)";
export const TEXT_DIM = "rgba(255,255,255,0.62)";
export const TEXT_MUTED = "rgba(255,255,255,0.40)";

export function truncate(text: string, max: number) {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

// Satori on edge doesn't decode webp. Route remote avatars through a free image
// proxy that re-encodes to jpeg at a fixed size.
export function safeAvatarUrl(src: string | null | undefined, size: number): string | null {
  if (!src || !src.startsWith("http")) return null;
  const encoded = encodeURIComponent(src);
  return `https://images.weserv.nl/?url=${encoded}&w=${size * 2}&h=${size * 2}&fit=cover&output=jpg`;
}

export function rootStyle(accent: string) {
  return {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    padding: "56px 64px",
    color: "white",
    background: `radial-gradient(circle at 14% 12%, ${accent}26 0%, transparent 42%), radial-gradient(circle at 88% 88%, ${accent}1f 0%, transparent 48%), linear-gradient(160deg, #050505 0%, #0c0c0c 55%, #0a0a0a 100%)`,
    position: "relative" as const,
  };
}

export function InnerBorder() {
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        right: 24,
        bottom: 24,
        border: `1px solid ${BORDER}`,
        borderRadius: 28,
        display: "flex",
      }}
    />
  );
}

export function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          background: ACCENT,
          display: "flex",
          boxShadow: `0 0 24px ${ACCENT}`,
        }}
      />
      <span style={{ color: "white", fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", display: "flex" }}>
        huevsite.io
      </span>
    </div>
  );
}

export function Eyebrow({ label, accent = ACCENT }: { label: string; accent?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 18px",
        borderRadius: 999,
        background: `${accent}1f`,
        border: `1px solid ${accent}66`,
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 999, background: accent, display: "flex", boxShadow: `0 0 14px ${accent}` }} />
      <span
        style={{
          color: accent,
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function AvatarCircle({
  url,
  name,
  size: avatarSize,
  accent,
}: {
  url: string | null | undefined;
  name: string;
  size: number;
  accent: string;
}) {
  const proxied = safeAvatarUrl(url, avatarSize);
  if (proxied) {
    return (
      <img
        src={proxied}
        width={avatarSize}
        height={avatarSize}
        style={{ width: avatarSize, height: avatarSize, borderRadius: 999, objectFit: "cover", border: `4px solid ${accent}` }}
      />
    );
  }
  return (
    <div
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}aa 100%)`,
        color: "black",
        fontSize: Math.round(avatarSize * 0.42),
        fontWeight: 900,
        border: `4px solid ${accent}`,
      }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export function FooterCTA({
  cta = "Empezá gratis",
  hint = "huevsite.io/tuusuario",
  accent = ACCENT,
}: {
  cta?: string;
  hint?: string;
  accent?: string;
}) {
  return (
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
          padding: "12px 22px",
          borderRadius: 14,
          background: accent,
          color: "black",
          fontSize: 16,
          fontWeight: 900,
          letterSpacing: "-0.01em",
        }}
      >
        {cta}
      </div>
      <span
        style={{
          color: TEXT_MUTED,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        {hint}
      </span>
    </div>
  );
}

export function OgFrame({
  accent = ACCENT,
  eyebrow,
  footer,
  children,
}: {
  accent?: string;
  eyebrow?: any;
  footer?: any;
  children: any;
}) {
  return (
    <div style={rootStyle(accent)}>
      <InnerBorder />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark />
        {eyebrow ?? null}
      </div>
      <div style={{ display: "flex", flex: 1, width: "100%", marginTop: 32 }}>{children}</div>
      {footer ?? null}
    </div>
  );
}

// Full-width hero body: big headline + subtitle (for static / single-column OGs).
export function HeroBody({ headline, sub }: { headline: string; sub: string }) {
  return (
    <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, maxWidth: 1000 }}>
      <div
        style={{
          fontSize: 76,
          lineHeight: 1.02,
          fontWeight: 900,
          letterSpacing: "-0.05em",
          display: "flex",
          flexWrap: "wrap",
          color: "white",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          fontSize: 24,
          lineHeight: 1.4,
          color: TEXT_DIM,
          display: "flex",
          flexWrap: "wrap",
          maxWidth: 760,
          fontWeight: 500,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

// Two-column body: copy on the left, an arbitrary visual on the right.
export function SplitBody({ headline, sub, right }: { headline: string; sub: string; right: any }) {
  return (
    <div style={{ display: "flex", flex: 1, width: "100%", gap: 44, alignItems: "center" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        <div
          style={{
            fontSize: 58,
            lineHeight: 1.05,
            fontWeight: 900,
            letterSpacing: "-0.045em",
            display: "flex",
            flexWrap: "wrap",
            color: "white",
            maxWidth: 560,
          }}
        >
          {headline}
        </div>
        <div
          style={{ fontSize: 21, lineHeight: 1.42, color: TEXT_DIM, display: "flex", flexWrap: "wrap", maxWidth: 540, fontWeight: 500 }}
        >
          {sub}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ---------- Data (service-role REST; callers wrap in try/catch) ---------- */

export type Winner = {
  username: string;
  name: string | null;
  image: string | null;
  tagline: string | null;
  accent_color: string | null;
};

export type TopBuilder = {
  username: string;
  name: string | null;
  image: string | null;
  builder_score: number | null;
  accent_color: string | null;
};

function restCreds() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) return null;
  return { baseUrl, headers: { apikey: key, Authorization: `Bearer ${key}` } as Record<string, string> };
}

export async function fetchCurrentWinner(): Promise<Winner | null> {
  const c = restCreds();
  if (!c) return null;
  const url = `${c.baseUrl}/rest/v1/showcase_winners?select=user:profiles!showcase_winners_user_id_fkey(username,name,image,tagline,accent_color)&order=week.desc&limit=1`;
  try {
    const res = await fetch(url, { headers: c.headers, cache: "no-store" });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ user: Winner | null }>;
    return rows[0]?.user ?? null;
  } catch {
    return null;
  }
}

export async function fetchTopBuilders(n: number): Promise<TopBuilder[]> {
  const c = restCreds();
  if (!c) return [];
  const url = `${c.baseUrl}/rest/v1/profiles_explore?select=username,name,image,builder_score,accent_color&order=builder_score.desc&limit=${n}`;
  try {
    const res = await fetch(url, { headers: c.headers, cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as TopBuilder[];
  } catch {
    return [];
  }
}

export async function countBuilders(): Promise<number | null> {
  const c = restCreds();
  if (!c) return null;
  const url = `${c.baseUrl}/rest/v1/profiles?select=id&username=not.is.null`;
  try {
    const res = await fetch(url, {
      headers: { ...c.headers, Prefer: "count=exact", Range: "0-0" },
      cache: "no-store",
    });
    const cr = res.headers.get("content-range"); // "0-0/1234"
    if (!cr) return null;
    const total = parseInt(cr.split("/")[1], 10);
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}
