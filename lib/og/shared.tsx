/* Shared toolkit for next/og (edge) OpenGraph images.
 *
 * Single source of visual language for every social-share image on huevsite —
 * home, profile, blog, leaderboard, explore, feed/Builders Hunt, etc. Every
 * page OG composes these primitives so the whole discovery family reads as one
 * brand: dark base, lime (#C8FF00) accent, the real wordmark (huev + lime site +
 * dim .io), a hairline inner frame and a faint dot grid.
 *
 * Hardening rules baked in here:
 *  - Satori (the edge renderer) can't decode webp/avif, so every remote avatar
 *    goes through safeAvatarUrl, which re-encodes to JPEG at a fixed size via a
 *    proxy. AvatarCircle falls back to a monogram when there's no usable URL, so
 *    a missing/foreign-host avatar never produces a broken image.
 *  - All data fetchers swallow errors and return null/[] — an OG route must
 *    never 500 or social crawlers report the image as unreachable. Callers
 *    additionally wrap render in try/catch and fall back to BrandFallback.
 *  - No custom font fetch: we ride Satori's bundled sans so a font-CDN hiccup
 *    can't break the image.
 *
 * JSX-returning helpers (not React components) — fine for ImageResponse.
 */

import { getContrastColor } from "@/lib/profile-types";
import { hiResFaviconUrl } from "@/lib/favicon";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export const ACCENT = "#C8FF00";
export const BG_TOP = "#07070b";
export const BG_BOTTOM = "#0a0a0f";
export const BORDER = "rgba(255,255,255,0.08)";
export const TEXT_DIM = "rgba(255,255,255,0.64)";
export const TEXT_MUTED = "rgba(255,255,255,0.42)";
export const TEXT_FAINT = "rgba(255,255,255,0.30)";

export function truncate(text: string, max: number) {
  if (!text) return "";
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

// Satori on edge doesn't decode webp/avif. Route remote avatars through a free
// image proxy that re-encodes to jpeg at a fixed size, with width/height pinned
// so Satori never has to probe the image dimensions.
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
    padding: "54px 64px",
    color: "white",
    background: `radial-gradient(circle at 12% 8%, ${accent}24 0%, transparent 40%), radial-gradient(circle at 90% 96%, ${accent}1a 0%, transparent 46%), linear-gradient(155deg, ${BG_TOP} 0%, ${BG_BOTTOM} 58%, #07070a 100%)`,
    position: "relative" as const,
  };
}

// Faint technical dot grid — gives the dark base texture without competing with
// the content. Rendered as its own absolutely-positioned layer so it never
// fights the radial glows in the `background` shorthand.
export function Texture() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.05) 1.4px, transparent 1.4px)",
        backgroundSize: "34px 34px",
      }}
    />
  );
}

export function InnerBorder() {
  return (
    <div
      style={{
        position: "absolute",
        top: 22,
        left: 22,
        right: 22,
        bottom: 22,
        border: `1px solid ${BORDER}`,
        borderRadius: 30,
        display: "flex",
      }}
    />
  );
}

export function Wordmark({ accent = ACCENT, size = 30 }: { accent?: string; size?: number } = {}) {
  // Mirrors the live site logo (.logo span { color: var(--accent) }): "huev" +
  // "site" (accent) + ".io" (dim). "site" carries the page accent so the
  // wordmark belongs to the same palette as the rest of the image.
  const base = { fontSize: size, fontWeight: 900, letterSpacing: "-0.045em" };
  return (
    <div style={{ display: "flex", alignItems: "baseline" }}>
      <span style={{ ...base, color: "white" }}>huev</span>
      <span style={{ ...base, color: accent }}>site</span>
      <span style={{ ...base, color: "white", opacity: 0.4 }}>.io</span>
    </div>
  );
}

export function Eyebrow({ label, accent = ACCENT }: { label: string; accent?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "9px 16px 9px 14px",
        borderRadius: 999,
        background: `${accent}1c`,
        border: `1px solid ${accent}59`,
      }}
    >
      <div style={{ width: 9, height: 9, borderRadius: 999, background: accent, display: "flex", boxShadow: `0 0 14px ${accent}` }} />
      <span
        style={{
          color: accent,
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: "0.2em",
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
  radius,
}: {
  url: string | null | undefined;
  name: string;
  size: number;
  accent: string;
  radius?: number;
}) {
  const r = radius ?? 999;
  const proxied = safeAvatarUrl(url, avatarSize);
  if (proxied) {
    return (
      <img
        src={proxied}
        width={avatarSize}
        height={avatarSize}
        style={{ width: avatarSize, height: avatarSize, borderRadius: r, objectFit: "cover", border: `4px solid ${accent}` }}
      />
    );
  }
  return (
    <div
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: r,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}aa 100%)`,
        color: getContrastColor(accent),
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
          padding: "13px 24px",
          borderRadius: 14,
          background: accent,
          color: getContrastColor(accent),
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
          letterSpacing: "0.2em",
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
      <Texture />
      <InnerBorder />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <Wordmark accent={accent} />
        {eyebrow ?? null}
      </div>
      <div style={{ display: "flex", flex: 1, width: "100%", marginTop: 30, position: "relative", zIndex: 1 }}>{children}</div>
      {footer ? <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>{footer}</div> : null}
    </div>
  );
}

// Full-width hero body: big headline + subtitle (for static / single-column OGs).
export function HeroBody({ headline, sub }: { headline: string; sub: string }) {
  return (
    <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, maxWidth: 1010 }}>
      <div
        style={{
          fontSize: 78,
          lineHeight: 1.0,
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
          fontSize: 25,
          lineHeight: 1.4,
          color: TEXT_DIM,
          display: "flex",
          flexWrap: "wrap",
          maxWidth: 800,
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
            fontSize: 60,
            lineHeight: 1.02,
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
          style={{ fontSize: 22, lineHeight: 1.42, color: TEXT_DIM, display: "flex", flexWrap: "wrap", maxWidth: 540, fontWeight: 500 }}
        >
          {sub}
        </div>
      </div>
      {right}
    </div>
  );
}

// Glass card used for the right-hand panel in split layouts (winner, ranking…).
export function Card({ accent = ACCENT, width, children }: { accent?: string; width: number; children: any }) {
  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 28,
        borderRadius: 28,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${accent}40`,
        gap: 18,
      }}
    >
      {children}
    </div>
  );
}

