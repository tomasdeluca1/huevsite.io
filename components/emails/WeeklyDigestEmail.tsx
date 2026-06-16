import * as React from "react";
import { EmailLayout } from "./EmailLayout";
import { EmailCtaStrip } from "./EmailCtaStrip";

interface Mover {
  name: string;
  username: string;
  delta: number;
}

interface FeaturedProject {
  title: string;
  username: string;
}

interface WeeklyDigestEmailProps {
  weekLabel: string;
  movers: Mover[];
  newProjectsCount: number;
  featuredProjects: FeaturedProject[];
  news: { title: string; slug: string } | null;
  unsubscribeUrl: string;
}

const ACCENT = "#C8FF00";
const SITE = "https://huevsite.io";

export const WeeklyDigestEmail: React.FC<WeeklyDigestEmailProps> = ({
  weekLabel,
  movers,
  newProjectsCount,
  featuredProjects,
  news,
  unsubscribeUrl,
}) => (
  <EmailLayout previewText={`Resumen de la comunidad — ${weekLabel}`}>
    {/* HEADER */}
    <div
      style={{
        background: "linear-gradient(180deg, rgba(200, 255, 0, 0.1) 0%, transparent 100%)",
        padding: "36px",
        borderRadius: "24px",
        textAlign: "center",
        border: "1px solid rgba(200, 255, 0, 0.2)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontFamily: "monospace",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: ACCENT,
          marginBottom: "10px",
        }}
      >
        Resumen semanal · {weekLabel}
      </div>
      <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.2, color: "#fff" }}>
        Lo que pasó en la comunidad 🥚
      </h2>
      <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#a1a1aa", margin: 0 }}>
        Quién subió, qué se lanzó y la última novedad de huevsite.
      </p>
    </div>

    {/* TOP MOVERS */}
    {movers.length > 0 && (
      <div style={{ padding: "28px 0 8px" }}>
        <h3 style={{ color: "#fff", fontSize: "18px", margin: "0 0 14px" }}>🏆 Los que más subieron esta semana</h3>
        {movers.map((m, i) => (
          <a
            key={m.username}
            href={`${SITE}/${m.username}`}
            style={{
              display: "block",
              textDecoration: "none",
              border: "1px solid #1a1a1a",
              borderRadius: "14px",
              padding: "14px 16px",
              marginBottom: "8px",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>
              {i === 0 ? "👑" : i === 1 ? "🥈" : "🥉"} {m.name}
            </span>
            <span style={{ color: "#71717a", fontSize: "13px" }}> · @{m.username}</span>
            <span style={{ color: ACCENT, fontWeight: 800, fontSize: "14px", float: "right" }}>+{m.delta} pts</span>
          </a>
        ))}
      </div>
    )}

    {/* NEW PROJECTS */}
    {newProjectsCount > 0 && (
      <div style={{ padding: "20px 0 8px" }}>
        <h3 style={{ color: "#fff", fontSize: "18px", margin: "0 0 8px" }}>
          🚀 {newProjectsCount} {newProjectsCount === 1 ? "proyecto nuevo" : "proyectos nuevos"} esta semana
        </h3>
        {featuredProjects.length > 0 && (
          <ul style={{ fontSize: "15px", lineHeight: 1.7, color: "#a1a1aa", margin: "4px 0 0", paddingLeft: "20px" }}>
            {featuredProjects.map((p, i) => (
              <li key={i} style={{ marginBottom: "4px" }}>
                <strong style={{ color: "#fff" }}>{p.title}</strong> — por{" "}
                <a href={`${SITE}/${p.username}`} style={{ color: ACCENT, textDecoration: "none" }}>
                  @{p.username}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    )}

    {/* NEWS */}
    {news && (
      <div style={{ padding: "20px 0 8px" }}>
        <h3 style={{ color: "#fff", fontSize: "18px", margin: "0 0 8px" }}>✨ Novedad de la semana</h3>
        <a
          href={`${SITE}/blog/${news.slug}`}
          style={{ color: ACCENT, fontSize: "16px", fontWeight: 700, textDecoration: "none" }}
        >
          {news.title} →
        </a>
      </div>
    )}

    {/* CTA */}
    <div style={{ textAlign: "center", marginTop: "28px", marginBottom: "20px" }}>
      <a
        href={`${SITE}/leaderboard?utm_source=email&utm_medium=email&utm_campaign=weekly-digest&utm_content=leaderboard`}
        style={{
          backgroundColor: ACCENT,
          color: "#000",
          padding: "16px 32px",
          borderRadius: "12px",
          fontWeight: "bold",
          textDecoration: "none",
          display: "inline-block",
          fontSize: "16px",
        }}
      >
        Ver el leaderboard →
      </a>
    </div>

    {/* QUICK ACTIONS */}
    <EmailCtaStrip campaign="weekly-digest" />

    {/* UNSUBSCRIBE */}
    <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "20px", textAlign: "center" }}>
      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#52525b", margin: 0 }}>
        Recibís este resumen porque tenés una cuenta en huevsite.io.{" "}
        <a href={unsubscribeUrl} style={{ color: "#71717a", textDecoration: "underline" }}>
          Darme de baja del resumen semanal
        </a>
        .
      </p>
    </div>
  </EmailLayout>
);
