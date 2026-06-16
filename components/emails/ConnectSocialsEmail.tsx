import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface ConnectSocialsEmailProps {
  firstName: string;      // marcador reemplazado por usuario en la ruta de envío
  ctaHref: string;
  unsubscribeUrl: string;
}

const ACCENT = "#C8FF00";

// Comunicado-nudge para usuarios SIN redes sociales conectadas en su huevsite.
// Los invita a agregar el bloque de Redes. Se manda vía /api/admin/send-social-nudge.
export const ConnectSocialsEmail: React.FC<ConnectSocialsEmailProps> = ({
  firstName,
  ctaHref,
  unsubscribeUrl,
}) => (
  <EmailLayout previewText="Tu huevsite no tiene tus redes — y es lo que hace que te sigan 🔗">
    {/* HERO */}
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
        // un consejo rápido
      </div>
      <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.25, color: "#fff" }}>
        Falta lo que hace que te sigan: tus redes 🔗
      </h2>
      <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#a1a1aa", margin: "0 auto", maxWidth: "480px" }}>
        Notamos que tu huevsite todavía no tiene conectadas tus redes (Twitter/X, LinkedIn, GitHub, las que uses).
      </p>
    </div>

    {/* CUERPO */}
    <div style={{ padding: "30px 4px 8px" }}>
      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#d4d4d8", margin: "0 0 16px" }}>
        Hola, {firstName} 👋
      </p>
      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#a1a1aa", margin: "0 0 16px" }}>
        Cuando alguien cae en tu perfil —un recruiter, un cliente, otro builder— lo primero que busca es
        cómo seguirte. Si no encuentra tus redes, se va y probablemente no vuelva.
      </p>
      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#a1a1aa", margin: "0 0 16px" }}>
        Agregar tus redes toma <strong style={{ color: "#fff" }}>menos de un minuto</strong> y cambia mucho:
      </p>
      <ul style={{ fontSize: "15px", lineHeight: 1.8, color: "#a1a1aa", margin: "0 0 8px", paddingLeft: "20px" }}>
        <li>Te siguen y te escriben desde tu perfil, sin fricción.</li>
        <li>Tu huevsite se ve completo y serio —no a medio armar.</li>
        <li>Sumás un bloque más, y eso también empuja tu Builder Score.</li>
      </ul>
    </div>

    {/* CTA */}
    <div style={{ textAlign: "center", marginTop: "20px", marginBottom: "24px" }}>
      <a
        href={ctaHref}
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
        Agregar mis redes →
      </a>
      <p style={{ fontSize: "12px", fontFamily: "monospace", color: "#52525b", marginTop: "12px" }}>
        Entrá al dashboard → bloque "Redes Sociales"
      </p>
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
