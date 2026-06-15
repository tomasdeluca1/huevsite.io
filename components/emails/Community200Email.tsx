import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface Community200EmailProps {
  memberCount: number;
  firstName: string;      // marcador reemplazado por usuario en la ruta de envío
  proHref: string;
  testimonialHref: string;
  unsubscribeUrl: string;
}

const ACCENT = "#C8FF00";

// Comunicado de hito: la comunidad llegó a N huevsites.
// CTA primario: hacerse Pro. CTA secundario: dejar un testimonio.
// Se manda vía /api/admin/send-milestone una sola vez.
export const Community200Email: React.FC<Community200EmailProps> = ({
  memberCount,
  firstName,
  proHref,
  testimonialHref,
  unsubscribeUrl,
}) => (
  <EmailLayout previewText={`Somos ${memberCount} huevsites. Gracias por estar 🥚`}>
    {/* HERO */}
    <div
      style={{
        background: "linear-gradient(180deg, rgba(200, 255, 0, 0.12) 0%, transparent 100%)",
        padding: "44px 40px",
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
          marginBottom: "16px",
        }}
      >
        // un hito de la comunidad
      </div>
      <div style={{ fontSize: "72px", fontWeight: 900, lineHeight: 1, color: "#fff", letterSpacing: "-0.04em" }}>
        {memberCount}
      </div>
      <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "12px 0 0", lineHeight: 1.2, color: "#fff" }}>
        huevsites en la comunidad 🥚
      </h2>
    </div>

    {/* CARTA */}
    <div style={{ padding: "32px 4px 8px" }}>
      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#d4d4d8", margin: "0 0 16px" }}>
        Hola, {firstName} 👋
      </p>
      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#a1a1aa", margin: "0 0 16px" }}>
        Quería contarte algo lindo: <strong style={{ color: "#fff" }}>ya somos {memberCount} builders</strong> con
        su huevsite armado. Hace unos meses esto era una idea media loca y un dominio raro. Hoy es una comunidad
        de gente que construye en serio — y vos sos parte de eso.
      </p>
      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#a1a1aa", margin: "0 0 16px" }}>
        Gracias, en serio. Cada perfil que se suma hace que la red valga más para todos: más builders para
        descubrir, más proyectos para mostrar, más gente con la que cruzarse.
      </p>
      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#a1a1aa", margin: "0 0 4px" }}>
        Si querés darme una mano para llegar a los próximos 200, hay dos cosas que mueven la aguja un montón 👇
      </p>
    </div>

    {/* CTA 1 — PRO */}
    <div
      style={{
        border: `1px solid rgba(200, 255, 0, 0.25)`,
        borderRadius: "18px",
        padding: "24px",
        marginTop: "20px",
        background: "rgba(200, 255, 0, 0.04)",
      }}
    >
      <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
        ⚡ Hacete Pro
      </div>
      <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#a1a1aa", margin: "0 0 18px" }}>
        Es lo que mantiene esto vivo y sin anuncios. Desbloqueás bloques sin límite, dominio propio,
        sub-sites y todo lo que viene. Si esto te sirve, ser Pro es la forma más directa de bancarlo.
      </p>
      <a
        href={proHref}
        style={{
          backgroundColor: ACCENT,
          color: "#000",
          padding: "14px 28px",
          borderRadius: "12px",
          fontWeight: "bold",
          textDecoration: "none",
          display: "inline-block",
          fontSize: "15px",
        }}
      >
        Pasarme a Pro →
      </a>
    </div>

    {/* CTA 2 — TESTIMONIO */}
    <div
      style={{
        border: "1px solid #1a1a1a",
        borderRadius: "18px",
        padding: "24px",
        marginTop: "14px",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
        💬 Dejá tu testimonio
      </div>
      <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#a1a1aa", margin: "0 0 18px" }}>
        Dos líneas sobre cómo te sirve huevsite. Lo atamos a tu cuenta y, si nos gusta, lo mostramos en la
        home con tu nombre, tu foto y un link a tu perfil. Prueba social para vos y para la comunidad.
      </p>
      <a
        href={testimonialHref}
        style={{
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#fff",
          padding: "13px 28px",
          borderRadius: "12px",
          fontWeight: "bold",
          textDecoration: "none",
          display: "inline-block",
          fontSize: "15px",
        }}
      >
        Dejar mi testimonio →
      </a>
    </div>

    {/* FIRMA */}
    <div style={{ padding: "28px 4px 0" }}>
      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#a1a1aa", margin: 0 }}>
        Gracias por construir con nosotros.
        <br />
        — Tomás, fundador de huevsite
      </p>
    </div>

    {/* UNSUBSCRIBE */}
    <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "20px", marginTop: "28px", textAlign: "center" }}>
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
