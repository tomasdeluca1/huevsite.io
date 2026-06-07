import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface Feature {
  emoji: string;
  title: string;
  blurb: string;
  href: string;
}

interface ProductUpdateEmailProps {
  features: Feature[];
  unsubscribeUrl: string;
}

const ACCENT = "#C8FF00";
const SITE = "https://huevsite.io";

// One-time product update announcement ("comunicado") for the recent batch of
// features. Send via /api/admin/send-update once the updates are deployed.
export const ProductUpdateEmail: React.FC<ProductUpdateEmailProps> = ({ features, unsubscribeUrl }) => (
  <EmailLayout previewText="Novedades en huevsite: GitHub real, leaderboard, quests, +3 bloques y más">
    {/* HEADER */}
    <div
      style={{
        background: "linear-gradient(180deg, rgba(200, 255, 0, 0.1) 0%, transparent 100%)",
        padding: "40px",
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
          marginBottom: "12px",
        }}
      >
        Novedades en huevsite
      </div>
      <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2, color: "#fff" }}>
        Subimos un montón de cosas nuevas 🥚
      </h2>
      <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#a1a1aa", margin: "0 auto", maxWidth: "480px" }}>
        Estuvimos construyendo fuerte. Acá va lo nuevo, todo pensado para que tu perfil tenga más señal real y la comunidad se mueva más.
      </p>
    </div>

    {/* FEATURES */}
    <div style={{ padding: "28px 0 8px" }}>
      {features.map((f, i) => (
        <a
          key={i}
          href={f.href}
          style={{
            display: "block",
            textDecoration: "none",
            border: "1px solid #1a1a1a",
            borderRadius: "16px",
            padding: "18px 20px",
            marginBottom: "12px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ fontSize: "17px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
            {f.emoji} {f.title}
          </div>
          <div style={{ fontSize: "14px", lineHeight: 1.6, color: "#a1a1aa" }}>{f.blurb}</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: ACCENT, marginTop: "8px" }}>Leer más →</div>
        </a>
      ))}
    </div>

    {/* CTA */}
    <div style={{ textAlign: "center", marginTop: "20px", marginBottom: "24px" }}>
      <a
        href={`${SITE}/dashboard`}
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
        Entrar a mi dashboard →
      </a>
    </div>

    {/* UNSUBSCRIBE */}
    <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "20px", textAlign: "center" }}>
      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#52525b", margin: 0 }}>
        Recibís este email porque tenés una cuenta en huevsite.io.{" "}
        <a href={unsubscribeUrl} style={{ color: "#71717a", textDecoration: "underline" }}>
          Darme de baja de estos avisos
        </a>
        .
      </p>
    </div>
  </EmailLayout>
);
