/* Per-profile OG card, "Hype poster" design (picked by Tomás, Nov 2026).
 *
 * Layout (1200x630). WhatsApp crops a centered 1:1 square (x 285..915), so the
 * key content (photo, name, score, @user) lives inside x 325..875 / y 60..570.
 * Sides hold secondary stuff only (stat stickers, logo, URL).
 *   photo     circle d=210 centered (600, 252)        -> y 147..357
 *   badges    arc r=162 above the photo, -150..-30deg -> top >= 60
 *   stickers  BOTW (bottom-left) + SCORE ticket (bottom-right), end y <= 384
 *   name      y 420.., @user pill right under it
 *
 * Satori rules respected: every multi-child div is display:flex, gradients
 * carry an explicit angle, no CSS filters, every glyph that the fonts lack
 * (stars, badge icons) is inline SVG. Texture is a cheap tiled CSS gradient
 * (the earlier 1100-dot SVG grain cost ~3s per render).
 */
import { ProfileBadge, ProfileData } from "@/lib/profile-types";
import { BadgeIcon } from "@/lib/og/badge-icons";
import { OgLogo, truncate } from "@/lib/og/shared";

export const LIME = "#C8FF00";
export const INK = "#050505";

// Same brand gradients as BADGE_VISUALS in components/profile/BadgeItem.tsx,
// keyed by every ProfileBadgeKey in lib/profile-types.ts.
export const BADGE_OG_VISUALS: Record<string, { bg: string }> = {
  profile_complete: { bg: "linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)" },
  active_this_week: { bg: "linear-gradient(135deg, #10b981, #34d399, #6ee7b7)" },
  twitter_connected: { bg: "linear-gradient(135deg, #1d9bf0, #0ea5e9, #38bdf8)" },
  github_linked: { bg: "linear-gradient(135deg, #6e7681, #8b949e, #c9d1d9)" },
  multi_block: { bg: "linear-gradient(135deg, #a855f7, #7c3aed, #6366f1)" },
  rising_builder: { bg: "linear-gradient(135deg, #f59e0b, #f97316, #ef4444)" },
  builder_of_the_week: { bg: "linear-gradient(135deg, #f59e0b, #fbbf24, #fde68a)" },
  premium: { bg: "linear-gradient(135deg, #84cc16, #C8FF00, #bef264)" },
  ambassador: { bg: "linear-gradient(135deg, #ec4899, #a855f7, #d946ef)" },
};

export type RealStat = { label: string; value: number };

/** Real counts derived from ProfileData only, never invented. Zero = omitted. */
export function computeRealStats(profile: ProfileData): RealStat[] {
  const blocks = (profile.blocks || []) as any[];
  const projects = blocks.filter((b) => b.type === "project").length;
  const githubBlock = blocks.find((b) => b.type === "github");
  const githubStars = githubBlock?.stats?.stars || 0;
  const badgesCount = (profile.badges || []).length;
  const stats: RealStat[] = [];
  if (projects > 0) stats.push({ label: "Proyectos", value: projects });
  if (githubStars > 0) stats.push({ label: "Stars", value: githubStars });
  if (badgesCount > 0) stats.push({ label: "Badges", value: badgesCount });
  return stats;
}

const CX = 600;
const CY = 252;
const PHOTO = 210;
const ORBIT = 162;
const BADGE = 60;
const HALO = BADGE + 28 + 4;

function nameSize(name: string) {
  const n = name.length;
  if (n <= 10) return 82;
  if (n <= 14) return 70;
  if (n <= 18) return 58;
  if (n <= 22) return 50;
  return 44; // long names wrap to 2 lines at most (550px box)
}

function Rays({ count = 40 }: { count?: number }) {
  const R = 760;
  const pts = Array.from({ length: count / 2 }, (_, i) => {
    const a0 = ((i * 2) / count) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2) / count / 2.6;
    return `${CX},${CY} ${(CX + R * Math.cos(a0)).toFixed(0)},${(CY + R * Math.sin(a0)).toFixed(0)} ${(CX + R * Math.cos(a1)).toFixed(0)},${(CY + R * Math.sin(a1)).toFixed(0)}`;
  });
  return (
    <svg width={1200} height={630} viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
      {pts.map((p, i) => (
        <polygon key={i} points={p} fill="rgba(200,255,0,0.075)" />
      ))}
    </svg>
  );
}