// Last-resort branded image for dynamic API OG routes: any unrecoverable error
// (DB down, bad data, proxy hiccup) renders this instead of a 500/blank, so a
// shared link never previews as broken.
export function BrandFallback({ accent = ACCENT, label }: { accent?: string; label?: string } = {}) {
  return (
    <div style={rootStyle(accent)}>
      <Texture />
      <InnerBorder />
      <div style={{ display: "flex", position: "relative", zIndex: 1 }}>
        <Wordmark accent={accent} />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 22,
          position: "relative",
          zIndex: 1,
          maxWidth: 920,
        }}
      >
        <div
          style={{
            fontSize: 74,
            lineHeight: 1.02,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            display: "flex",
            flexWrap: "wrap",
            color: "white",
          }}
        >
          Construí tu reputación como builder.
        </div>
        <div style={{ fontSize: 25, lineHeight: 1.4, color: TEXT_DIM, display: "flex", flexWrap: "wrap", maxWidth: 820, fontWeight: 500 }}>
          {label || "Proyectos, métricas reales y endorsements. Que te vean shippeando, no diciendo."}
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 1, display: "flex" }}>
        <FooterCTA cta="Empezá gratis" hint="huevsite.io" accent={accent} />
      </div>
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

export type RecentWinner = { week: string; user: Winner };

/** The last N Builders de la Semana (most recent first) — for the hall-of-fame OG. */
export async function fetchRecentWinners(n: number): Promise<RecentWinner[]> {
  const c = restCreds();
  if (!c) return [];
  const url = `${c.baseUrl}/rest/v1/showcase_winners?select=week,user:profiles!showcase_winners_user_id_fkey(username,name,image,tagline,accent_color)&order=week.desc&limit=${n}`;
  try {
    const res = await fetch(url, { headers: c.headers, cache: "no-store" });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ week: string; user: Winner | null }>;
    return rows.filter((r) => r.user).map((r) => ({ week: r.week, user: r.user as Winner }));
  } catch {
    return [];
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

export type LaunchOg = {
  title: string;
  description: string;
  imageUrl: string | null;
  upvotes: number;
  week: string;
  username: string;
  name: string;
  avatar: string | null;
};

/** Data for the shared-launch OG (/feed?launch=<id>). UUID is validated before
 *  it touches the PostgREST filter (same injection concern as sanitizeOrFilterValue). */
export async function fetchLaunchOg(launchId: string): Promise<LaunchOg | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(launchId)) return null;
  const c = restCreds();
  if (!c) return null;
  try {
    const lRes = await fetch(
      `${c.baseUrl}/rest/v1/project_launches?id=eq.${launchId}&select=upvote_count,launch_week,user_id,block_id&limit=1`,
      { headers: c.headers, cache: "no-store" }
    );
    if (!lRes.ok) return null;
    const [launch] = (await lRes.json()) as any[];
    if (!launch) return null;

    const [bRes, pRes] = await Promise.all([
      fetch(`${c.baseUrl}/rest/v1/blocks?id=eq.${launch.block_id}&select=data&limit=1`, {
        headers: c.headers,
        cache: "no-store",
      }),
      fetch(`${c.baseUrl}/rest/v1/profiles?id=eq.${launch.user_id}&select=username,name,image&limit=1`, {
        headers: c.headers,
        cache: "no-store",
      }),
    ]);
    const [block] = bRes.ok ? ((await bRes.json()) as any[]) : [];
    const [prof] = pRes.ok ? ((await pRes.json()) as any[]) : [];
    if (!block || !prof) return null;
    const d = block.data || {};

    // Mirrors launch-service: favicon-mode projects use the hi-res favicon.
    const imageUrl: string | null =
      d.imageMode === "favicon" ? hiResFaviconUrl(d.link, d.faviconUrl) || null : d.imageUrl || null;

    return {
      title: d.title || "Proyecto",
      description: d.description || "",
      imageUrl,
      upvotes: launch.upvote_count || 0,
      week: launch.launch_week,
      username: prof.username,
      name: prof.name || prof.username,
      avatar: prof.image || null,
    };
  } catch {
    return null;
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
