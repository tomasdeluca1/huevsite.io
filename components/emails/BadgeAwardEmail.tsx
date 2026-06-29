import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface BadgeAwardEmailProps {
  name: string;
  username: string;
}

// Sent to Builder de la Semana winners (one-time to past winners + future ones)
// so they can drop their official laurel badge on their portfolio / personal site.
export const BadgeAwardEmail: React.FC<Readonly<BadgeAwardEmailProps>> = ({ name, username }) => {
  const badge = `https://huevsite.io/api/badge/bdls/${username}?v=3`;
  const profile = `https://huevsite.io/${username}`;
  const html = `<a href="${profile}"><img src="${badge}" alt="Builder de la Semana en huevsite.io" width="240" /></a>`;

  return (
    <EmailLayout previewText={`${name}, tu badge de Builder de la Semana ya está listo`}>
      <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
        <div style={{ fontSize: "44px", marginBottom: "12px" }}>🏆</div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.15 }}>
          Ganaste Builder de la Semana
        </h2>
        <p style={{ fontSize: "16px", color: "#a1a1aa", lineHeight: 1.6, margin: 0 }}>
          Hola <strong>{name}</strong>, armamos un badge oficial para que lo lleves a tu portfolio o
          web personal y muestres que fuiste <strong>Builder de la Semana</strong> en huevsite.io.
        </p>
      </div>

      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        {/* branded dark-card badge sits directly on the dark email background */}
        <img src={badge} alt="Builder de la Semana" width={340} style={{ maxWidth: "100%", height: "auto" }} />
      </div>

      <p style={{ fontSize: "15px", color: "#a1a1aa", lineHeight: 1.6, margin: "0 0 16px", textAlign: "center" }}>
        Copiá el código (HTML o Markdown) con un solo click desde tu dashboard:
      </p>

      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <a
          href="https://huevsite.io/dashboard"
          style={{
            backgroundColor: "#C8FF00",
            color: "#000000",
            padding: "16px 32px",
            borderRadius: "12px",
            fontWeight: "bold",
            textDecoration: "none",
            display: "inline-block",
            fontSize: "16px",
          }}
        >
          📋 Copiar mi badge →
        </a>
      </div>

      <p style={{ fontSize: "13px", color: "#71717a", lineHeight: 1.6, margin: "0 0 8px" }}>
        ¿Lo preferís a mano? Pegá este HTML en tu sitio:
      </p>
      <code
        style={{
          display: "block",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px",
          padding: "12px",
          fontSize: "12px",
          color: "#99a",
          wordBreak: "break-all",
          fontFamily: "monospace",
        }}
      >
        {html}
      </code>
    </EmailLayout>
  );
};