function Starburst({ outer, inner, points, fill, stroke, rotate = 0 }: { outer: number; inner: number; points: number; fill?: string; stroke?: string; rotate?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 + (rotate * Math.PI) / 180;
    pts.push(`${(outer + r * Math.cos(a)).toFixed(1)},${(outer + r * Math.sin(a)).toFixed(1)}`);
  }
  const size = outer * 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", left: CX - outer, top: CY - outer }}>
      <polygon points={pts.join(" ")} fill={fill || "none"} stroke={stroke || "none"} strokeWidth={stroke ? 3 : 0} />
    </svg>
  );
}

function StarIcon({ size = 20, color = INK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 1.5 L14.9 8.6 L22.5 9.2 L16.7 14.1 L18.5 21.6 L12 17.6 L5.5 21.6 L7.3 14.1 L1.5 9.2 L9.1 8.6 Z" fill={color} />
    </svg>
  );
}

function GlowBadge({ badge, size }: { badge: ProfileBadge; size: number }) {
  const v = BADGE_OG_VISUALS[badge.key];
  const halo = size + 28;
  return (
    <div style={{ width: halo, height: halo, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: `radial-gradient(circle at ${halo / 2}px ${halo / 2}px, rgba(200,255,0,0.55) 0%, rgba(200,255,0,0.18) 55%, rgba(5,5,5,0) 72%)` }}>
    <div style={{ display: "flex", padding: 2, borderRadius: 999, background: LIME }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: v?.bg || "linear-gradient(135deg, #3f3f46, #71717a)",
        border: `4px solid ${INK}`,
      }}
    >
      <BadgeIcon badgeKey={badge.key} size={Math.round(size * 0.46)} />
    </div>
    </div>
    </div>
  );
}

function StatSticker({ stat, side, rotate }: { stat: RealStat; side: "left" | "right"; rotate: number }) {
  return (
    <div
      style={{
        position: "absolute",
        [side]: 70,
        top: 250,
        width: 170,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 0 12px",
        background: LIME,
        borderRadius: 20,
        border: `4px solid ${INK}`,
        outline: "none",
        transform: `rotate(${rotate}deg)`,
        boxShadow: `0 0 0 3px ${LIME}`,
      } as any}
    >
      <span style={{ display: "flex", fontFamily: "JetBrainsMono", fontSize: 60, fontWeight: 700, color: INK, lineHeight: 1 }}>{stat.value}</span>
      <span style={{ display: "flex", marginTop: 6, fontFamily: "JetBrainsMono", fontSize: 15, fontWeight: 700, color: INK, letterSpacing: "0.14em", textTransform: "uppercase" }}>{stat.label}</span>
    </div>
  );
}

export type ProfileHypeProps = {
  username: string;
  displayName: string;
  score: number;
  isWinner: boolean;
  avatarSrc: string | null;
  badges: ProfileBadge[];
  stats: RealStat[];
  fontLoaded: boolean;
};

