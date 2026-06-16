import * as React from "react";

const ACCENT = "#C8FF00";
const SITE = "https://huevsite.io";

/**
 * Strip reusable de "acciones rápidas" para los emails recurrentes (digests).
 * Empuja las acciones de mayor valor — testimonio (+50 al score), Pro y activar
 * el perfil — con UTMs por campaña para atribución en umami / Lemon.
 */
export function EmailCtaStrip({ campaign }: { campaign: string }) {
  const utm = (content: string) =>
    `utm_source=email&utm_medium=email&utm_campaign=${campaign}&utm_content=${content}`;

  const actions = [
    {
      emoji: "💬",
      label: "Dejá tu testimonio",
      hint: "+50 al Builder Score",
      href: `${SITE}/testimonio?${utm("testimonio")}`,
    },
    {
      emoji: "⚡",
      label: "Pasate a Pro",
      hint: "destacá y que te encuentren",
      href: `${SITE}/precios?${utm("pro")}`,
    },
    {
      emoji: "✏️",
      label: "Completá tu board",
      hint: "sumá bloques y conectá tus redes",
      href: `${SITE}/dashboard?${utm("dashboard")}`,
    },
  ];

  return (
    <div style={{ padding: "8px 0 4px" }}>
      <div
        style={{
          fontSize: "11px",
          fontFamily: "monospace",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#71717a",
          marginBottom: "12px",
        }}
      >
        // sumá esta semana
      </div>
      {actions.map((a, i) => (
        <a
          key={i}
          href={a.href}
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
            {a.emoji} {a.label}
          </span>
          <span style={{ color: "#71717a", fontSize: "13px" }}> · {a.hint}</span>
          <span style={{ color: ACCENT, fontWeight: 800, fontSize: "16px", float: "right" }}>→</span>
        </a>
      ))}
    </div>
  );
}