export function ProfileHypeCard({ username, displayName, score, isWinner, avatarSrc, badges, stats, fontLoaded }: ProfileHypeProps) {
  const orbit = badges.slice(0, 5);
  const angles = orbit.length === 1 ? [-90] : orbit.map((_, i) => -150 + (120 / (orbit.length - 1)) * i);
  const name = truncate(displayName, 34);
  const leftStat = stats.find((s) => s.label === "Proyectos") || stats[0];
  const rightStat = stats.find((s) => s !== leftStat && s.label === "Stars") || stats.find((s) => s !== leftStat);
  const handle = truncate(username, 24);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: INK, fontFamily: fontLoaded ? "Bricolage" : "sans-serif" }}>
      <Rays />
      {/* grain: one tiled dot layer (cheap, replaces the per-dot SVG) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)", backgroundSize: "23px 19px" }} />

      <Starburst outer={166} inner={142} points={22} stroke={LIME} rotate={4} />
      <Starburst outer={150} inner={126} points={20} fill={LIME} />
      <div style={{ position: "absolute", left: CX - 260, top: CY - 260, width: 520, height: 520, display: "flex", backgroundImage: "radial-gradient(circle at 260px 260px, rgba(200,255,0,0.45) 0%, rgba(200,255,0,0.12) 40%, rgba(5,5,5,0) 70%)" }} />

      {/* photo */}
      <div style={{ position: "absolute", left: CX - PHOTO / 2, top: CY - PHOTO / 2, width: PHOTO, height: PHOTO, display: "flex", borderRadius: 999, border: `7px solid ${INK}`, background: "#111" }}>
        {avatarSrc ? (
          <img src={avatarSrc} width={PHOTO - 14} height={PHOTO - 14} style={{ width: PHOTO - 14, height: PHOTO - 14, borderRadius: 999, objectFit: "cover" }} />
        ) : (
          <div style={{ width: PHOTO - 14, height: PHOTO - 14, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "#111", color: LIME, fontSize: 110, fontWeight: 900 }}>
            {(name.charAt(0) || "?").toUpperCase()}
          </div>
        )}
      </div>

      {/* badge orbit */}
      {orbit.map((b, i) => {
        const a = (angles[i] * Math.PI) / 180;
        const x = CX + ORBIT * Math.cos(a);
        const y = CY + ORBIT * Math.sin(a);
        return (
          <div key={b.key} style={{ position: "absolute", left: x - HALO / 2, top: y - HALO / 2, display: "flex" }}>
            <GlowBadge badge={b} size={BADGE - 4} />
          </div>
        );
      })}

      {isWinner && (
        <div style={{ position: "absolute", left: 380, top: 312, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 10px 12px", background: LIME, borderRadius: 14, border: `3px solid ${INK}`, transform: "rotate(-10deg)", boxShadow: `0 0 0 2px ${LIME}` }}>
          <StarIcon size={30} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex", fontSize: 15, fontWeight: 900, color: INK, letterSpacing: "0.06em", lineHeight: 1 }}>BUILDER</span>
            <span style={{ display: "flex", fontSize: 15, fontWeight: 900, color: INK, letterSpacing: "0.06em", lineHeight: 1.1 }}>DE LA SEMANA</span>
          </div>
        </div>
      )}

      {/* score ticket */}
      <div style={{ position: "absolute", left: 688, top: 300, width: 150, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 6px", background: INK, border: `3px solid ${LIME}`, borderRadius: 16, transform: "rotate(8deg)" }}>
        <span style={{ display: "flex", fontFamily: "JetBrainsMono", fontSize: 13, fontWeight: 700, color: LIME, letterSpacing: "0.22em" }}>SCORE</span>
        <span style={{ display: "flex", fontFamily: "JetBrainsMono", fontSize: score >= 10000 ? 36 : 46, fontWeight: 700, color: "white", lineHeight: 1 }}>{score}</span>
      </div>

      {/* dark backdrop so rays never cross the name (small gradient = cheap) */}
      <div style={{ position: "absolute", left: 260, top: 380, width: 680, height: 230, display: "flex", backgroundImage: "radial-gradient(ellipse at 340px 115px, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.85) 45%, rgba(5,5,5,0) 70%)" }} />

      {/* name + handle */}
      <div style={{ position: "absolute", left: 325, top: 420, width: 550, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 550, justifyContent: "center", textAlign: "center", fontSize: nameSize(name), fontWeight: 900, color: "white", letterSpacing: "-0.035em", lineHeight: 1 }}>
          {name}
        </div>
        <div style={{ display: "flex", marginTop: 12, alignItems: "center", padding: "6px 16px", borderRadius: 999, background: "rgba(5,5,5,0.85)", border: `2px solid ${LIME}` }}>
          <span style={{ display: "flex", fontFamily: "JetBrainsMono", fontSize: 22, fontWeight: 700, color: LIME }}>@{handle}</span>
        </div>
      </div>

      {leftStat && <StatSticker stat={leftStat} side="left" rotate={-6} />}
      {rightStat && <StatSticker stat={rightStat} side="right" rotate={6} />}
      <div style={{ position: "absolute", left: 64, top: 62, display: "flex" }}>
        <OgLogo height={30} />
      </div>
      <div style={{ position: "absolute", right: 64, top: 66, display: "flex", fontFamily: "JetBrainsMono", fontSize: 16, fontWeight: 700, color: LIME, letterSpacing: "0.12em" }}>
        HUEVSITE.IO/{truncate(username, 14).toUpperCase()}
      </div>
    </div>
  );
}
